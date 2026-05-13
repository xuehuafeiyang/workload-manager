import { describe, it, expect, vi, beforeEach } from 'vitest'
import { timeEntryService } from './timeEntryService'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = vi.mocked(invoke)

const mockEntry = {
  id: 1,
  taskId: 1,
  memberId: 1,
  date: '2024-01-01',
  hours: 4,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
})

describe('timeEntryService', () => {
  it('listTimeEntries 调用 list_time_entries 命令并传入 filter', async () => {
    const filter = { taskId: 1 }
    mockInvoke.mockResolvedValue([mockEntry])
    const result = await timeEntryService.listTimeEntries(filter)
    expect(mockInvoke).toHaveBeenCalledWith('list_time_entries', { filter })
    expect(result).toEqual([mockEntry])
  })

  it('createTimeEntry 调用 create_time_entry 命令并传入 input', async () => {
    const input = { taskId: 1, memberId: 1, date: '2024-01-01', hours: 4 }
    mockInvoke.mockResolvedValue(mockEntry)
    const result = await timeEntryService.createTimeEntry(input)
    expect(mockInvoke).toHaveBeenCalledWith('create_time_entry', { input })
    expect(result).toEqual(mockEntry)
  })

  it('updateTimeEntry 调用 update_time_entry 命令并传入 input', async () => {
    const input = { id: 1, taskId: 1, memberId: 1, date: '2024-01-01', hours: 6 }
    mockInvoke.mockResolvedValue({ ...mockEntry, hours: 6 })
    const result = await timeEntryService.updateTimeEntry(input)
    expect(mockInvoke).toHaveBeenCalledWith('update_time_entry', { input })
    expect(result).toMatchObject({ hours: 6 })
  })

  it('deleteTimeEntry 调用 delete_time_entry 命令并传入 id', async () => {
    mockInvoke.mockResolvedValue(undefined)
    await timeEntryService.deleteTimeEntry(1)
    expect(mockInvoke).toHaveBeenCalledWith('delete_time_entry', { id: 1 })
  })
})
