use crate::models::member::{CreateMemberInput, Member, UpdateMemberInput};
use rusqlite::params;
use tauri::State;
use crate::DbConn;

/// 查询所有成员
#[tauri::command]
pub fn list_members(db: State<DbConn>) -> Result<Vec<Member>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, role, daily_hours, created_at FROM members ORDER BY id")
        .map_err(|e| e.to_string())?;

    let members = stmt
        .query_map([], |row| {
            Ok(Member {
                id: row.get(0)?,
                name: row.get(1)?,
                role: row.get(2)?,
                daily_hours: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(members)
}

/// 创建成员
#[tauri::command]
pub fn create_member(db: State<DbConn>, input: CreateMemberInput) -> Result<Member, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
        params![input.name, input.role, input.daily_hours],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let member = conn
        .query_row(
            "SELECT id, name, role, daily_hours, created_at FROM members WHERE id = ?1",
            params![id],
            |row| {
                Ok(Member {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    role: row.get(2)?,
                    daily_hours: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(member)
}

/// 更新成员
#[tauri::command]
pub fn update_member(db: State<DbConn>, input: UpdateMemberInput) -> Result<Member, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE members SET name=?1, role=?2, daily_hours=?3 WHERE id=?4",
        params![input.name, input.role, input.daily_hours, input.id],
    )
    .map_err(|e| e.to_string())?;

    let member = conn
        .query_row(
            "SELECT id, name, role, daily_hours, created_at FROM members WHERE id = ?1",
            params![input.id],
            |row| {
                Ok(Member {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    role: row.get(2)?,
                    daily_hours: row.get(3)?,
                    created_at: row.get(4)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(member)
}

/// 删除成员（有关联数据时返回错误）
#[tauri::command]
pub fn delete_member(db: State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // 检查关联任务
    let task_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 检查关联工时记录
    let entry_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM time_entries WHERE member_id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if task_count > 0 || entry_count > 0 {
        return Err("请先解除该成员的所有任务分配和工时记录".to_string());
    }

    conn.execute("DELETE FROM members WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db;

    fn setup() -> DbConn {
        let conn = init_db(":memory:").unwrap();
        Mutex::new(conn)
    }

    #[test]
    fn test_create_member_returns_member_with_id() {
        let db = setup();
        let conn = db.lock().unwrap();
        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
            params!["张三", "开发", 8.0],
        )
        .unwrap();
        let id = conn.last_insert_rowid();
        assert_eq!(id, 1);

        let name: String = conn
            .query_row("SELECT name FROM members WHERE id=1", [], |row| row.get(0))
            .unwrap();
        assert_eq!(name, "张三");
    }

    #[test]
    fn test_delete_member_with_associated_task_returns_error() {
        let db = setup();
        let conn = db.lock().unwrap();

        // 创建项目
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            params!["项目A", 100.0],
        )
        .unwrap();

        // 创建成员
        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
            params!["张三", "开发", 8.0],
        )
        .unwrap();
        let member_id = conn.last_insert_rowid();

        // 创建关联任务
        conn.execute(
            "INSERT INTO tasks (project_id, title, assignee_id) VALUES (?1, ?2, ?3)",
            params![1, "需求评审", member_id],
        )
        .unwrap();

        // 验证有关联任务时不能删除
        let task_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?1",
                params![member_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(task_count, 1, "应有 1 个关联任务");
    }

    #[test]
    fn test_delete_member_without_associations_succeeds() {
        let db = setup();
        let conn = db.lock().unwrap();

        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
            params!["李四", "测试", 8.0],
        )
        .unwrap();
        let member_id = conn.last_insert_rowid();

        conn.execute("DELETE FROM members WHERE id = ?1", params![member_id])
            .unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM members WHERE id = ?1",
                params![member_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 0, "成员应已被删除");
    }
}
