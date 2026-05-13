# 技术实现计划：工作量管理器

**分支**: `001-workload-manager` | **日期**: 2025-05-13 | **规格**: [design.md](../../docs/specs/2025-05-13-workload-manager-design.md)

---

## 概述

基于 Tauri 2.x + React 18 + SQLite 构建一款面向部门经理的本地桌面工作量管理工具。核心功能包括：人员管理、项目管理、任务管理、工时记录和仪表盘可视化。

---

## 技术上下文

| 项目 | 选型 |
|------|------|
| 桌面框架 | Tauri 2.x |
| 前端语言 | TypeScript 5.x + React 18 |
| 构建工具 | Vite 5.x |
| 样式 | TailwindCSS 3.x |
| 状态管理 | Zustand 4.x |
| 图表 | Recharts 2.x |
| 路由 | React Router 6.x |
| 后端语言 | Rust (stable) |
| 数据库 | SQLite via rusqlite |
| 性能目标 | SQLite 查询 < 100ms，启动 < 2s |

---

## 治理检查

### 产品对齐（product.md）
- [x] 符合产品愿景：本地桌面工具，帮助部门经理管理工作量
- [x] 遵守业务约束：纯本地存储，无网络依赖，单用户
- [x] 满足非功能需求：SQLite 本地查询性能、离线可用

### 技术合规（tech.md）
- [x] 使用已批准的技术栈：Tauri + React + TypeScript + TailwindCSS + Zustand
- [x] 遵循开发原则：前后端分离，类型安全，简洁优先
- [x] 通过质量门禁：TypeScript 无 any，Rust clippy clean

### 结构合规（structure.md）
- [x] 遵循项目布局：pages/components/stores/services/types
- [x] 使用正确命名规范：PascalCase 组件，camelCase 服务
- [x] 遵守模块组织规则：每个 store/service 对应一个业务实体

---

## 数据模型

### 实体关系

```
Member (1) ──────< Task (N)          [assignee_id]
Project (1) ─────< Task (N)          [project_id]
Task (1) ─────────< TimeEntry (N)    [task_id]
Member (1) ───────< TimeEntry (N)    [member_id]
```

### DDL（SQLite）

```sql
CREATE TABLE members (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  role         TEXT    NOT NULL DEFAULT '',
  daily_hours  REAL    NOT NULL DEFAULT 8.0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE projects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  budget_hours        REAL    NOT NULL DEFAULT 0,
  start_date          TEXT,
  end_date            TEXT,
  status              TEXT    NOT NULL DEFAULT 'active',  -- active/completed/archived
  over_budget_warned  INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tasks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id       INTEGER NOT NULL REFERENCES projects(id),
  title            TEXT    NOT NULL,
  source           TEXT    NOT NULL DEFAULT 'manual',  -- manual/import/auto
  note             TEXT    DEFAULT '',
  assignee_id      INTEGER REFERENCES members(id),
  status           TEXT    NOT NULL DEFAULT 'todo',    -- todo/in_progress/done
  estimated_hours  REAL    DEFAULT 0,
  actual_hours     REAL,   -- 手动填写，可选；优先取 TimeEntry 汇总
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE time_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id),
  member_id   INTEGER NOT NULL REFERENCES members(id),
  date        TEXT    NOT NULL,  -- ISO 8601: YYYY-MM-DD
  hours       REAL    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## API 契约（Tauri Commands）

### Member Commands

```typescript
// 查询所有成员
invoke<Member[]>('list_members')

// 创建成员（input 为 Tauri Command 的命名参数）
invoke<Member>('create_member', { input: { name: string, role: string, dailyHours: number } })

// 更新成员
invoke<Member>('update_member', { input: { id: number, name: string, role: string, dailyHours: number } })

// 删除成员（有关联数据时返回错误）
invoke<void>('delete_member', { id: number })
// Error: "请先解除该成员的所有任务分配和工时记录"
```

### Project Commands

```typescript
// 查询所有项目
invoke<Project[]>('list_projects')

// 创建项目
invoke<Project>('create_project', { input: { name: string, budgetHours: number, startDate?: string, endDate?: string } })

// 更新项目
invoke<Project>('update_project', { input: { id: number, name: string, budgetHours: number, startDate?: string, endDate?: string, status: string } })

// 归档项目
invoke<void>('archive_project', { id: number })

