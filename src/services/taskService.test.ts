import { describe, it, expect, vi, beforeEach } from 'vitest'
import { taskService } from './taskService'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = vi.mocked(invoke)

const mockTask = {
  id: 1,
  projectId: 1,
  title: '测试任务',
  source: 'manual' as const,
  note: '',
  status: 'todo' as const,
  estimatedHours: 8,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
})

describe('taskService', () => {
  it('listTasks 调用 list_tasks 命令并传入 projectId', async () => {
    mockInvoke.mockResolvedValue([mockTask])
    const result = await taskService.listTasks(1)
    expect(mockInvoke).toHaveBeenCalledWith('list_tasks', { projectId: 1 })
    expect(result).toEqual([mockTask])
  })

  it('createTask 调用 create_task 命令并传入 input', async () => {
    const input = { projectId: 1, title: '测试任务', source: 'manual' as const }
    mockInvoke.mockResolvedValue(mockTask)
    const result = await taskService.createTask(input)
    expect(mockInvoke).toHaveBeenCalledWith('create_task', { input })
    expect(result).toEqual(mockTask)
  })

  it('updateTask 调用 update_task 命令并传入 input', async () => {
    const input = { id: 1, title: '更新任务', source: 'manual' as const }
    mockInvoke.mockResolvedValue({ ...mockTask, title: '更新任务' })
    const result = await taskService.updateTask(input)
    expect(mockInvoke).toHaveBeenCalledWith('update_task', { input })
    expect(result).toMatchObject({ title: '更新任务' })
  })

  it('updateTaskStatus 调用 update_task_status 命令并传入 input', async () => {
    mockInvoke.mockResolvedValue({ ...mockTask, status: 'done' })
    const result = await taskService.updateTaskStatus(1, 'done')
    expect(mockInvoke).toHaveBeenCalledWith('update_task_status', { input: { id: 1, status: 'done' } })
    expect(result).toMatchObject({ status: 'done' })
  })

  it('deleteTask 调用 delete_task 命令并传入 id', async () => {
    mockInvoke.mockResolvedValue(undefined)
    await taskService.deleteTask(1)
    expect(mockInvoke).toHaveBeenCalledWith('delete_task', { id: 1 })
  })
})
