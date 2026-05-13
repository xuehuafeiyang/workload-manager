import { create } from 'zustand'
import type { TimeEntry, CreateTimeEntryInput } from '../types'
import { timeEntryService, type TimeEntryFilter } from '../services/timeEntryService'

interface TimeEntryStore {
  timeEntries: TimeEntry[]
  loading: boolean
  error: string | null
  fetchTimeEntries: (filter: TimeEntryFilter) => Promise<void>
  createTimeEntry: (input: CreateTimeEntryInput) => Promise<void>
  updateTimeEntry: (input: {
    id: number
    taskId: number
    memberId: number
    date: string
    hours: number
  }) => Promise<void>
  deleteTimeEntry: (id: number) => Promise<void>
}

export const useTimeEntryStore = create<TimeEntryStore>((set) => ({
  timeEntries: [],
  loading: false,
  error: null,

  fetchTimeEntries: async (filter) => {
    set({ loading: true, error: null })
    try {
      const timeEntries = await timeEntryService.listTimeEntries(filter)
      set({ timeEntries, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  createTimeEntry: async (input) => {
    set({ error: null })
    try {
      const entry = await timeEntryService.createTimeEntry(input)
      set((state) => ({ timeEntries: [...state.timeEntries, entry] }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  updateTimeEntry: async (input) => {
    set({ error: null })
    try {
      const updated = await timeEntryService.updateTimeEntry(input)
      set((state) => ({
        timeEntries: state.timeEntries.map((e) => (e.id === updated.id ? updated : e)),
      }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },

  deleteTimeEntry: async (id) => {
    set({ error: null })
    try {
      await timeEntryService.deleteTimeEntry(id)
      set((state) => ({ timeEntries: state.timeEntries.filter((e) => e.id !== id) }))
    } catch (e) {
      set({ error: String(e) })
      throw e
    }
  },
}))
