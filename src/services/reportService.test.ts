import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportService } from './reportService'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = vi.mocked(invoke)

const mockDashboard = {
  totalBudgetHours: 500,
  totalConsumedHours: 200,
  totalRemainingHours: 300,
  projectStats: [],
  memberStats: [],
  trendData: [],
}

beforeEach(() => {
  mockInvoke.mockReset()
})

describe('reportService', () => {
  it('getDashboard 调用 report_dashboard 命令', async () => {
    mockInvoke.mockResolvedValue(mockDashboard)
    const result = await reportService.getDashboard()
    expect(mockInvoke).toHaveBeenCalledWith('report_dashboard')
    expect(result).toEqual(mockDashboard)
  })

  it('getTrend 调用 report_trend 命令并传入参数', async () => {
    const trendData = [{ label: '2024-01-01', hours: 8 }]
    mockInvoke.mockResolvedValue(trendData)
    const result = await reportService.getTrend('day', 4)
    expect(mockInvoke).toHaveBeenCalledWith('report_trend', { granularity: 'day', weeks: 4 })
    expect(result).toEqual(trendData)
  })

  it('getTrend 支持 week 粒度', async () => {
    mockInvoke.mockResolvedValue([])
    await reportService.getTrend('week', 8)
    expect(mockInvoke).toHaveBeenCalledWith('report_trend', { granularity: 'week', weeks: 8 })
  })
})
