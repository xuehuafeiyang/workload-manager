use serde::{Deserialize, Serialize};

/// 项目
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    /// 状态：active / completed / archived
    pub status: String,
    /// 是否已弹过超预算警告（0=否，1=是）
    pub over_budget_warned: bool,
    pub created_at: String,
    /// 计算字段：已消耗工时（由 SQL 汇总）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub consumed_hours: Option<f64>,
    /// 计算字段：剩余工时
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remaining_hours: Option<f64>,
}

/// 创建项目的输入
#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

/// 更新项目的输入
#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub budget_hours: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
}
