import { invoke } from '@tauri-apps/api/core'
import type { DashboardData, TrendData } from '../types'

export const reportService = {
  getDashboard: () => invoke<DashboardData>('report_dashboard'),
  getTrend: (granularity: 'day' | 'week', weeks: number) =>
    invoke<TrendData[]>('report_trend', { granularity, weeks }),
}
