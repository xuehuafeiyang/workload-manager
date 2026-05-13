import { useEffect, useState } from 'react'
import { useTimeEntryStore } from '../stores/timeEntryStore'
import { useMemberStore } from '../stores/memberStore'
import { useProjectStore } from '../stores/projectStore'
import { taskService } from '../services/taskService'
import type { CreateTimeEntryInput, Task } from '../types'

interface QuickEntryForm {
  memberId: string
  taskId: string
  hours: string
  date: string
}

const today = new Date().toISOString().split('T')[0]

const emptyQuickForm: QuickEntryForm = {
  memberId: '',
  taskId: '',
  hours: '',
  date: today,
}

export default function TimeEntries() {
  const { timeEntries, loading, error, fetchTimeEntries, createTimeEntry, deleteTimeEntry } =
    useTimeEntryStore()
  const { members, fetchMembers } = useMemberStore()
  const { projects, fetchProjects } = useProjectStore()

  // 本地维护任务列表，避免污染全局 taskStore 的 currentProjectId
  const [localTasks, setLocalTasks] = useState<Task[]>([])

  const [quickForm, setQuickForm] = useState<QuickEntryForm>(emptyQuickForm)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeEntries({})
    fetchMembers()
    fetchProjects()
  }, [fetchTimeEntries, fetchMembers, fetchProjects])

  // 当选择项目时本地加载对应任务，不影响全局 taskStore
  useEffect(() => {
    if (selectedProjectId) {
      taskService.listTasks(Number(selectedProjectId))
        .then(setLocalTasks)
        .catch(() => setLocalTasks([]))
    } else {
      setLocalTasks([])
    }
  }, [selectedProjectId])

  const handleQuickSubmit = async () => {
    if (!quickForm.memberId) {
      setFormError('请选择成员')
      return
    }
    if (!quickForm.taskId) {
      setFormError('请选择任务')
      return
    }
    const hours = parseFloat(quickForm.hours)
    if (isNaN(hours) || hours <= 0) {
      setFormError('请输入有效工时（大于 0）')
      return
    }
    if (!quickForm.date) {
      setFormError('请选择日期')
      return
    }

    const input: CreateTimeEntryInput = {
      memberId: Number(quickForm.memberId),
      taskId: Number(quickForm.taskId),
      hours,
      date: quickForm.date,
    }

    try {
      await createTimeEntry(input)
      setQuickForm(emptyQuickForm)
      setFormError(null)
      // 刷新列表
      await fetchTimeEntries({})
    } catch (e) {
      setFormError(String(e))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">工时记录</h1>

      {/* 快速录入表单 */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">快速录入</h2>
        <div className="grid grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">成员</label>
            <select
              value={quickForm.memberId}
              onChange={(e) => setQuickForm({ ...quickForm, memberId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择成员</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">项目</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value)
                setQuickForm({ ...quickForm, taskId: '' })
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">任务</label>
            <select
              value={quickForm.taskId}
              onChange={(e) => setQuickForm({ ...quickForm, taskId: e.target.value })}
              disabled={!selectedProjectId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">选择任务</option>
              {localTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">工时（小时）</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={quickForm.hours}
              onChange={(e) => setQuickForm({ ...quickForm, hours: e.target.value })}
              placeholder="如：4"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">日期</label>
            <input
              type="date"
              value={quickForm.date}
              onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
        <div className="mt-3">
          <button
            onClick={handleQuickSubmit}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            记录工时
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* 工时记录表格 */}
      {loading ? (
        <div className="text-gray-500 text-sm">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日期</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">任务 ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">成员</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">工时</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    暂无工时记录
                  </td>
                </tr>
              ) : (
                timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{entry.date}</td>
                    <td className="px-4 py-3 text-gray-600">#{entry.taskId}</td>
                    <td className="px-4 py-3 text-gray-600">{entry.memberName ?? `#${entry.memberId}`}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{entry.hours}h</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTimeEntry(entry.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
