import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { reportService } from '../services/reportService'
import type { DashboardData, TrendData } from '../types'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [granularity, setGranularity] = useState<'day' | 'week'>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const dashboard = await reportService.getDashboard()
        setData(dashboard)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadTrend = async () => {
      try {
        const trend = await reportService.getTrend(granularity, 8)
        setTrendData(trend)
      } catch (e) {
        // 趋势图加载失败不影响主页面
        console.error('趋势数据加载失败', e)
      }
    }
    loadTrend()
  }, [granularity])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        加载失败：{error}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">总预算工时</p>
          <p className="text-3xl font-bold text-gray-800">{data.totalBudgetHours}</p>
          <p className="text-xs text-gray-400 mt-1">小时</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">已消耗工时</p>
          <p className="text-3xl font-bold text-blue-600">{data.totalConsumedHours}</p>
          <p className="text-xs text-gray-400 mt-1">小时</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">剩余工时</p>
          <p className={`text-3xl font-bold ${data.totalRemainingHours < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data.totalRemainingHours}
          </p>
          <p className="text-xs text-gray-400 mt-1">小时</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 项目进度列表 */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">项目进度</h2>
          {data.projectStats.length === 0 ? (
            <p className="text-sm text-gray-400">暂无项目数据</p>
          ) : (
            <div className="space-y-3">
              {data.projectStats.map((stat) => (
                <div key={stat.projectId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${stat.isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                      {stat.projectName}
                      {stat.isOverBudget && <span className="ml-1 text-xs">⚠️ 超预算</span>}
                    </span>
                    <span className="text-gray-500">
                      {stat.consumedHours} / {stat.budgetHours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stat.isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 人员分配饼图 */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">人员工时分配</h2>
          {data.memberStats.length === 0 ? (
            <p className="text-sm text-gray-400">暂无人员数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.memberStats}
                  dataKey="assignedHours"
                  nameKey="memberName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ memberName, percentage }: { memberName: string; percentage: number }) =>
                    `${memberName} ${percentage.toFixed(0)}%`
                  }
                >
                  {data.memberStats.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}h`, '工时']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 趋势折线图 */}
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">工时趋势</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setGranularity('day')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                granularity === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              按天
            </button>
            <button
              onClick={() => setGranularity('week')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                granularity === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              按周
            </button>
          </div>
        </div>
        {trendData.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">暂无趋势数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`${value}h`, '工时']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="hours"
                name="工时"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
