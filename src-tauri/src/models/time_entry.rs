use serde::{Deserialize, Serialize};

/// 工时记录
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TimeEntry {
    pub id: i64,
    pub task_id: i64,
    pub member_id: i64,
    /// join 查询得到的成员姓名
    #[serde(skip_serializing_if = "Option::is_none")]
    pub member_name: Option<String>,
    /// 日期，ISO 8601 格式：YYYY-MM-DD
    pub date: String,
    pub hours: f64,
    pub created_at: String,
}

/// 创建工时记录的输入
#[derive(Debug, Deserialize)]
pub struct CreateTimeEntryInput {
    pub task_id: i64,
    pub member_id: i64,
    pub date: String,
    pub hours: f64,
}

/// 更新工时记录的输入
#[derive(Debug, Deserialize)]
pub struct UpdateTimeEntryInput {
    pub id: i64,
    pub hours: f64,
    pub date: String,
}

/// 查询工时记录的过滤条件
#[derive(Debug, Deserialize)]
pub struct ListTimeEntriesFilter {
    pub task_id: Option<i64>,
    pub member_id: Option<i64>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}
