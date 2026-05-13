use serde::{Deserialize, Serialize};

/// 任务
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    /// 来源：manual / import / auto
    pub source: String,
    pub note: String,
    pub assignee_id: Option<i64>,
    /// join 查询得到的负责人姓名
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee_name: Option<String>,
    /// 状态：todo / in_progress / done
    pub status: String,
    pub estimated_hours: f64,
    /// 手动填写的实际工时（可选）
    pub actual_hours: Option<f64>,
    /// 计算字段：TimeEntry 汇总工时
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_entry_hours: Option<f64>,
    /// 计算字段：有效实际工时（优先取 time_entry_hours，否则取 actual_hours）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_actual_hours: Option<f64>,
    pub created_at: String,
}

/// 创建任务的输入
#[derive(Debug, Deserialize)]
pub struct CreateTaskInput {
    pub project_id: i64,
    pub title: String,
    pub source: String,
    pub note: Option<String>,
    pub assignee_id: Option<i64>,
    pub estimated_hours: Option<f64>,
}

/// 更新任务的输入
#[derive(Debug, Deserialize)]
pub struct UpdateTaskInput {
    pub id: i64,
    pub title: String,
    pub source: Option<String>,
    pub note: Option<String>,
    pub assignee_id: Option<i64>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
}

/// 更新任务状态的输入
#[derive(Debug, Deserialize)]
pub struct UpdateTaskStatusInput {
    pub id: i64,
    pub status: String,
}
