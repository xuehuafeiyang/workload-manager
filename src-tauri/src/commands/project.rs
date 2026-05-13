use crate::models::project::{CreateProjectInput, Project, UpdateProjectInput};
use rusqlite::params;
use tauri::State;
use crate::DbConn;

fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<Project> {
    let consumed: f64 = row.get(9).unwrap_or(0.0);
    let budget: f64 = row.get(2)?;
    Ok(Project {
        id: row.get(0)?,
        name: row.get(1)?,
        budget_hours: budget,
        start_date: row.get(3)?,
        end_date: row.get(4)?,
        status: row.get(5)?,
        over_budget_warned: row.get::<_, i64>(6)? != 0,
        created_at: row.get(7)?,
        consumed_hours: Some(consumed),
        remaining_hours: Some(budget - consumed),
    })
}

/// 查询所有项目（含消耗工时汇总）
#[tauri::command]
pub fn list_projects(db: State<DbConn>) -> Result<Vec<Project>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.name, p.budget_hours, p.start_date, p.end_date,
                    p.status, p.over_budget_warned, p.created_at,
                    COALESCE(SUM(te.hours), 0) as consumed_hours
             FROM projects p
             LEFT JOIN tasks t ON t.project_id = p.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             GROUP BY p.id
             ORDER BY p.id",
        )
        .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| row_to_project(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(projects)
}

/// 创建项目
#[tauri::command]
pub fn create_project(db: State<DbConn>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO projects (name, budget_hours, start_date, end_date) VALUES (?1, ?2, ?3, ?4)",
        params![input.name, input.budget_hours, input.start_date, input.end_date],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let project = conn
        .query_row(
            "SELECT p.id, p.name, p.budget_hours, p.start_date, p.end_date,
                    p.status, p.over_budget_warned, p.created_at,
                    0.0 as consumed_hours
             FROM projects p WHERE p.id = ?1",
            params![id],
            |row| row_to_project(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(project)
}

/// 更新项目
#[tauri::command]
pub fn update_project(db: State<DbConn>, input: UpdateProjectInput) -> Result<Project, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE projects SET name=?1, budget_hours=?2, start_date=?3, end_date=?4, status=?5 WHERE id=?6",
        params![input.name, input.budget_hours, input.start_date, input.end_date, input.status, input.id],
    )
    .map_err(|e| e.to_string())?;

    let project = conn
        .query_row(
            "SELECT p.id, p.name, p.budget_hours, p.start_date, p.end_date,
                    p.status, p.over_budget_warned, p.created_at,
                    COALESCE(SUM(te.hours), 0) as consumed_hours
             FROM projects p
             LEFT JOIN tasks t ON t.project_id = p.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             WHERE p.id = ?1
             GROUP BY p.id",
            params![input.id],
            |row| row_to_project(row),
        )
        .map_err(|e| e.to_string())?;

    Ok(project)
}

/// 归档项目
#[tauri::command]
pub fn archive_project(db: State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE projects SET status='archived' WHERE id=?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// 标记超预算警告已显示
#[tauri::command]
pub fn mark_budget_warned(db: State<DbConn>, id: i64) -> Result<(), String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE projects SET over_budget_warned=1 WHERE id=?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_db;

    fn setup() -> DbConn {
        Mutex::new(init_db(":memory:").unwrap())
    }

    #[test]
    fn test_create_project_sets_default_status_active() {
        let db = setup();
        let conn = db.lock().unwrap();
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            params!["Q2 迭代", 200.0],
        )
        .unwrap();

        let status: String = conn
            .query_row("SELECT status FROM projects WHERE id=1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(status, "active");
    }

    #[test]
    fn test_mark_budget_warned_sets_flag() {
        let db = setup();
        let conn = db.lock().unwrap();
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            params!["项目A", 100.0],
        )
        .unwrap();

        conn.execute(
            "UPDATE projects SET over_budget_warned=1 WHERE id=1",
            [],
        )
        .unwrap();

        let warned: i64 = conn
            .query_row(
                "SELECT over_budget_warned FROM projects WHERE id=1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(warned, 1, "over_budget_warned 应为 1");
    }

    #[test]
    fn test_archive_project_changes_status() {
        let db = setup();
        let conn = db.lock().unwrap();
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            params!["项目B", 50.0],
        )
        .unwrap();

        conn.execute(
            "UPDATE projects SET status='archived' WHERE id=1",
            [],
        )
        .unwrap();

        let status: String = conn
            .query_row("SELECT status FROM projects WHERE id=1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(status, "archived");
    }
}
