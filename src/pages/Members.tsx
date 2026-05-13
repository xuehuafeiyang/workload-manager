import { useEffect, useState } from 'react'
import { useMemberStore } from '../stores/memberStore'
import type { Member, CreateMemberInput } from '../types'

interface MemberFormData {
  name: string
  role: string
  dailyHours: number
}

const emptyForm: MemberFormData = { name: '', role: '', dailyHours: 8 }

export default function Members() {
  const { members, loading, error, fetchMembers, createMember, updateMember, deleteMember } =
    useMemberStore()

  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberFormData>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (member: Member) => {
    setEditTarget(member)
    setForm({ name: member.name, role: member.role, dailyHours: member.dailyHours })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError('姓名不能为空')
      return
    }
    if (!form.role.trim()) {
      setFormError('角色不能为空')
      return
    }
    if (form.dailyHours <= 0) {
      setFormError('日标准工时必须大于 0')
      return
    }

    try {
      if (editTarget) {
        await updateMember({ id: editTarget.id, ...form })
      } else {
        const input: CreateMemberInput = form
        await createMember(input)
      }
      setShowModal(false)
    } catch (e) {
      setFormError(String(e))
    }
  }

  const handleDelete = async (member: Member) => {
    try {
      await deleteMember(member.id)
    } catch (e) {
      showToast(`删除失败：${String(e)}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">人员管理</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + 新增成员
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日标准工时</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    暂无成员，点击右上角新增
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">{member.role}</td>
                    <td className="px-4 py-3 text-gray-600">{member.dailyHours} 小时</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(member)}
                        className="text-blue-600 hover:text-blue-800 mr-3 text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
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
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editTarget ? '编辑成员' : '新增成员'}
            </h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：开发工程师"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日标准工时（小时）
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={form.dailyHours}
                  onChange={(e) => setForm({ ...form, dailyHours: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {formError && (
              <p className="text-red-500 text-xs mb-3">{formError}</p>
            )}
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

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
