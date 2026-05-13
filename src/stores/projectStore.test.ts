import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'

vi.mock('../services/projectService', () => ({
  projectService: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
    markBudgetWarned: vi.fn(),
  },
}))

import { projectService } from '../services/projectService'
const mockService = vi.mocked(projectService)

const mockProject = {
  id: 1,
  name: '测试项目',
  budgetHours: 100,
  status: 'active' as const,
  overBudgetWarned: false,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  useProjectStore.setState({ projects: [], loading: false, error: null })
  vi.clearAllMocks()
})

describe('projectStore', () => {
  it('fetchProjects 成功时更新 projects 列表', async () => {
    mockService.listProjects.mockResolvedValue([mockProject])
    await useProjectStore.getState().fetchProjects()
    expect(useProjectStore.getState().projects).toEqual([mockProject])
    expect(useProjectStore.getState().loading).toBe(false)
  })

  it('fetchProjects 失败时设置 error', async () => {
    mockService.listProjects.mockRejectedValue(new Error('加载失败'))
    await useProjectStore.getState().fetchProjects()
    expect(useProjectStore.getState().error).toContain('加载失败')
  })

  it('createProject 成功时追加到列表', async () => {
    mockService.createProject.mockResolvedValue(mockProject)
    await useProjectStore.getState().createProject({ name: '测试项目', budgetHours: 100 })
    expect(useProjectStore.getState().projects).toContainEqual(mockProject)
  })

  it('updateProject 成功时替换对应项目', async () => {
    useProjectStore.setState({ projects: [mockProject] })
    const updated = { ...mockProject, name: '更新项目' }
    mockService.updateProject.mockResolvedValue(updated)
    await useProjectStore.getState().updateProject({
      id: 1,
      name: '更新项目',
      budgetHours: 100,
      status: 'active',
    })
    expect(useProjectStore.getState().projects[0].name).toBe('更新项目')
  })

  it('archiveProject 成功时将项目状态改为 archived', async () => {
    useProjectStore.setState({ projects: [mockProject] })
    mockService.archiveProject.mockResolvedValue(undefined)
    await useProjectStore.getState().archiveProject(1)
    expect(useProjectStore.getState().projects[0].status).toBe('archived')
  })

  it('markBudgetWarned 成功时将 overBudgetWarned 设为 true', async () => {
    useProjectStore.setState({ projects: [mockProject] })
    mockService.markBudgetWarned.mockResolvedValue(undefined)
    await useProjectStore.getState().markBudgetWarned(1)
    expect(useProjectStore.getState().projects[0].overBudgetWarned).toBe(true)
  })
})
