import { create } from 'zustand'
import type { Project, CreateProjectInput } from '../types'
import { projectService } from '../services/projectService'

interface ProjectStore {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<void>
  updateProject: (input: {
    id: number
    name: string
    budgetHours: number
    startDate?: string
    endDate?: string
    status: 'active' | 'completed' | 'archived'
  }) => Promise<void>
  archiveProject: (id: number) => Promise<void>
  markBudgetWarned: (id: number) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await projectService.listProjects()
      set({ projects, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  createProject: async (input) => {
    set({ error: null })
    try {
      const project = await projectService.createProject(input)
      set((state) => ({ projects: [...state.projects, project] }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  updateProject: async (input) => {
    set({ error: null })
    try {
      const updated = await projectService.updateProject(input)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === updated.id ? updated : p)),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  archiveProject: async (id) => {
    set({ error: null })
    try {
      await projectService.archiveProject(id)
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, status: 'archived' as const } : p
        ),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  markBudgetWarned: async (id) => {
    set({ error: null })
    try {
      await projectService.markBudgetWarned(id)
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, overBudgetWarned: true } : p
        ),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },
}))
