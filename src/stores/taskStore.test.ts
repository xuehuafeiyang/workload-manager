import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskStore } from './taskStore'

vi.mock('../services/taskService', () => ({
  taskService: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
  },
}))

import { taskService } from '../services/taskService'
const mockService = vi.mocked(taskService)

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
  useTaskStore.setState({ tasks: [], loading: false, error: null })
  vi.clearAllMocks()
})

describe('taskStore', () => {
  it('fetchTasks 成功时更新 tasks 列表', async () => {
    mockService.listTasks.mockResolvedValue([mockTask])
    await useTaskStore.getState().fetchTasks(1)
    expect(useTaskStore.getState().tasks).toEqual([mockTask])
    expect(useTaskStore.getState().loading).toBe(false)
  })

  it('fetchTasks 失败时设置 error', async () => {
    mockService.listTasks.mockRejectedValue(new Error('加载失败'))
    await useTaskStore.getState().fetchTasks(1)
    expect(useTaskStore.getState().error).toContain('加载失败')
  })

  it('createTask 成功时追加到列表', async () => {
    mockService.createTask.mockResolvedValue(mockTask)
    await useTaskStore.getState().createTask({ projectId: 1, title: '测试任务', source: 'manual' })
    expect(useTaskStore.getState().tasks).toContainEqual(mockTask)
  })

  it('updateTask 成功时替换对应任务', async () => {
    useTaskStore.setState({ tasks: [mockTask] })
    const updated = { ...mockTask, title: '更新任务' }
    mockService.updateTask.mockResolvedValue(updated)
    await useTaskStore.getState().updateTask({ id: 1, title: '更新任务' })
    expect(useTaskStore.getState().tasks[0].title).toBe('更新任务')
  })

  it('updateTaskStatus 成功时更新任务状态并返回更新后的任务', async () => {
    useTaskStore.setState({ tasks: [mockTask] })
    const updated = { ...mockTask, status: 'done' as const }
    mockService.updateTaskStatus.mockResolvedValue(updated)
    const result = await useTaskStore.getState().updateTaskStatus(1, 'done')
    expect(useTaskStore.getState().tasks[0].status).toBe('done')
    expect(result.status).toBe('done')
  })

  it('deleteTask 成功时从列表移除', async () => {
    useTaskStore.setState({ tasks: [mockTask] })
    mockService.deleteTask.mockResolvedValue(undefined)
    await useTaskStore.getState().deleteTask(1)
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })
})
