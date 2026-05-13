use serde::{Deserialize, Serialize};
use rusqlite::params;
use tauri::State;
use crate::DbConn;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectStat {
    pub project_id: i64,
    pub project_name: String,
    pub budget_hours: f64,
    pub consumed_hours: f64,
    pub percentage: f64,
    pub is_over_budget: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemberStat {
    pub member_id: i64,
    pub member_name: String,
    pub assigned_hours: f64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrendData {
    pub label: String,
    pub hours: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardData {
    pub total_budget_hours: f64,
    pub total_consumed_hours: f64,
    pub total_remaining_hours: f64,
    pub project_stats: Vec<ProjectStat>,
    pub member_stats: Vec<MemberStat>,
    pub trend_data: Vec<TrendData>,
}

/// 仪表盘汇总数据
#[tauri::command]
pub fn report_dashboard(db: State<DbConn>) -> Result<DashboardData, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;

    // 总预算
    let total_budget: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(budget_hours), 0) FROM projects WHERE status != 'archived'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 总消耗
    let total_consumed: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(te.hours), 0)
             FROM time_entries te
             JOIN tasks t ON te.task_id = t.id
             JOIN projects p ON t.project_id = p.id
             WHERE p.status != 'archived'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 按项目统计
    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.name, p.budget_hours,
                    COALESCE(SUM(te.hours), 0) as consumed
             FROM projects p
             LEFT JOIN tasks t ON t.project_id = p.id
             LEFT JOIN time_entries te ON te.task_id = t.id
             WHERE p.status != 'archived'
             GROUP BY p.id
             ORDER BY consumed DESC",
        )
        .map_err(|e| e.to_string())?;

    let project_stats: Vec<ProjectStat> = stmt
        .query_map([], |row| {
            let budget: f64 = row.get(2)?;
            let consumed: f64 = row.get(3)?;
            Ok(ProjectStat {
                project_id: row.get(0)?,
                project_name: row.get(1)?,
                budget_hours: budget,
                consumed_hours: consumed,
                percentage: if budget > 0.0 { consumed / budget * 100.0 } else { 0.0 },
                is_over_budget: consumed >= budget && budget > 0.0,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // 按人员统计
    let mut stmt2 = conn
        .prepare(
            "SELECT m.id, m.name,
                    COALESCE(SUM(te.hours), 0) as assigned_hours
             FROM members m
             LEFT JOIN time_entries te ON te.member_id = m.id
             GROUP BY m.id
             ORDER BY assigned_hours DESC",
        )
        .map_err(|e| e.to_string())?;

    let member_stats_raw: Vec<(i64, String, f64)> = stmt2
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let total_member_hours: f64 = member_stats_raw.iter().map(|(_, _, h)| h).sum();
    let member_stats: Vec<MemberStat> = member_stats_raw
        .into_iter()
        .map(|(id, name, hours)| MemberStat {
            member_id: id,
            member_name: name,
            assigned_hours: hours,
            percentage: if total_member_hours > 0.0 {
                hours / total_member_hours * 100.0
            } else {
                0.0
            },
        })
        .collect();

    // 近 4 周趋势（按周）
    let trend_data = get_trend_data(&conn, "week", 4)?;

    Ok(DashboardData {
        total_budget_hours: total_budget,
        total_consumed_hours: total_consumed,
        total_remaining_hours: total_budget - total_consumed,
        project_stats,
        member_stats,
        trend_data,
    })
}

/// 趋势数据（支持 day/week 粒度）
#[tauri::command]
pub fn report_trend(
    db: State<DbConn>,
    granularity: String,
    weeks: i64,
) -> Result<Vec<TrendData>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    get_trend_data(&conn, &granularity, weeks)
}

fn get_trend_data(
    conn: &rusqlite::Connection,
    granularity: &str,
    weeks: i64,
) -> Result<Vec<TrendData>, String> {
    // 输入校验：防止非法参数
    if granularity != "day" && granularity != "week" {
        return Err(format!("granularity 参数无效：{}，必须为 day 或 week", granularity));
    }
    if weeks <= 0 || weeks > 52 {
        return Err(format!("weeks 参数无效：{}，必须在 1-52 之间", weeks));
    }

    let days = weeks * 7;

    // 使用参数化查询，days 通过 rusqlite 参数绑定传入
    let sql = if granularity == "day" {
        "SELECT date, COALESCE(SUM(hours), 0) as hours
         FROM time_entries
         WHERE date >= date('now', printf('-%d days', ?1))
         GROUP BY date
         ORDER BY date"
    } else {
        "SELECT strftime('%Y-W%W', date) as week_label,
                COALESCE(SUM(hours), 0) as hours
         FROM time_entries
         WHERE date >= date('now', printf('-%d days', ?1))
         GROUP BY week_label
         ORDER BY week_label"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let data = stmt
        .query_map(params![days], |row| {
            Ok(TrendData {
                label: row.get(0)?,
                hours: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(data)
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
            "INSERT INTO tasks (project_id, title, assignee_id) VALUES (1, '任务A', 1)",
            [],
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_dashboard_total_consumed_hours() {
        let conn = setup();
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (1, 1, '2025-05-13', 5.0)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO time_entries (task_id, member_id, date, hours) VALUES (1, 1, '2025-05-14', 3.0)",
            [],
        )
        .unwrap();

        let total: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(te.hours), 0)
                 FROM time_entries te
                 JOIN tasks t ON te.task_id = t.id
                 JOIN projects p ON t.project_id = p.id
                 WHERE p.status != 'archived'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!((total - 8.0).abs() < f64::EPSILON, "总消耗应为 8.0");
    }

    #[test]
    fn test_project_stat_is_over_budget_when_consumed_exceeds_budget() {
        let budget = 10.0_f64;
        let consumed = 11.0_f64;
        let is_over = consumed >= budget && budget > 0.0;
        assert!(is_over, "消耗超过预算时应标记为超预算");
    }
}
