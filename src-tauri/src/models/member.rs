use serde::{Deserialize, Serialize};

/// 部门成员
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Member {
    pub id: i64,
    pub name: String,
    pub role: String,
    pub daily_hours: f64,
    pub created_at: String,
}

/// 创建成员的输入
#[derive(Debug, Deserialize)]
pub struct CreateMemberInput {
    pub name: String,
    pub role: String,
    pub daily_hours: f64,
}

/// 更新成员的输入
#[derive(Debug, Deserialize)]
pub struct UpdateMemberInput {
    pub id: i64,
    pub name: String,
    pub role: String,
    pub daily_hours: f64,
}
