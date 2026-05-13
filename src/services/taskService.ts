import { invoke } from '@tauri-apps/api/core'
import type { Task, CreateTaskInput } from '../types'

export const taskService = {
  listTasks: (projectId: number) => invoke<Task[]>('list_tasks', { projectId }),
  createTask: (input: CreateTaskInput) => invoke<Task>('create_task', { input }),
  updateTask: (input: {
    id: number
    title: string
    source?: 'manual' | 'import' | 'auto'
    note?: string
    assigneeId?: number
    estimatedHours?: number
    actualHours?: number
  }) => invoke<Task>('update_task', { input }),
  updateTaskStatus: (id: number, status: 'todo' | 'in_progress' | 'done') =>
    invoke<Task>('update_task_status', { input: { id, status } }),
  deleteTask: (id: number) => invoke<void>('delete_task', { id }),
}
