mod commands;
mod db;
mod models;

use commands::member::{create_member, delete_member, list_members, update_member};
use commands::project::{
    archive_project, create_project, list_projects, mark_budget_warned, update_project,
};
use commands::report::{report_dashboard, report_trend};
use commands::task::{create_task, delete_task, list_tasks, update_task, update_task_status};
use commands::time_entry::{
    create_time_entry, delete_time_entry, list_time_entries, update_time_entry,
};
use std::sync::Mutex;

/// 全局数据库连接类型，通过 Tauri State 注入到所有 Command
pub type DbConn = Mutex<rusqlite::Connection>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化数据库
    let db_path = db::get_db_path();
    let conn = db::init_db(db_path.to_str().unwrap_or(":memory:"))
        .expect("数据库初始化失败");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(conn))
        .invoke_handler(tauri::generate_handler![
            // 成员管理
            list_members,
            create_member,
            update_member,
            delete_member,
            // 项目管理
            list_projects,
            create_project,
            update_project,
            archive_project,
            mark_budget_warned,
            // 任务管理
            list_tasks,
            create_task,
            update_task,
            update_task_status,
            delete_task,
            // 工时记录
            list_time_entries,
            create_time_entry,
            update_time_entry,
            delete_time_entry,
            // 报表
            report_dashboard,
            report_trend,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
