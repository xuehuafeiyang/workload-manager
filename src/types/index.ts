// 所有业务实体的 TypeScript 类型定义
// 与 Rust 侧 struct 一一对应

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
  assigneeName?: string
  status: 'todo' | 'in_progress' | 'done'
  estimatedHours: number
  actualHours?: number
  // 计算字段：TimeEntry 汇总
  timeEntryHours?: number
  // 有效实际工时：优先 timeEntryHours（>0），否则 actualHours
  effectiveActualHours?: number
  createdAt: string
}

export interface TimeEntry {
  id: number
  taskId: number
  memberId: number
  memberName?: string
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
  label: string
  hours: number
}

// 表单输入类型
export interface CreateMemberInput {
  name: string
  role: string
  dailyHours: number
}

export interface CreateProjectInput {
  name: string
  budgetHours: number
  startDate?: string
  endDate?: string
}

export interface CreateTaskInput {
  projectId: number
  title: string
  source: 'manual' | 'import' | 'auto'
  note?: string
  assigneeId?: number
  estimatedHours?: number
}

export interface CreateTimeEntryInput {
  taskId: number
  memberId: number
  date: string
  hours: number
}
