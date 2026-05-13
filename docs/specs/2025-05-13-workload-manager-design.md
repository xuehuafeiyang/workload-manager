# 工作量管理桌面应用 - 设计规格

## 1. 产品概述

**产品名称**：工作量管理器（Workload Manager）
**产品类型**：桌面应用（Tauri）
**目标用户**：部门经理（单角色）
**核心价值**：帮助部门经理掌握工作量的来源与消耗，实现人力资源的可视化管理

## 2. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | Tauri 2.x |
| 前端 | React 18 + TypeScript |
| 构建 | Vite |
| 样式 | TailwindCSS |
| 状态管理 | Zustand |
| 图表 | Recharts |
| 数据库 | SQLite（Rust 侧） |
| 路由 | React Router |

## 3. 功能范围（MVP）

### 3.1 工作量维度
- 人力工时（每人每天标准工时）
- 任务数量（任务的创建与完成）
- 项目预算工时（项目级别的工时预算与消耗）

### 3.2 工作量来源
- 手动录入：部门经理直接创建任务
- 外部导入：支持 CSV/Excel 导入
- 规则自动生成：按配置规则定期产生任务

### 3.3 工作量消耗
- 手动填报：记录某人某天在某任务上的工时
- 任务状态驱动：任务完成时可自动标记消耗
- 按时间自动消耗：项目启动后按规则自动扣减

### 3.4 实际工时逻辑
- 优先取 TimeEntry 汇总值
- 若无明细记录，取 Task.actual_hours 手动填写值

## 4. 数据模型

### Member（成员）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 姓名 |
| role | TEXT | 角色/职位 |
| daily_hours | REAL | 日标准工时，默认 8 |
| created_at | DATETIME | 创建时间 |

### Project（项目）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 项目名称 |
| budget_hours | REAL | 预算总工时 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| status | TEXT | 状态（进行中/已完成/已归档） |
| over_budget_warned | INTEGER | 是否已弹过超预算警告（0/1） |
| created_at | DATETIME | 创建时间 |

### Task（任务）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| project_id | INTEGER FK | 所属项目 |
| title | TEXT | 任务标题 |
| source | TEXT | 来源（manual/import/auto） |
| note | TEXT | 备注 |
| assignee_id | INTEGER FK | 负责人 |
| status | TEXT | 状态（todo/in_progress/done） |
| estimated_hours | REAL | 预估工时 |
| actual_hours | REAL | 实际工时（手动填写，可选） |
| created_at | DATETIME | 创建时间 |

### TimeEntry（工时记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| task_id | INTEGER FK | 关联任务 |
| member_id | INTEGER FK | 关联成员 |
| date | DATE | 日期 |
| hours | REAL | 工时数 |
| created_at | DATETIME | 创建时间 |

## 5. 应用架构

