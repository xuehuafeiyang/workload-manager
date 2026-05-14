use serde::{Deserialize, Serialize};

/// 项目
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
    pub over_budget_warned: bool,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub consumed_hours: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remaining_hours: Option<f64>,
}

/// 创建项目的输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectInput {
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

/// 更新项目的输入
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
}
