import { invoke } from '@tauri-apps/api/core'
import type { Project, CreateProjectInput } from '../types'

export const projectService = {
  listProjects: () => invoke<Project[]>('list_projects'),
  createProject: (input: CreateProjectInput) => invoke<Project>('create_project', { input }),
  updateProject: (input: {
    id: number
    name: string
    budgetHours: number
    startDate?: string
    endDate?: string
    status: 'active' | 'completed' | 'archived'
  }) => invoke<Project>('update_project', { input }),
  archiveProject: (id: number) => invoke<void>('archive_project', { id }),
  markBudgetWarned: (id: number) => invoke<void>('mark_budget_warned', { id }),
}
