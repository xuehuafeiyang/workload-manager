use rusqlite::{Connection, Result};
use std::path::PathBuf;

/// 获取数据库文件路径（存储在应用数据目录）
pub fn get_db_path() -> PathBuf {
    // 在测试环境中使用内存数据库
    #[cfg(test)]
    {
        PathBuf::from(":memory:")
    }
    #[cfg(not(test))]
    {
        let mut path = dirs_next::data_dir()
            .unwrap_or_else(|| PathBuf::from("."));
        path.push("workload-manager");
        std::fs::create_dir_all(&path).ok();
        path.push("workload.db");
        path
    }
}

/// 初始化数据库连接并创建所有表
pub fn init_db(path: &str) -> Result<Connection> {
    let conn = if path == ":memory:" {
        Connection::open_in_memory()?
    } else {
        Connection::open(path)?
    };

    // 开启外键约束
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    create_tables(&conn)?;
    Ok(conn)
}

/// 创建所有业务表
pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS members (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            name         TEXT    NOT NULL,
            role         TEXT    NOT NULL DEFAULT '',
            daily_hours  REAL    NOT NULL DEFAULT 8.0,
            created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            name                TEXT    NOT NULL,
            budget_hours        REAL    NOT NULL DEFAULT 0,
            start_date          TEXT,
            end_date            TEXT,
            status              TEXT    NOT NULL DEFAULT 'active',
            over_budget_warned  INTEGER NOT NULL DEFAULT 0,
            created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id       INTEGER NOT NULL REFERENCES projects(id),
            title            TEXT    NOT NULL,
            source           TEXT    NOT NULL DEFAULT 'manual',
            note             TEXT    DEFAULT '',
            assignee_id      INTEGER REFERENCES members(id),
            status           TEXT    NOT NULL DEFAULT 'todo',
            estimated_hours  REAL    DEFAULT 0,
            actual_hours     REAL,
            created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS time_entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id     INTEGER NOT NULL REFERENCES tasks(id),
            member_id   INTEGER NOT NULL REFERENCES members(id),
            date        TEXT    NOT NULL,
            hours       REAL    NOT NULL,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_db_creates_all_tables() {
        let conn = init_db(":memory:").expect("数据库初始化失败");

        // 验证 members 表存在
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='members'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "members 表应该存在");

        // 验证 projects 表存在
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='projects'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "projects 表应该存在");

        // 验证 tasks 表存在
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='tasks'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "tasks 表应该存在");

        // 验证 time_entries 表存在
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='time_entries'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "time_entries 表应该存在");
    }

    #[test]
    fn test_members_table_has_correct_columns() {
        let conn = init_db(":memory:").unwrap();
        // 能插入一条记录说明字段正确
        conn.execute(
            "INSERT INTO members (name, role, daily_hours) VALUES (?1, ?2, ?3)",
            rusqlite::params!["张三", "开发", 8.0],
        )
        .expect("插入成员失败");

        let name: String = conn
            .query_row("SELECT name FROM members WHERE id=1", [], |row| row.get(0))
            .unwrap();
        assert_eq!(name, "张三");
    }

    #[test]
    fn test_projects_table_has_over_budget_warned_column() {
        let conn = init_db(":memory:").unwrap();
        conn.execute(
            "INSERT INTO projects (name, budget_hours) VALUES (?1, ?2)",
            rusqlite::params!["Q2 迭代", 200.0],
        )
        .expect("插入项目失败");

        let warned: i64 = conn
            .query_row(
                "SELECT over_budget_warned FROM projects WHERE id=1",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(warned, 0, "默认 over_budget_warned 应为 0");
    }
}
