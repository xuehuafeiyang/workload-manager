import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTimeEntryStore } from './timeEntryStore'

vi.mock('../services/timeEntryService', () => ({
  timeEntryService: {
    listTimeEntries: vi.fn(),
    createTimeEntry: vi.fn(),
    updateTimeEntry: vi.fn(),
    deleteTimeEntry: vi.fn(),
  },
}))

import { timeEntryService } from '../services/timeEntryService'
const mockService = vi.mocked(timeEntryService)

const mockEntry = {
  id: 1,
  taskId: 1,
  memberId: 1,
  date: '2024-01-01',
  hours: 4,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  useTimeEntryStore.setState({ timeEntries: [], loading: false, error: null })
  vi.clearAllMocks()
})

describe('timeEntryStore', () => {
  it('fetchTimeEntries 成功时更新 timeEntries 列表', async () => {
    mockService.listTimeEntries.mockResolvedValue([mockEntry])
    await useTimeEntryStore.getState().fetchTimeEntries({ taskId: 1 })
    expect(useTimeEntryStore.getState().timeEntries).toEqual([mockEntry])
    expect(useTimeEntryStore.getState().loading).toBe(false)
  })

  it('fetchTimeEntries 失败时设置 error', async () => {
    mockService.listTimeEntries.mockRejectedValue(new Error('加载失败'))
    await useTimeEntryStore.getState().fetchTimeEntries({})
    expect(useTimeEntryStore.getState().error).toContain('加载失败')
  })

  it('createTimeEntry 成功时追加到列表', async () => {
    mockService.createTimeEntry.mockResolvedValue(mockEntry)
    await useTimeEntryStore.getState().createTimeEntry({
      taskId: 1,
      memberId: 1,
      date: '2024-01-01',
      hours: 4,
    })
    expect(useTimeEntryStore.getState().timeEntries).toContainEqual(mockEntry)
  })

  it('updateTimeEntry 成功时替换对应记录', async () => {
    useTimeEntryStore.setState({ timeEntries: [mockEntry] })
    const updated = { ...mockEntry, hours: 6 }
    mockService.updateTimeEntry.mockResolvedValue(updated)
    await useTimeEntryStore.getState().updateTimeEntry({
      id: 1,
      taskId: 1,
      memberId: 1,
      date: '2024-01-01',
      hours: 6,
    })
    expect(useTimeEntryStore.getState().timeEntries[0].hours).toBe(6)
  })

  it('deleteTimeEntry 成功时从列表移除', async () => {
    useTimeEntryStore.setState({ timeEntries: [mockEntry] })
    mockService.deleteTimeEntry.mockResolvedValue(undefined)
    await useTimeEntryStore.getState().deleteTimeEntry(1)
    expect(useTimeEntryStore.getState().timeEntries).toHaveLength(0)
  })
})
