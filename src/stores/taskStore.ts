import { create } from 'zustand'
import type { Task, CreateTaskInput } from '../types'
import { taskService } from '../services/taskService'

interface TaskStore {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks: (projectId: number) => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<void>
  updateTask: (input: {
    id: number
    title: string
    source?: 'manual' | 'import' | 'auto'
    note?: string
    assigneeId?: number
    estimatedHours?: number
    actualHours?: number
  }) => Promise<void>
  updateTaskStatus: (id: number, status: 'todo' | 'in_progress' | 'done') => Promise<Task>
  deleteTask: (id: number) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.listTasks(projectId)
      set({ tasks, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  createTask: async (input) => {
    set({ error: null })
    try {
      const task = await taskService.createTask(input)
      set((state) => ({ tasks: [...state.tasks, task] }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  updateTask: async (input) => {
    set({ error: null })
    try {
      const updated = await taskService.updateTask(input)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  updateTaskStatus: async (id, status) => {
    set({ error: null })
    try {
      const updated = await taskService.updateTaskStatus(id, status)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === updated.id ? updated : t)),
      }))
      return updated
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  deleteTask: async (id) => {
    set({ error: null })
    try {
      await taskService.deleteTask(id)
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },
}))
