import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Truck, Sparkles, Cpu, Network, FlaskConical, BarChart3, Container, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/shipmentStore'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/shipments', icon: Truck, label: 'Shipments' },
  { to: '/app/dock-console', icon: Container, label: 'Dock Console' },
  { to: '/app/ai-planner', icon: Sparkles, label: 'AI Planner' },
  { to: '/app/twins', icon: Cpu, label: 'Digital Twins' },
  { to: '/app/agents', icon: Network, label: 'Agents' },
  { to: '/app/simulator', icon: FlaskConical, label: 'Demo Lab' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const navigate = useNavigate()

  function handleSignOut() {
    localStorage.removeItem('tf_authed')
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40',
        'bg-gradient-to-b from-[#1a1208] via-[#261707] to-[#0f172a] border-r border-orange-900/40',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-[60px] px-4 border-b border-slate-800 gap-3', sidebarCollapsed && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 orange-glow">
          <span className="text-white font-bold text-sm font-display">TF</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-white font-semibold text-base font-display tracking-wide">TwinFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
              'text-slate-300 hover:text-white hover:bg-orange-900/30',
              isActive && 'text-white bg-orange-900/30 border-l-2 border-orange-400',
              sidebarCollapsed && 'justify-center px-0 py-3'
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">{label}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-orange-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 border-t border-slate-800 pt-4 space-y-0.5">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-orange-900/30 w-full transition-all"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
        </button>
        <NavLink to="/app/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-orange-900/30 transition-all">
          <Settings size={16} />
          {!sidebarCollapsed && <span className="text-sm">Config</span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 w-full transition-all"
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span className="text-sm">Sign Out</span>}
        </button>
        {!sidebarCollapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500 truncate">admin@twinflow.ai</p>
          </div>
        )}
      </div>
    </aside>
  )
}
