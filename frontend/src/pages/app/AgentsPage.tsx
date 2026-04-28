import { useState } from 'react'
import { Zap, Filter, Route, Brain, ArrowRight, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { useStore } from '../../store/shipmentStore'
import { triggerDisruption } from '../../api/client'

const AGENT_ICONS: Record<string, React.ReactNode> = { disruption: <Zap size={20} />, constraint: <Filter size={20} />, routing: <Route size={20} />, learning: <Brain size={20} /> }

export default function AgentsPage() {
  const { agents, agentLog, triggerDisruption: simulateDisruption, setAgentStatus, addAgentLog } = useStore()
  const [activeFilter, setActiveFilter] = useState('all')
  const [isTriggering, setIsTriggering] = useState(false)

  async function handleTriggerDisruption() {
    setIsTriggering(true)
    toast.loading('Injecting disruption scenario...', { id: 'agent-disruption' })
    simulateDisruption()
    await triggerDisruption('SHP-001')
    ;['disruption', 'constraint', 'routing', 'learning'].forEach((agentId, i) => setTimeout(() => { setAgentStatus(agentId, 'running'); addAgentLog({ time: new Date().toLocaleTimeString('en-IN'), agent: agentId.charAt(0).toUpperCase() + agentId.slice(1) + 'Agent', level: i === 0 ? 'danger' : i === 3 ? 'success' : 'info', message: 'Workflow step completed with live telemetry update' }); setTimeout(() => setAgentStatus(agentId, 'completed'), 1500) }, i * 1100))
    setTimeout(() => { toast.success('All 4 agents completed!'); setIsTriggering(false) }, 5200)
  }

  const filteredLog = activeFilter === 'all' ? agentLog : agentLog.filter(l => l.agent.toLowerCase().includes(activeFilter))

  return (
    <div className="page-enter">
      <PageHeader title="Agent Network" subtitle="Orchestration + carrier communication + exception closure" actions={<button onClick={handleTriggerDisruption} disabled={isTriggering} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"><Zap size={15} /> {isTriggering ? 'Running agents...' : 'Trigger Demo Disruption'}</button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">{agents.map(agent => <motion.div key={agent.id} className={`bg-white rounded-2xl border border-slate-200 shadow-card p-5 ${agent.status === 'running' ? 'agent-running border-orange-200' : ''}`} animate={agent.status === 'running' ? { scale: [1, 1.01, 1] } : {}} transition={{ duration: 1, repeat: agent.status === 'running' ? Infinity : 0 }}><div className="flex items-start justify-between mb-4"><div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-orange-50 text-orange-500 border-orange-100">{AGENT_ICONS[agent.id]}</div><Badge auto>{agent.status}</Badge></div><p className="font-semibold text-sm mb-1">{agent.name}</p><p className="text-xs text-slate-400">{agent.tech}</p></motion.div>)}</div>

      <div className="grid xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-6"><p className="font-semibold text-slate-900 mb-6 text-sm">LangGraph Orchestration Flow</p><div className="flex items-center justify-center gap-3 flex-wrap">{['Disruption Agent', 'Risk Detected?', 'Constraint Agent', 'Routing Agent', 'Learning Agent'].map((label, i) => <div key={label} className="px-4 py-2.5 rounded-xl border text-xs font-semibold border-orange-200 bg-orange-50 text-orange-700">{label}{i < 4 && <ArrowRight size={12} className="inline ml-2" />}</div>)}</div></div>
        <div className="bg-[#0a0c10] rounded-2xl border border-slate-800 p-5 text-white"><p className="font-semibold mb-3 flex items-center gap-2"><MessageSquare size={14} className="text-orange-300" /> AI Carrier Chat</p><div className="space-y-3 text-sm"><div className="bg-blue-600/70 rounded-xl p-3">AI agent: missing origin milestones. Confirm pickup?</div><div className="bg-slate-800 rounded-xl p-3">Carrier: picked up yesterday 2:15 PM, now in transit.</div><div className="bg-blue-600/70 rounded-xl p-3">AI agent: milestones updated for shipment #7730.</div></div></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden"><div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Agent Activity Feed</h2><div className="flex gap-1">{['all', 'disruption', 'constraint', 'routing', 'learning'].map(f => <button key={f} onClick={() => setActiveFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg capitalize ${activeFilter === f ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{f}</button>)}</div></div><div className="divide-y divide-slate-50 max-h-80 overflow-y-auto"><AnimatePresence initial={false}>{filteredLog.map((log, i) => <motion.div key={`${log.time}-${log.message}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-4 px-6 py-3.5 hover:bg-slate-50"><span className="font-mono text-xs text-slate-400 pt-0.5">{log.time}</span><span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100">{log.agent}</span><span className="text-sm">{log.message}</span></motion.div>)}</AnimatePresence></div></div>
    </div>
  )
}
