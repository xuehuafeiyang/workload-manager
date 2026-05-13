import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/members', label: '人员管理', icon: '👥' },
  { to: '/projects', label: '项目管理', icon: '📁' },
  { to: '/time-entries', label: '工时记录', icon: '⏱' },
  { to: '/settings', label: '设置', icon: '⚙' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white shadow-md flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">工作量管理</h1>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
