import { Bell, Search, ChevronDown } from 'lucide-react'
import { useStore } from '../../store/shipmentStore'

export default function Topbar() {
  const { alerts, sidebarCollapsed } = useStore()
  const criticalCount = alerts.filter(a => a.severity === 'Critical').length

  return (
    <header
      className="fixed top-0 right-0 h-[60px] bg-white/85 backdrop-blur border-b border-orange-200 flex items-center px-6 gap-4 z-30 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '64px' : '240px' }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 flex-1 max-w-xs">
        <Search size={14} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search shipments, alerts..."
          className="bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400 w-full"
        />
      </div>

      <div className="flex-1" />

      {/* System status */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="status-dot active" />
        <span>System Live</span>
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-orange-50 transition-colors">
        <Bell size={18} className="text-slate-600" />
        {criticalCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[10px] flex items-center justify-center font-medium">
            {criticalCount}
          </span>
        )}
      </button>

      {/* User */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">A</span>
        </div>
        <span className="text-sm text-slate-700 font-medium">Admin</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
    </header>
  )
}
