import { useState, useMemo } from 'react'
import { Search, X, ChevronRight, RotateCcw, MapPinned, Truck, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import ModeIcon from '../../components/ui/ModeIcon'
import ResilienceBar from '../../components/ui/ResilienceBar'
import { useStore } from '../../store/shipmentStore'
import { DUMMY_TWINS, DUMMY_AGENT_LOG } from '../../data/dummy'
import { formatCurrency } from '../../lib/utils'
import { replanShipment } from '../../api/client'

export default function ShipmentsPage() {
  const { shipments } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [replanning, setReplanning] = useState(false)

  const filtered = useMemo(
    () =>
      shipments.filter((s) => {
        const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.origin.toLowerCase().includes(search.toLowerCase()) || s.destination.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || s.status === statusFilter
        const matchMode = modeFilter === 'all' || s.mode === modeFilter
        return matchSearch && matchStatus && matchMode
      }),
    [shipments, search, statusFilter, modeFilter]
  )

  const selectedShipment = shipments.find((s) => s.id === selected)
  const selectedTwin = selected ? DUMMY_TWINS[selected as keyof typeof DUMMY_TWINS] : null

  async function handleReplan() {
    if (!selected) return
    setReplanning(true)
    toast.loading('Requesting AI replan...', { id: 'replan' })
    await replanShipment(selected)
    await new Promise((r) => setTimeout(r, 1500))
    setReplanning(false)
    toast.success('Route replanned by AI agents!', { id: 'replan' })
  }

  return (
    <div className="page-enter">
      <PageHeader title="Shipment Operations" subtitle={`${filtered.length} shipments shown`} actions={<button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all">+ New Shipment</button>} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-[240px] max-w-sm shadow-card">
          <Search size={15} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, origin, destination..." className="bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none shadow-card cursor-pointer"><option value="all">All Statuses</option><option value="on-track">On Track</option><option value="in-transit">In Transit</option><option value="at-risk">At Risk</option><option value="delayed">Delayed</option><option value="delivered">Delivered</option></select>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none shadow-card cursor-pointer"><option value="all">All Modes</option><option value="air">Air</option><option value="ocean">Ocean</option><option value="road">Road</option></select>
        {(search || statusFilter !== 'all' || modeFilter !== 'all') && <button onClick={() => { setSearch(''); setStatusFilter('all'); setModeFilter('all') }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"><X size={14} /> Clear</button>}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-100">{['Shipment ID', 'Route', 'Mode', 'Status', 'ETA', 'Resilience', 'Risk', 'Cost', ''].map((h) => <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)} className={`cursor-pointer transition-colors hover:bg-orange-50/50 ${selected === s.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''}`}>
                    <td className="px-5 py-4"><span className="font-mono text-sm font-semibold text-slate-800">{s.id}</span><p className="text-xs text-slate-400">{s.carrier}</p></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{s.origin} → {s.destination}</td>
                    <td className="px-4 py-4"><ModeIcon mode={s.mode} /></td>
                    <td className="px-4 py-4"><Badge auto dot>{s.status}</Badge></td>
                    <td className="px-4 py-4 text-sm text-slate-600">{new Date(s.eta).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-4 py-4 w-36"><ResilienceBar score={s.resilience} /></td>
                    <td className="px-4 py-4"><Badge auto>{s.risk}</Badge></td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-700">{formatCurrency(s.cost)}</td>
                    <td className="px-4 py-4"><ChevronRight size={16} className={`text-slate-300 transition-transform ${selected === s.id ? 'rotate-90 text-orange-500' : ''}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400"><span>Showing {filtered.length} of {shipments.length} shipments</span><span>Dummy data mode — connect backend to load live shipments</span></div>
        </div>

        <AnimatePresence>
          {selected && selectedShipment && (
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="bg-white rounded-2xl border border-slate-200 shadow-elevated overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><p className="font-mono font-bold text-slate-900">{selectedShipment.id}</p><p className="text-xs text-slate-400 mt-0.5">{selectedShipment.carrier}</p></div><button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} className="text-slate-400" /></button></div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2"><Badge auto dot>{selectedShipment.status}</Badge><Badge auto>{selectedShipment.risk}</Badge></div>
                <div className="bg-[#0a0c10] rounded-xl p-4 text-white map-grid">
                  <div className="flex items-center gap-2 mb-3"><MapPinned size={14} className="text-orange-400" /><span className="text-sm">Live route map</span></div>
                  <div className="h-24 relative rounded-lg border border-slate-700 bg-black/40">
                    <svg className="absolute inset-0 w-full h-full"><polyline points="20,60 95,30 165,50 250,26" fill="none" stroke="#f97316" strokeWidth="3" /></svg>
                    <div className="absolute left-4 top-[48px] w-6 h-6 rounded-full bg-blue-500 text-center leading-6 text-xs">🚛</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3"><p className="text-xs text-slate-500">Milestone</p><p className="font-semibold text-sm flex items-center gap-1"><Truck size={12} className="text-orange-500" /> In transit</p></div>
                  <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Documents</p><p className="font-semibold text-sm flex items-center gap-1"><FileText size={12} /> 3 docs</p></div>
                </div>
                {selectedTwin && <div className="bg-slate-50 rounded-xl p-3 text-sm"><p className="text-slate-500 mb-1">Current segment</p><p className="font-medium">{selectedTwin.currentSegment}</p></div>}
                <div className="space-y-2">{DUMMY_AGENT_LOG.slice(0, 2).map((log, i) => <p key={i} className="text-xs text-slate-500">{log.time} · {log.message}</p>)}</div>
                <button onClick={handleReplan} disabled={replanning} className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-3 rounded-xl">{replanning ? 'Replanning...' : <><RotateCcw size={14} /> Request AI Replan</>}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
