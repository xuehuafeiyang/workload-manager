import { invoke } from '@tauri-apps/api/core'
import type { TimeEntry, CreateTimeEntryInput } from '../types'

export interface TimeEntryFilter {
  taskId?: number
  memberId?: number
  startDate?: string
  endDate?: string
}

export const timeEntryService = {
  listTimeEntries: (filter: TimeEntryFilter) =>
    invoke<TimeEntry[]>('list_time_entries', { filter }),
  createTimeEntry: (input: CreateTimeEntryInput) =>
    invoke<TimeEntry>('create_time_entry', { input }),
  updateTimeEntry: (input: {
    id: number
    taskId: number
    memberId: number
    date: string
    hours: number
  }) => invoke<TimeEntry>('update_time_entry', { input }),
  deleteTimeEntry: (id: number) => invoke<void>('delete_time_entry', { id }),
}
