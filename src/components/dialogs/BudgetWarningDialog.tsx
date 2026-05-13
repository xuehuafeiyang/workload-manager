interface Props {
  projectName: string
  onClose: () => void
}

export default function BudgetWarningDialog({ projectName, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-semibold text-red-600">预算超支警告</h2>
        </div>
        <p className="text-gray-700 mb-6">
          项目 <span className="font-semibold">「{projectName}」</span> 的实际消耗工时已超过预算工时，请及时关注并调整资源分配。
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}
