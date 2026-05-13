import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import BudgetWarningDialog from '../components/dialogs/BudgetWarningDialog'
import type { Project, CreateProjectInput } from '../types'

interface ProjectFormData {
  name: string
  budgetHours: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'archived'
}

const emptyForm: ProjectFormData = {
  name: '',
  budgetHours: 100,
  startDate: '',
  endDate: '',
  status: 'active',
}

const statusLabel: Record<Project['status'], string> = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
}

const statusColor: Record<Project['status'], string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
}

export default function Projects() {
  const { projects, loading, error, fetchProjects, createProject, updateProject, archiveProject, markBudgetWarned } =
    useProjectStore()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectFormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [budgetWarnProject, setBudgetWarnProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 检查是否有超预算且未警告的项目
  useEffect(() => {
    const overBudget = projects.find(
      (p) =>
        !p.overBudgetWarned &&
        p.consumedHours !== undefined &&
        p.consumedHours > p.budgetHours
    )
    if (overBudget) {
      setBudgetWarnProject(overBudget)
    }
  }, [projects])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (project: Project) => {
    setEditTarget(project)
    setForm({
      name: project.name,
      budgetHours: project.budgetHours,
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      status: project.status,
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('项目名称不能为空')
      return
    }
    if (form.budgetHours <= 0) {
      setFormError('预算工时必须大于 0')
      return
    }

    try {
      if (editTarget) {
        await updateProject({
          id: editTarget.id,
          name: form.name,
          budgetHours: form.budgetHours,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          status: form.status,
        })
      } else {
        const input: CreateProjectInput = {
          name: form.name,
          budgetHours: form.budgetHours,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
        }
        await createProject(input)
      }
      setShowModal(false)
    } catch (e) {
      setFormError(String(e))
    }
  }

  const handleArchive = async (project: Project) => {
    try {
      await archiveProject(project.id)
    } catch (e) {
      console.error('归档失败', e)
    }
  }

  const handleBudgetWarnClose = async () => {
    if (budgetWarnProject) {
      await markBudgetWarned(budgetWarnProject.id)
    }
    setBudgetWarnProject(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">项目管理</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + 新建项目
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">项目名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">预算工时</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">已消耗</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">剩余</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">进度</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    暂无项目，点击右上角新建
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const consumed = project.consumedHours ?? 0
                  const remaining = project.remainingHours ?? project.budgetHours
                  const percentage = project.budgetHours > 0 ? (consumed / project.budgetHours) * 100 : 0
                  const isOver = consumed > project.budgetHours

                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/projects/${project.id}/tasks`)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {project.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{project.budgetHours}h</td>
                      <td className={`px-4 py-3 ${isOver ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {consumed}h
                      </td>
                      <td className={`px-4 py-3 ${remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {remaining}h
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[project.status]}`}>
                          {statusLabel[project.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs mt-0.5 block ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(project)}
                          className="text-blue-600 hover:text-blue-800 mr-3 text-xs"
                        >
                          编辑
                        </button>
                        {project.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(project)}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            归档
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
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
              {editTarget ? '编辑项目' : '新建项目'}
            </h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算工时（小时）</label>
                <input
                  type="number"
                  min="1"
                  value={form.budgetHours}
                  onChange={(e) => setForm({ ...form, budgetHours: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {editTarget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Project['status'] })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
              )}
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

      {/* 超预算警告弹窗 */}
      {budgetWarnProject && (
        <BudgetWarningDialog
          projectName={budgetWarnProject.name}
          onClose={handleBudgetWarnClose}
        />
      )}
    </div>
  )
}
