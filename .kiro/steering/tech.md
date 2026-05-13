# 技术治理

## 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 桌面框架 | Tauri | 2.x |
| 前端框架 | React | 19.x |
| 语言 | TypeScript | 5.x |
| 构建工具 | Vite | 7.x |
| 样式 | TailwindCSS | 3.x |
| 状态管理 | Zustand | 4.x |
| 图表 | Recharts | 2.x |
| 路由 | React Router | 6.x |
| 后端语言 | Rust | stable |
| 数据库 | SQLite | 通过 rusqlite 0.31 |

## 开发原则

### 简洁优先
- 不做过度抽象，单一用途的代码不需要封装
- 不做未来预防性设计，需要时再扩展
- 组件职责单一，一个组件做一件事

### 类型安全
- 禁止使用 `any` 类型
- Tauri Command 的入参和返回值必须有明确类型定义
- 前后端共享类型定义（通过 TypeScript 类型对应 Rust 结构体）

### 前后端分离
- 前端只负责 UI 渲染和状态管理
- 所有数据操作通过 Tauri invoke() 调用 Rust 侧
- Rust 侧负责数据库操作、业务逻辑、数据校验

### 错误处理
- Rust 侧使用 Result 类型，错误信息传递到前端
- 前端统一处理错误提示（toast 通知）
- 不吞掉错误，所有异常对用户可见

## 代码规范

### TypeScript/React
- 使用函数组件 + Hooks
- 组件文件使用 PascalCase（如 `Dashboard.tsx`）
- 工具/服务文件使用 camelCase（如 `memberService.ts`）
- 每个 Zustand store 独立文件
- 导入顺序：React → 第三方库 → 本地模块 → 类型

### Rust
- 每个 Tauri Command 模块对应一个业务实体
- 使用 serde 进行序列化/反序列化
- 数据库操作封装在独立模块中
- 错误类型统一定义

### CSS/样式
- 优先使用 TailwindCSS 工具类
- 避免自定义 CSS，除非 Tailwind 无法覆盖
- 响应式设计不是必须（桌面应用固定窗口）
- 保持一致的间距和颜色体系

## 质量门禁

- [ ] TypeScript 编译无错误
- [ ] 无 ESLint 警告
- [ ] Rust 编译无警告（clippy clean）
- [ ] 应用可正常启动并操作

## 依赖管理

- 前端依赖使用精确版本号（非范围）
- Rust 依赖在 Cargo.toml 中指定最小版本
- 优先选择维护活跃、社区成熟的库
- 避免引入功能重叠的依赖

### Rust 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `rusqlite` | 0.31（bundled feature） | SQLite 数据库操作，bundled 特性内嵌 SQLite 源码 |
| `serde` | 1（derive feature） | 序列化/反序列化 |
| `serde_json` | 1 | JSON 支持 |
| `dirs-next` | 2.0 | 获取系统数据目录，用于确定 SQLite 文件存储路径 |
