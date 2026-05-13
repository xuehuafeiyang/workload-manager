# 工作量管理器（Workload Manager）

面向部门经理的本地桌面工作量管理工具，帮助掌握团队工作量的来源与消耗。

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.x |
| 前端 | React 18 + TypeScript 5 |
| 构建 | Vite 7 |
| 样式 | TailwindCSS 3 |
| 状态管理 | Zustand 4 |
| 图表 | Recharts 2 |
| 路由 | React Router 6 |
| 后端 | Rust (stable) |
| 数据库 | SQLite (rusqlite) |

## 功能

- **人员管理**：新增/编辑/删除部门成员，设置日标准工时
- **项目管理**：管理项目预算工时，查看消耗进度，超预算警告
- **任务管理**：在项目下创建任务，分配负责人，跟踪状态
- **工时记录**：录入每日工时明细，支持按任务/成员/日期筛选
- **仪表盘**：总览工时概况，项目进度条，人员分配饼图，趋势折线图

## 本地开发

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/learn/get-started) (stable)
- [Tauri 前置依赖](https://tauri.app/start/prerequisites/)（Windows 需要 WebView2）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run tauri dev
```

### 运行前端测试

```bash
npm test
```

### 运行 Rust 测试

```bash
cd src-tauri
cargo test
```

### 构建生产版本

```bash
npm run tauri build
```

## 项目结构

```
src/                    # 前端源码
├── components/         # 通用 UI 组件
├── pages/              # 页面组件
├── services/           # Tauri invoke 封装
├── stores/             # Zustand 状态管理
└── types/              # TypeScript 类型定义

src-tauri/src/          # Rust 后端
├── commands/           # Tauri Commands（CRUD + 报表）
├── models/             # 数据结构定义
└── db.rs               # SQLite 初始化

.kiro/                  # 规格文档
├── steering/           # 项目治理原则
└── specs/              # SDD 规格文件
```

## 数据存储

数据存储在本地 SQLite 文件，路径：
- Windows: `%APPDATA%\workload-manager\workload.db`
