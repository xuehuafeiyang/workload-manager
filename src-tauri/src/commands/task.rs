use crate::models::task::{CreateTaskInput, Task, UpdateTaskInput, UpdateTaskStatusInput};
use rusqlite::params;
use tauri::State;
use crate::DbConn;

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    let actual_hours: Option<f64> = row.get(9)?;
    let time_entry_hours: Option<f64> = row.get(10)?;
    // 有效实际工时：优先取 TimeEntry 汇总，否则取手动填写值
    let effective_actual_hours = match time_entry_hours {
        Some(h) if h > 0.0 => Some(h),
        _ => actual_hours,
    };
    Ok(Task {
        id: row.get(0)?,
        project_id: row.get(1)?,
        title: row.get(2)?,
        source: row.get(3)?,
        note: row.get(4).unwrap_or_default(),
        assignee_id: row.get(5)?,
        assignee_name: row.get(6)?,
        status: row.get(7)?,
        estimated_hours: row.get(8).unwrap_or(0.0),
        actual_hours,
        time_entry_hours,
        effective_actual_hours,
        created_at: row.get(11)?,
    })
}

/// 查询项目下的任务（含 TimeEntry 汇总）
#[tauri::command]
pub fn list_tasks(db: State<DbConn>, project_id: i64) -> Result<Vec<Task>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.project_id, t.title, t.source, t.note,
                    t.assignee_id, m.name as assignee_name, t.status,
                    t.estimated_hours, t.actual_hours,
                    COALESCE(SUM(te.hours), 0) as time_entry_hours,
                    t.created_at
             FROM tasks t
             LEFT JOIN members m ON t.assignee_id = m.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             WHERE t.project_id = ?1
             GROUP BY t.id
             ORDER BY t.id",
        )
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map(params![project_id], |row| row_to_task(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tasks)
}

