# 结构治理

## 项目布局

```
workload-manager/
├── src/                        # 前端源码
│   ├── main.tsx                # 应用入口
│   ├── App.tsx                 # 根组件（路由配置）
│   ├── components/             # 通用 UI 组件
│   │   ├── Layout.tsx          # 侧边栏 + 主内容布局
│   │   ├── Sidebar.tsx         # 侧边栏导航
│   │   └── dialogs/            # 对话框组件
│   │       ├── ActualHoursDialog.tsx   # 任务完成时填写实际工时
│   │       └── BudgetWarningDialog.tsx # 超预算警告
│   ├── pages/                  # 页面组件
│   │   ├── Dashboard.tsx       # 仪表盘
│   │   ├── Members.tsx         # 人员管理
│   │   ├── Projects.tsx        # 项目管理
│   │   ├── Tasks.tsx           # 任务管理
│   │   ├── TimeEntries.tsx     # 工时记录
│   │   └── Settings.tsx        # 设置
│   ├── stores/                 # Zustand 状态管理
│   │   ├── memberStore.ts
│   │   ├── projectStore.ts
│   │   ├── taskStore.ts
│   │   └── timeEntryStore.ts
│   ├── services/               # Tauri invoke 封装
│   │   ├── memberService.ts
│   │   ├── projectService.ts
│   │   ├── taskService.ts
│   │   ├── timeEntryService.ts
│   │   └── reportService.ts    # 报表数据服务
│   └── types/                  # TypeScript 类型定义
│       └── index.ts
│   └── test/                   # 测试配置
│       └── setup.ts
├── src-tauri/                  # Rust 后端
│   ├── src/
│   │   ├── main.rs             # Tauri 入口
│   │   ├── db.rs               # 数据库初始化与连接
│   │   ├── commands/           # Tauri Commands
│   │   │   ├── mod.rs
│   │   │   ├── member.rs
│   │   │   ├── project.rs
│   │   │   ├── task.rs
│   │   │   ├── time_entry.rs
│   │   │   └── report.rs
│   │   └── models/             # 数据结构定义
│   │       ├── mod.rs
│   │       ├── member.rs
│   │       ├── project.rs
│   │       ├── task.rs
│   │       └── time_entry.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                       # 文档
│   └── specs/                  # 设计规格
├── .kiro/                      # Kiro 配置
│   ├── steering/               # 治理文件
│   └── specs/                  # SDD 规格文件
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 命名规范

| 类别 | 规则 | 示例 |
|------|------|------|
| 页面组件 | PascalCase | `Dashboard.tsx` |
| 通用组件 | PascalCase | `Sidebar.tsx` |
| Store 文件 | camelCase + Store 后缀 | `memberStore.ts` |
| Service 文件 | camelCase + Service 后缀 | `memberService.ts` |
| 类型文件 | camelCase | `index.ts` |
| Rust 模块 | snake_case | `time_entry.rs` |
| 数据库表 | snake_case 复数 | `time_entries` |
| 数据库字段 | snake_case | `budget_hours` |

## 模块规则

### 前端
- `pages/` 中每个文件对应一个路由页面
- `components/` 中放可复用的 UI 组件
- `stores/` 中每个 store 对应一个业务实体，不跨实体
- `services/` 中每个 service 封装对应实体的 Tauri invoke 调用
- `types/` 中集中定义所有 TypeScript 接口和类型

### Rust 侧
- `commands/` 中每个文件对应一个业务实体的 CRUD 操作
- `models/` 中每个文件定义对应实体的 struct
- `db.rs` 负责数据库连接池和表初始化
- 通过 `mod.rs` 统一导出

## 数据库规范

- 表名使用 snake_case 复数形式（`members`, `projects`, `tasks`, `time_entries`）
- 主键统一为 `id INTEGER PRIMARY KEY AUTOINCREMENT`
- 外键字段命名为 `{entity}_id`（如 `project_id`, `member_id`）
- 所有表包含 `created_at` 时间戳字段
- 使用 SQLite 的 TEXT 类型存储日期时间（ISO 8601 格式）

## API 模式（Tauri Commands）

命名规则：`{动作}_{实体}`

| 操作 | 命名模式 | 示例 |
|------|----------|------|
| 查询列表 | `list_{entities}` | `list_members` |
| 查询单个 | `get_{entity}` | `get_member` |
| 创建 | `create_{entity}` | `create_member` |
| 更新 | `update_{entity}` | `update_member` |
| 删除 | `delete_{entity}` | `delete_member` |
| 报表 | `report_{name}` | `report_dashboard` |
