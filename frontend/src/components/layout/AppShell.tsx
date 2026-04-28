import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useStore } from '../../store/shipmentStore'

export default function AppShell() {
  const { sidebarCollapsed } = useStore()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <Topbar />
      <main
        className="min-h-screen pt-[60px] transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? '64px' : '240px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
