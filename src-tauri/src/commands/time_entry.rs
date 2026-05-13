use crate::models::time_entry::{
    CreateTimeEntryInput, ListTimeEntriesFilter, TimeEntry, UpdateTimeEntryInput,
};
use rusqlite::params;
use tauri::State;
use crate::DbConn;

fn row_to_entry(row: &rusqlite::Row) -> rusqlite::Result<TimeEntry> {
    Ok(TimeEntry {
        id: row.get(0)?,
        task_id: row.get(1)?,
        member_id: row.get(2)?,
        member_name: row.get(3)?,
        date: row.get(4)?,
        hours: row.get(5)?,
        created_at: row.get(6)?,
    })
}

/// 查询工时记录（支持多条件过滤）
#[tauri::command]
pub fn list_time_entries(
    db: State<DbConn>,
    filter: ListTimeEntriesFilter,
) -> Result<Vec<TimeEntry>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // 动态构建 WHERE 子句
    let mut conditions = vec!["1=1".to_string()];
    if filter.task_id.is_some() {
        conditions.push("te.task_id = ?".to_string());
    }
    if filter.member_id.is_some() {
        conditions.push("te.member_id = ?".to_string());
    }
    if filter.start_date.is_some() {
        conditions.push("te.date >= ?".to_string());
    }
    if filter.end_date.is_some() {
        conditions.push("te.date <= ?".to_string());
    }

    let sql = format!(
        "SELECT te.id, te.task_id, te.member_id, m.name as member_name,
                te.date, te.hours, te.created_at
         FROM time_entries te
         LEFT JOIN members m ON te.member_id = m.id
         WHERE {}
         ORDER BY te.date DESC, te.id DESC",
        conditions.join(" AND ")
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    // 收集参数
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    if let Some(v) = filter.task_id {
        param_values.push(Box::new(v));
    }
    if let Some(v) = filter.member_id {
        param_values.push(Box::new(v));
    }
    if let Some(v) = filter.start_date {
        param_values.push(Box::new(v));
    }
    if let Some(v) = filter.end_date {
        param_values.push(Box::new(v));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();

    let entries = stmt
        .query_map(params_refs.as_slice(), |row| row_to_entry(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(entries)
}

/// 创建工时记录
#[tauri::command]
pub fn create_time_entry(
    db: State<DbConn>,
    input: CreateTimeEntryInput,
) -> Result<TimeEntry, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (?1, ?2, ?3, ?4)",
        params![input.task_id, input.member_id, input.date, input.hours],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let entry = conn
        .query_row(
            "SELECT te.id, te.task_id, te.member_id, m.name as member_name,
                    te.date, te.hours, te.created_at
             FROM time_entries te
             LEFT JOIN members m ON te.member_id = m.id
             WHERE te.id = ?1",
            params![id],
            |row| row_to_entry(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(entry)
}

/// 更新工时记录
#[tauri::command]
pub fn update_time_entry(
    db: State<DbConn>,
    input: UpdateTimeEntryInput,
) -> Result<TimeEntry, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE time_entries SET hours=?1, date=?2 WHERE id=?3",
        params![input.hours, input.date, input.id],
    )
    .map_err(|e| e.to_string())?;

    let entry = conn
        .query_row(
            "SELECT te.id, te.task_id, te.member_id, m.name as member_name,
                    te.date, te.hours, te.created_at
             FROM time_entries te
             LEFT JOIN members m ON te.member_id = m.id
             WHERE te.id = ?1",
            params![input.id],
            |row| row_to_entry(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(entry)
}

/// 删除工时记录
#[tauri::command]
pub fn delete_time_entry(db: State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM time_entries WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db;

    fn setup() -> rusqlite::Connection {
        let conn = init_db(":memory:").unwrap();
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES ('项目A', 100.0)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES ('张三', '开发', 8.0)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO tasks (project_id, title) VALUES (1, '任务A')",
            [],
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_create_time_entry_stores_hours() {
        let conn = setup();
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (1, 1, '2025-05-13', 3.5)",
            [],
        )
        .unwrap();

        let hours: f64 = conn
            .query_row(
                "SELECT hours FROM time_entries WHERE id=1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!((hours - 3.5).abs() < f64::EPSILON);
    }

    #[test]
    fn test_filter_time_entries_by_task_id() {
        let conn = setup();
        // 创建第二个任务
        conn.execute(
            "INSERT INTO tasks (project_id, title) VALUES (1, '任务B')",
            [],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (1, 1, '2025-05-13', 2.0)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (2, 1, '2025-05-13', 4.0)",
            [],
        )
        .unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM time_entries WHERE task_id=1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "任务1 应只有 1 条工时记录");
    }
}