/// 创建任务
#[tauri::command]
pub fn create_task(db: State<DbConn>, input: CreateTaskInput) -> Result<Task, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO tasks (project_id, title, source, note, assignee_id, estimated_hours)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            input.project_id,
            input.title,
            input.source,
            input.note.unwrap_or_default(),
            input.assignee_id,
            input.estimated_hours.unwrap_or(0.0)
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let task = conn
        .query_row(
            "SELECT t.id, t.project_id, t.title, t.source, t.note,
                    t.assignee_id, m.name as assignee_name, t.status,
                    t.estimated_hours, t.actual_hours,
                    0.0 as time_entry_hours,
                    t.created_at
             FROM tasks t
             LEFT JOIN members m ON t.assignee_id = m.id
             WHERE t.id = ?1",
            params![id],
            |row| row_to_task(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}

/// 更新任务
#[tauri::command]
pub fn update_task(db: State<DbConn>, input: UpdateTaskInput) -> Result<Task, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // 若 source 未提供，保留原值
    if let Some(ref source) = input.source {
        conn.execute(
            "UPDATE tasks SET title=?1, source=?2, note=?3, assignee_id=?4, estimated_hours=?5, actual_hours=?6 WHERE id=?7",
            params![
                input.title,
                source,
                input.note.unwrap_or_default(),
                input.assignee_id,
                input.estimated_hours.unwrap_or(0.0),
                input.actual_hours,
                input.id
            ],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE tasks SET title=?1, note=?2, assignee_id=?3, estimated_hours=?4, actual_hours=?5 WHERE id=?6",
            params![
                input.title,
                input.note.unwrap_or_default(),
                input.assignee_id,
                input.estimated_hours.unwrap_or(0.0),
                input.actual_hours,
                input.id
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    let task = conn
        .query_row(
            "SELECT t.id, t.project_id, t.title, t.source, t.note,
                    t.assignee_id, m.name as assignee_name, t.status,
                    t.estimated_hours, t.actual_hours,
                    COALESCE(SUM(te.hours), 0) as time_entry_hours,
                    t.created_at
             FROM tasks t
             LEFT JOIN members m ON t.assignee_id = m.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             WHERE t.id = ?1
             GROUP BY t.id",
            params![input.id],
            |row| row_to_task(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}

/// 变更任务状态（in_progress 时校验成员并发任务）
#[tauri::command]
pub fn update_task_status(
    db: State<DbConn>,
    input: UpdateTaskStatusInput,
) -> Result<Task, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // 业务规则：同一成员同时只能有 1 个 in_progress 任务
    if input.status == "in_progress" {
        let assignee_id: Option<i64> = conn
            .query_row(
                "SELECT assignee_id FROM tasks WHERE id = ?1",
                params![input.id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        if let Some(assignee_id) = assignee_id {
            let count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?1 AND status = 'in_progress' AND id != ?2",
                    params![assignee_id, input.id],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if count > 0 {
                return Err("该成员已有进行中的任务，请先完成或暂停当前任务".to_string());
            }
        }
    }

    conn.execute(
        "UPDATE tasks SET status=?1 WHERE id=?2",
        params![input.status, input.id],
    )
    .map_err(|e| e.to_string())?;

    let task = conn
        .query_row(
            "SELECT t.id, t.project_id, t.title, t.source, t.note,
                    t.assignee_id, m.name as assignee_name, t.status,
                    t.estimated_hours, t.actual_hours,
                    COALESCE(SUM(te.hours), 0) as time_entry_hours,
                    t.created_at
             FROM tasks t
             LEFT JOIN members m ON t.assignee_id = m.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             WHERE t.id = ?1
             GROUP BY t.id",
            params![input.id],
            |row| row_to_task(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(task)
}

/// 删除任务（先删关联工时记录，再删任务）
#[tauri::command]
pub fn delete_task(db: State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    // 先删关联的工时记录，避免外键约束失败
    conn.execute("DELETE FROM time_entries WHERE task_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db;

    fn setup() -> DbConn {
        let conn = init_db(":memory:").unwrap();
        // 插入测试数据
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            params!["项目A", 100.0],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
            params!["张三", "开发", 8.0],
        )
        .unwrap();
        Mutex::new(conn)
    }

    #[test]
    fn test_update_task_status_to_in_progress_blocks_second_task() {
        let db = setup();
        let conn = db.lock().unwrap();

        // 创建两个任务，都分配给张三（id=1）
        conn.execute(
            "INSERT INTO tasks (project_id, title, assignee_id, status) VALUES (1, '任务A', 1, 'todo')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO tasks (project_id, title, assignee_id, status) VALUES (1, '任务B', 1, 'todo')",
            [],
        )
        .unwrap();

        // 将任务A 改为 in_progress
        conn.execute(
            "UPDATE tasks SET status='in_progress' WHERE id=1",
            [],
        )
        .unwrap();

        // 验证张三已有 in_progress 任务
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM tasks WHERE assignee_id=1 AND status='in_progress' AND id != 2",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "张三应有 1 个进行中任务，阻止第二个");
    }

    #[test]
    fn test_task_time_entry_hours_aggregation() {
        let db = setup();
        let conn = db.lock().unwrap();

        // 创建任务
        conn.execute(
            "INSERT INTO tasks (project_id, title, assignee_id) VALUES (1, '任务C', 1)",
            [],
        )
        .unwrap();
        let task_id = conn.last_insert_rowid();

        // 录入两条工时
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (?1, 1, '2025-05-13', 2.0)",
            params![task_id],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (?1, 1, '2025-05-14', 3.0)",
            params![task_id],
        )
        .unwrap();

        // 验证汇总工时
        let total: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(hours), 0) FROM time_entries WHERE task_id = ?1",
                params![task_id],
                |row| row.get(0),
            )
            .unwrap();
        assert!((total - 5.0).abs() < f64::EPSILON, "汇总工时应为 5.0");
    }
}
