import { useState } from 'react'

interface Props {
  estimatedHours: number
  onConfirm: (hours: number) => void
  onCancel: () => void
}

export default function ActualHoursDialog({ estimatedHours, onConfirm, onCancel }: Props) {
  const [hours, setHours] = useState<string>(String(estimatedHours))
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    const parsed = parseFloat(hours)
    if (isNaN(parsed) || parsed <= 0) {
      setError('请输入有效的工时（大于 0 的数字）')
      return
    }
    onConfirm(parsed)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">填写实际工时</h2>
        <p className="text-sm text-gray-500 mb-4">
          任务已完成，请填写实际花费的工时。预估工时为{' '}
          <span className="font-medium text-gray-700">{estimatedHours} 小时</span>。
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            实际工时（小时）
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value)
              setError(null)
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
