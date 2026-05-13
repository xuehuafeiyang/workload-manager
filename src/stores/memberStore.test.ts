import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMemberStore } from './memberStore'

// mock memberService
vi.mock('../services/memberService', () => ({
  memberService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { memberService } from '../services/memberService'
const mockService = vi.mocked(memberService)

const mockMember = {
  id: 1,
  name: '张三',
  role: '开发工程师',
  dailyHours: 8,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  // 重置 store 状态
  useMemberStore.setState({ members: [], loading: false, error: null })
  vi.clearAllMocks()
})

describe('memberStore', () => {
  it('fetchMembers 成功时更新 members 列表', async () => {
    mockService.list.mockResolvedValue([mockMember])
    await useMemberStore.getState().fetchMembers()
    expect(useMemberStore.getState().members).toEqual([mockMember])
    expect(useMemberStore.getState().loading).toBe(false)
    expect(useMemberStore.getState().error).toBeNull()
  })

  it('fetchMembers 失败时设置 error', async () => {
    mockService.list.mockRejectedValue(new Error('网络错误'))
    await useMemberStore.getState().fetchMembers()
    expect(useMemberStore.getState().error).toContain('网络错误')
    expect(useMemberStore.getState().loading).toBe(false)
  })

  it('createMember 成功时追加到 members 列表', async () => {
    mockService.create.mockResolvedValue(mockMember)
    await useMemberStore.getState().createMember({ name: '张三', role: '开发工程师', dailyHours: 8 })
    expect(useMemberStore.getState().members).toContainEqual(mockMember)
  })

  it('createMember 失败时设置 error 并重新抛出', async () => {
    mockService.create.mockRejectedValue(new Error('创建失败'))
    await expect(
      useMemberStore.getState().createMember({ name: '张三', role: '开发工程师', dailyHours: 8 })
    ).rejects.toThrow('创建失败')
    expect(useMemberStore.getState().error).toContain('创建失败')
  })

  it('updateMember 成功时替换对应成员', async () => {
    useMemberStore.setState({ members: [mockMember] })
    const updated = { ...mockMember, role: '高级工程师' }
    mockService.update.mockResolvedValue(updated)
    await useMemberStore.getState().updateMember({ id: 1, name: '张三', role: '高级工程师', dailyHours: 8 })
    expect(useMemberStore.getState().members[0].role).toBe('高级工程师')
  })

  it('deleteMember 成功时从列表移除', async () => {
    useMemberStore.setState({ members: [mockMember] })
    mockService.delete.mockResolvedValue(undefined)
    await useMemberStore.getState().deleteMember(1)
    expect(useMemberStore.getState().members).toHaveLength(0)
  })
})
