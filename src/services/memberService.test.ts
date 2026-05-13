import { describe, it, expect, vi, beforeEach } from 'vitest'
import { memberService } from './memberService'

// mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = vi.mocked(invoke)

const mockMember = {
  id: 1,
  name: '张三',
  role: '开发工程师',
  dailyHours: 8,
  createdAt: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  mockInvoke.mockReset()
})

describe('memberService', () => {
  it('list 调用 list_members 命令', async () => {
    mockInvoke.mockResolvedValue([mockMember])
    const result = await memberService.list()
    expect(mockInvoke).toHaveBeenCalledWith('list_members')
    expect(result).toEqual([mockMember])
  })

  it('create 调用 create_member 命令并传入 input', async () => {
    const input = { name: '张三', role: '开发工程师', dailyHours: 8 }
    mockInvoke.mockResolvedValue(mockMember)
    const result = await memberService.create(input)
    expect(mockInvoke).toHaveBeenCalledWith('create_member', { input })
    expect(result).toEqual(mockMember)
  })

  it('update 调用 update_member 命令并传入 input', async () => {
    const input = { id: 1, name: '张三', role: '高级工程师', dailyHours: 8 }
    mockInvoke.mockResolvedValue({ ...mockMember, role: '高级工程师' })
    const result = await memberService.update(input)
    expect(mockInvoke).toHaveBeenCalledWith('update_member', { input })
    expect(result).toMatchObject({ role: '高级工程师' })
  })

  it('delete 调用 delete_member 命令并传入 id', async () => {
    mockInvoke.mockResolvedValue(undefined)
    await memberService.delete(1)
    expect(mockInvoke).toHaveBeenCalledWith('delete_member', { id: 1 })
  })
})
