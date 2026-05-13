import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { useMemberStore } from '../stores/memberStore'
import ActualHoursDialog from '../components/dialogs/ActualHoursDialog'
import type { Task, CreateTaskInput } from '../types'

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface TaskFormData {
  title: string
  source: 'manual' | 'import' | 'auto'
  note: string
  assigneeId: string
  estimatedHours: number
}

const emptyForm: TaskFormData = {
  title: '',
  source: 'manual',
  note: '',
  assigneeId: '',
  estimatedHours: 0,
}

const statusLabel: Record<TaskStatus, string> = {
  todo: '待处理',
  in_progress: '进行中',
  done: '已完成',
}

const statusColor: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
}

const sourceLabel: Record<Task['source'], string> = {
  manual: '手动',
  import: '导入',
  auto: '自动',
}

export default function Tasks() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const parsedProjectId = Number(projectId)

  const { tasks, loading, error, fetchTasks, createTask, updateTask, updateTaskStatus, deleteTask } =
    useTaskStore()
  const { members, fetchMembers } = useMemberStore()

  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskFormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [actualHoursTask, setActualHoursTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!isNaN(parsedProjectId)) {
      fetchTasks(parsedProjectId)
    }
    fetchMembers()
  }, [parsedProjectId, fetchTasks, fetchMembers])

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus)

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (task: Task) => {
    setEditTarget(task)
    setForm({
      title: task.title,
      source: task.source,
      note: task.note,
      assigneeId: task.assigneeId ? String(task.assigneeId) : '',
      estimatedHours: task.estimatedHours,
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setFormError('任务名称不能为空')
      return
    }

    try {
      if (editTarget) {
        await updateTask({
          id: editTarget.id,
          title: form.title,
          source: form.source,
          note: form.note || undefined,
          assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
          estimatedHours: form.estimatedHours || undefined,
        })
      } else {
        const input: CreateTaskInput = {
          projectId: parsedProjectId,
          title: form.title,
          source: form.source,
          note: form.note || undefined,
          assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
          estimatedHours: form.estimatedHours || undefined,
        }
        await createTask(input)
      }
      setShowModal(false)
    } catch (e) {
      setFormError(String(e))
    }
  }

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    setStatusError(null)
    try {
      if (newStatus === 'done') {
        // 完成时弹出实际工时对话框
        setActualHoursTask(task)
      } else {
        await updateTaskStatus(task.id, newStatus)
      }
    } catch (e) {
      setStatusError(String(e))
    }
  }

  const handleActualHoursConfirm = async (hours: number) => {
    if (!actualHoursTask) return
    try {
      await updateTask({
        id: actualHoursTask.id,
        title: actualHoursTask.title,
        source: actualHoursTask.source,
        note: actualHoursTask.note || undefined,
        assigneeId: actualHoursTask.assigneeId,
        estimatedHours: actualHoursTask.estimatedHours,
        actualHours: hours,
      })
      await updateTaskStatus(actualHoursTask.id, 'done')
    } catch (e) {
      setStatusError(String(e))
    } finally {
      setActualHoursTask(null)
    }
  }

  if (isNaN(parsedProjectId)) {
    return (
      <div className="text-red-600">无效的项目 ID</div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 返回项目
        </button>
        <h1 className="text-2xl font-bold text-gray-800">任务管理</h1>
        <button
          onClick={openCreate}
          className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + 新增任务
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? '全部' : statusLabel[s]}
          </button>
        ))}
      </div>

      {(error || statusError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {error || statusError}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">任务名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">来源</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">负责人</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">预估工时</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">实际工时</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    暂无任务
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{task.title}</td>
                    <td className="px-4 py-3 text-gray-500">{sourceLabel[task.source]}</td>
                    <td className="px-4 py-3 text-gray-600">{task.assigneeName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        className={`text-xs px-2 py-1 rounded-md border-0 font-medium cursor-pointer ${statusColor[task.status]}`}
                      >
                        <option value="todo">待处理</option>
                        <option value="in_progress">进行中</option>
                        <option value="done">已完成</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.estimatedHours ? `${task.estimatedHours}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.effectiveActualHours != null
                        ? `${task.effectiveActualHours}h`
                        : task.actualHours != null
                        ? `${task.actualHours}h`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(task)}
                        className="text-blue-600 hover:text-blue-800 mr-3 text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
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

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[480px] max-w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editTarget ? '编辑任务' : '新增任务'}
            </h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任务名称</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入任务名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as Task['source'] })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">手动</option>
                    <option value="import">导入</option>
                    <option value="auto">自动</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不指定</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预估工时（小时）
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.estimatedHours}
                  onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="可选备注"
                />
              </div>
            </div>
            {formError && <p className="text-red-500 text-xs mb-3">{formError}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                {editTarget ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 实际工时对话框 */}
      {actualHoursTask && (
        <ActualHoursDialog
          estimatedHours={actualHoursTask.estimatedHours}
          onConfirm={handleActualHoursConfirm}
          onCancel={() => setActualHoursTask(null)}
        />
      )}
    </div>
  )
}