// 标记超预算警告已显示
invoke<void>('mark_budget_warned', { id: number })
```

### Task Commands

```typescript
// 查询项目下的任务
invoke<Task[]>('list_tasks', { projectId: number })

// 创建任务
invoke<Task>('create_task', { input: { projectId: number, title: string, source: string, note?: string, assigneeId?: number, estimatedHours?: number } })

// 更新任务
invoke<Task>('update_task', { input: { id: number, title: string, note?: string, assigneeId?: number, estimatedHours?: number, actualHours?: number } })

// 变更任务状态（in_progress 时校验成员并发任务）
invoke<Task>('update_task_status', { input: { id: number, status: string } })
// Error: "该成员已有进行中的任务，请先完成或暂停当前任务"

// 删除任务
invoke<void>('delete_task', { id: number })
```

### TimeEntry Commands

```typescript
// 查询工时记录（支持按任务/成员/日期范围过滤）
invoke<TimeEntry[]>('list_time_entries', { filter: { taskId?: number, memberId?: number, startDate?: string, endDate?: string } })

// 创建工时记录
invoke<TimeEntry>('create_time_entry', { input: { taskId: number, memberId: number, date: string, hours: number } })

// 更新工时记录
invoke<TimeEntry>('update_time_entry', { input: { id: number, hours: number, date: string } })

// 删除工时记录
invoke<void>('delete_time_entry', { id: number })
```

### Report Commands

```typescript
// 仪表盘数据
invoke<DashboardData>('report_dashboard')
// 返回：总预算/消耗/剩余、按项目进度、按人员分配、趋势数据

// 趋势数据（支持天/周粒度）
invoke<TrendData[]>('report_trend', { granularity: 'day' | 'week', weeks: number })
```

---

## TypeScript 类型定义

```typescript
// src/types/index.ts

export interface Member {
  id: number
  name: string
  role: string
  dailyHours: number
  createdAt: string
}

export interface Project {
  id: number
  name: string
  budgetHours: number
  startDate?: string
  endDate?: string
  status: 'active' | 'completed' | 'archived'
  overBudgetWarned: boolean
  createdAt: string
  // 计算字段（由 report 命令返回）
  consumedHours?: number
  remainingHours?: number
}

export interface Task {
  id: number
  projectId: number
  title: string
  source: 'manual' | 'import' | 'auto'
  note: string
  assigneeId?: number
  assigneeName?: string  // join 查询
  status: 'todo' | 'in_progress' | 'done'
  estimatedHours: number
  actualHours?: number
  // 计算字段
  timeEntryHours?: number  // TimeEntry 汇总
  effectiveActualHours?: number  // 优先 timeEntryHours，否则 actualHours
  createdAt: string
}

export interface TimeEntry {
  id: number
  taskId: number
  memberId: number
  memberName?: string  // join 查询
  date: string
  hours: number
  createdAt: string
}

export interface DashboardData {
  totalBudgetHours: number
  totalConsumedHours: number
  totalRemainingHours: number
  projectStats: ProjectStat[]
  memberStats: MemberStat[]
  trendData: TrendData[]
}

export interface ProjectStat {
  projectId: number
  projectName: string
  budgetHours: number
  consumedHours: number
  percentage: number
  isOverBudget: boolean
}

export interface MemberStat {
  memberId: number
  memberName: string
  assignedHours: number
  percentage: number
}