```
┌─────────────────────────────────────┐
│           React 前端                 │
│  ┌─────────┐ ┌────────┐ ┌───────┐  │
│  │ Zustand │ │ Pages  │ │Charts │  │
│  │ Store   │ │ Router │ │Rechart│  │
│  └─────────┘ └────────┘ └───────┘  │
└──────────────┬──────────────────────┘
               │ Tauri invoke()
┌──────────────▼──────────────────────┐
│           Rust 后端                  │
│  ┌──────────────────────────────┐   │
│  │  Tauri Commands (API 层)     │   │
│  │  - member_*                  │   │
│  │  - project_*                 │   │
│  │  - task_*                    │   │
│  │  - time_entry_*             │   │
│  │  - report_*                 │   │
│  │  - export_*                 │   │
│  └──────────────┬───────────────┘   │
│  ┌──────────────▼───────────────┐   │
│  │  SQLite (本地数据库)          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 6. 页面结构

### 布局
侧边栏导航 + 主内容区的经典管理后台布局。

### 6.1 仪表盘页
- 顶部：总工时概览卡片（总预算 / 已消耗 / 剩余）
- 中部左：按项目的预算消耗进度条（超预算项目标红）
- 中部右：按人员的工时分配饼图
- 底部：近 4 周工时消耗趋势折线图，支持天/周粒度切换（默认周视图）

### 6.2 人员管理页
- 表格列表：姓名、角色、日标准工时、已分配任务数
- 操作：新增、编辑、删除
- 点击人员可查看其工时明细

### 6.3 项目管理页
- 表格列表：项目名、预算工时、已消耗、剩余、状态、进度条
- 操作：新增、编辑、归档
- 点击项目可查看其下任务列表

### 6.4 任务管理页（从项目进入）
- 表格列表：任务名、来源、负责人、状态、预估/实际工时
- 操作：新增、编辑、分配、变更状态
- 筛选：按来源、按状态、按负责人

### 6.5 工时记录页
- 日历/周视图 + 表格模式切换
- 快速录入：选人员、选任务、填工时、选日期
- 批量录入支持

### 6.6 设置页
- 导入/导出（CSV/Excel）
- 工时规则配置（自动生成规则）

## 7. 前端目录结构

```
src/
├── App.tsx
├── main.tsx
├── components/          # 通用组件
│   ├── Layout.tsx       # 侧边栏 + 主内容布局
│   ├── Sidebar.tsx
│   └── ...
├── pages/
│   ├── Dashboard.tsx
│   ├── Members.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   ├── TimeEntries.tsx
│   └── Settings.tsx
├── stores/              # Zustand stores
│   ├── memberStore.ts
│   ├── projectStore.ts
│   ├── taskStore.ts
│   └── timeEntryStore.ts
├── services/            # Tauri invoke 封装
│   ├── memberService.ts
│   ├── projectService.ts
│   ├── taskService.ts
│   └── timeEntryService.ts
└── types/               # TypeScript 类型定义
    └── index.ts
```

## 8. Rust 侧结构

```
src-tauri/
├── src/
│   ├── main.rs          # 入口
│   ├── db.rs            # 数据库初始化与连接
│   ├── commands/        # Tauri Commands
│   │   ├── member.rs
│   │   ├── project.rs
│   │   ├── task.rs
│   │   ├── time_entry.rs
│   │   └── report.rs
│   └── models/          # 数据结构
│       ├── member.rs
│       ├── project.rs
│       ├── task.rs
│       └── time_entry.rs
└── Cargo.toml
```

## 9. 业务规则（澄清后确认）

### 任务状态规则
- 任务状态变更为 `in_progress` 时，校验负责人是否已有其他 `in_progress` 任务，若有则阻止并提示
- 任务完成（`done`）且无 TimeEntry 明细时，弹窗要求填写实际工时，预填预估工时作为默认值

### 成员删除规则
- 删除成员前检查是否存在关联任务或工时记录
- 若有关联数据则禁止删除，提示"请先解除该成员的所有任务分配和工时记录"

### 项目预算超支规则
- 实际消耗 >= 预算时，仪表盘和项目列表中该项目进度条标红
- 首次超支触发弹窗警告（通过 `over_budget_warned` 字段控制，不重复弹窗）
- 不阻止继续录入工时

## 10. 澄清记录

详见 [clarifications.md](.kiro/specs/001-workload-manager/clarifications.md)

### 会话 2025-05-13
- Q1: 成员多项目任务分配 → 可参与多项目，但同一时间只能有 1 个进行中任务
- Q2: 任务完成无明细时的实际工时 → 弹窗填写，预填预估工时
- Q3: 仪表盘趋势图粒度 → 支持天/周切换，默认周视图
- Q4: 删除有关联数据的成员 → 禁止删除，需先解除关联
- Q5: 项目预算耗尽行为 → 标红 + 首次弹窗警告，不阻止操作

## 11. MVP 之后的扩展方向

- 外部导入（Excel/CSV 解析）
- 规则引擎（自动生成任务和消耗）
- 更丰富的报表（按人员维度、时间趋势）
- 数据导出
- 多部门支持
