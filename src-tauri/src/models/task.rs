use serde::{Deserialize, Serialize};

/// 任务
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub source: String,
    pub note: String,
    pub assignee_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee_name: Option<String>,
    pub status: String,
    pub estimated_hours: f64,
    pub actual_hours: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_entry_hours: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_actual_hours: Option<f64>,
    pub created_at: String,
}

/// 创建任务的输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskStatusInput {
    pub id: i64,
    pub status: String,
}