export interface TrendData {
  label: string  // 日期或周标签
  hours: number
}
```

---

## 业务规则实现

### 规则 1：成员并发任务校验

```rust
// commands/task.rs
fn update_task_status(id: i64, status: &str, conn: &Connection) -> Result<Task, String> {
    if status == "in_progress" {
        // 查询该任务的负责人
        let assignee_id = get_task_assignee(id, conn)?;
        if let Some(assignee_id) = assignee_id {
            // 检查是否已有其他 in_progress 任务
            let count: i64 = conn.query_row(
                "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?1 AND status = 'in_progress' AND id != ?2",
                params![assignee_id, id],
                |row| row.get(0),
            )?;
            if count > 0 {
                return Err("该成员已有进行中的任务，请先完成或暂停当前任务".to_string());
            }
        }
    }
    // 执行状态更新...
}
```

### 规则 2：任务完成时实际工时处理

前端逻辑（`Tasks.tsx`）：
1. 用户点击"完成"按钮
2. 调用 `list_time_entries({ taskId })` 检查是否有明细
3. 若无明细 → 弹出 `ActualHoursDialog`，预填 `estimatedHours`
4. 用户确认后调用 `update_task_status` + `update_task`（更新 `actualHours`）

### 规则 3：成员删除保护

```rust
// commands/member.rs
fn delete_member(id: i64, conn: &Connection) -> Result<(), String> {
    let task_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tasks WHERE assignee_id = ?1",
        params![id], |row| row.get(0),
    )?;
    let entry_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM time_entries WHERE member_id = ?1",
        params![id], |row| row.get(0),
    )?;
    if task_count > 0 || entry_count > 0 {
        return Err("请先解除该成员的所有任务分配和工时记录".to_string());
    }
    conn.execute("DELETE FROM members WHERE id = ?1", params![id])?;
    Ok(())
}
```

### 规则 4：项目超预算警告

前端逻辑（`Projects.tsx` / `Dashboard.tsx`）：
1. 加载项目数据时检查 `consumedHours >= budgetHours`
2. 若超预算且 `overBudgetWarned === false` → 弹出警告对话框
3. 用户关闭对话框后调用 `mark_budget_warned({ id })`
4. 后续仅标红，不再弹窗

---

## 实际工时计算逻辑

```typescript
// 在 taskStore 或 taskService 中
function getEffectiveActualHours(task: Task): number | undefined {
  if (task.timeEntryHours !== undefined && task.timeEntryHours > 0) {
    return task.timeEntryHours  // 优先取 TimeEntry 汇总
  }
  return task.actualHours       // 否则取手动填写值
}
```

Rust 侧 SQL 查询（list_tasks 时 join 汇总）：
```sql
SELECT
  t.*,
  m.name as assignee_name,
  COALESCE(SUM(te.hours), 0) as time_entry_hours
FROM tasks t
LEFT JOIN members m ON t.assignee_id = m.id
LEFT JOIN time_entries te ON t.id = te.task_id
WHERE t.project_id = ?1
GROUP BY t.id
```

---

## 项目文件结构

```
.kiro/specs/001-workload-manager/
├── design.md          # 本文件
├── clarifications.md  # 澄清记录
└── tasks.md           # 任务列表（Tasks 工作流生成）

docs/specs/
└── 2025-05-13-workload-manager-design.md  # 原始设计规格

src/
├── main.tsx
├── App.tsx
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── dialogs/
│       ├── ActualHoursDialog.tsx   # 任务完成时填写实际工时
│       └── BudgetWarningDialog.tsx # 超预算警告
├── pages/
│   ├── Dashboard.tsx
│   ├── Members.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   ├── TimeEntries.tsx
│   └── Settings.tsx
├── stores/
│   ├── memberStore.ts
│   ├── projectStore.ts
│   ├── taskStore.ts
│   └── timeEntryStore.ts
├── services/
│   ├── memberService.ts
│   ├── projectService.ts
│   ├── taskService.ts
│   ├── timeEntryService.ts
│   └── reportService.ts
└── types/
    └── index.ts

src-tauri/src/
├── main.rs
├── db.rs
├── commands/
│   ├── mod.rs
│   ├── member.rs
│   ├── project.rs
│   ├── task.rs
│   ├── time_entry.rs
│   └── report.rs
└── models/
    ├── mod.rs
    ├── member.rs
    ├── project.rs
    ├── task.rs
    └── time_entry.rs
```

---

## 验证场景（Quickstart）

### 场景 1：基础工时录入流程
1. 新增成员"张三"，日标准工时 8h
2. 新增项目"Q2 迭代"，预算 200h
3. 在项目下新增任务"需求评审"，预估 4h，分配给张三
4. 将任务状态改为 `in_progress`
5. 录入工时：张三，2025-05-13，2h
6. 将任务状态改为 `done`
7. 仪表盘显示已消耗 2h，剩余 198h

### 场景 2：成员并发任务校验
1. 张三已有一个 `in_progress` 任务
2. 尝试将另一个任务改为 `in_progress` 并分配给张三
3. 系统阻止并提示"该成员已有进行中的任务"

### 场景 3：超预算警告
1. 项目预算 10h
2. 录入工时累计达到 10h
3. 仪表盘项目进度条标红
4. 弹出超预算警告对话框
5. 关闭后继续录入工时，不再弹窗

### 场景 4：成员删除保护
1. 张三有关联任务
2. 尝试删除张三
3. 系统提示"请先解除该成员的所有任务分配和工时记录"
4. 解除关联后可成功删除
