import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { DUMMY_SHIPMENTS, DUMMY_ALERTS, DUMMY_AGENTS, DUMMY_AGENT_LOG } from '../data/dummy'

interface AppState {
  shipments: typeof DUMMY_SHIPMENTS
  alerts: typeof DUMMY_ALERTS
  agents: typeof DUMMY_AGENTS
  agentLog: typeof DUMMY_AGENT_LOG
  sidebarCollapsed: boolean
  activeShipmentId: string | null
  isSimulating: boolean
  triggerDisruption: () => void
  toggleSidebar: () => void
  setActiveShipment: (id: string | null) => void
  setAgentStatus: (agentId: string, status: string) => void
  addAgentLog: (entry: (typeof DUMMY_AGENT_LOG)[0]) => void
}

export const useStore = create<AppState>()(
  immer((set) => ({
    shipments: DUMMY_SHIPMENTS,
    alerts: DUMMY_ALERTS,
    agents: DUMMY_AGENTS,
    agentLog: DUMMY_AGENT_LOG,
    sidebarCollapsed: false,
    activeShipmentId: null,
    isSimulating: false,

    triggerDisruption: () => set((state) => {
      const shp = state.shipments.find(s => s.id === 'SHP-001')
      if (shp) { shp.status = 'at-risk'; shp.resilience = Math.max(10, shp.resilience - 30) }
      state.agents.forEach(a => { a.status = 'running' })
      state.agentLog.unshift({
        time: new Date().toLocaleTimeString('en-IN'),
        agent: 'DisruptionAgent', level: 'danger',
        message: 'LIVE: Cyclone Mocha detected, SHP-001 severity 9/10',
      })
    }),

    toggleSidebar: () => set((state) => { state.sidebarCollapsed = !state.sidebarCollapsed }),
    setActiveShipment: (id) => set((state) => { state.activeShipmentId = id }),
    setAgentStatus: (agentId, status) => set((state) => {
      const agent = state.agents.find(a => a.id === agentId)
      if (agent) agent.status = status
    }),
    addAgentLog: (entry) => set((state) => { state.agentLog.unshift(entry) }),
  }))
)
