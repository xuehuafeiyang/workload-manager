import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projectService } from './projectService'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = vi.mocked(invoke)

const mockProject = {
  id: 1,
  name: '测试项目',
  budgetHours: 100,
  status: 'active' as const,
  overBudgetWarned: false,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
})

describe('projectService', () => {
  it('listProjects 调用 list_projects 命令', async () => {
    mockInvoke.mockResolvedValue([mockProject])
    const result = await projectService.listProjects()
    expect(mockInvoke).toHaveBeenCalledWith('list_projects')
    expect(result).toEqual([mockProject])
  })

  it('createProject 调用 create_project 命令并传入 input', async () => {
    const input = { name: '测试项目', budgetHours: 100 }
    mockInvoke.mockResolvedValue(mockProject)
    const result = await projectService.createProject(input)
    expect(mockInvoke).toHaveBeenCalledWith('create_project', { input })
    expect(result).toEqual(mockProject)
  })

  it('updateProject 调用 update_project 命令并传入 input', async () => {
    const input = { id: 1, name: '更新项目', budgetHours: 200, status: 'active' as const }
    mockInvoke.mockResolvedValue({ ...mockProject, name: '更新项目', budgetHours: 200 })
    const result = await projectService.updateProject(input)
    expect(mockInvoke).toHaveBeenCalledWith('update_project', { input })
    expect(result).toMatchObject({ name: '更新项目' })
  })

  it('archiveProject 调用 archive_project 命令并传入 id', async () => {
    mockInvoke.mockResolvedValue(undefined)
    await projectService.archiveProject(1)
    expect(mockInvoke).toHaveBeenCalledWith('archive_project', { id: 1 })
  })

  it('markBudgetWarned 调用 mark_budget_warned 命令并传入 id', async () => {
    mockInvoke.mockResolvedValue(undefined)
    await projectService.markBudgetWarned(1)
    expect(mockInvoke).toHaveBeenCalledWith('mark_budget_warned', { id: 1 })
  })
})
