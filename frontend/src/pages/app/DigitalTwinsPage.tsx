import { useState } from 'react'
import { Package, Truck, Users, DollarSign, Activity, MapPinned } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import ResilienceBar from '../../components/ui/ResilienceBar'
import ModeIcon from '../../components/ui/ModeIcon'
import { useStore } from '../../store/shipmentStore'
import { DUMMY_SUPPLIERS, DUMMY_TWINS, DUMMY_FINANCIALS } from '../../data/dummy'
import { formatCurrency } from '../../lib/utils'

type TabId = 'order' | 'shipment' | 'supplier' | 'financial'
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'order', label: 'Order Twin', icon: <Package size={15} /> },
  { id: 'shipment', label: 'Shipment Twin', icon: <Truck size={15} /> },
  { id: 'supplier', label: 'Supplier Twin', icon: <Users size={15} /> },
  { id: 'financial', label: 'Financial Twin', icon: <DollarSign size={15} /> },
]

function OrderTwinTab() {
  const { shipments } = useStore()
  return <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{shipments.filter(s => s.status !== 'delivered').map(s => <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"><div className="flex items-center justify-between mb-2"><p className="font-mono font-bold text-sm">{s.id}</p><Badge auto>{s.priority}</Badge></div><p className="text-sm mb-2">{s.origin} → {s.destination}</p><ModeIcon mode={s.mode} /><div className="mt-3"><ResilienceBar score={s.resilience} /></div></div>)}</div>
}

function ShipmentTwinTab() {
  const { shipments } = useStore()
  return <div className="space-y-4">{Object.entries(DUMMY_TWINS).map(([id, twin]) => {const shipment = shipments.find(s => s.id === id); if (!shipment) return null; return <div key={id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span className={`status-dot ${twin.executionStatus === 'normal' ? 'active' : twin.executionStatus === 'delayed' ? 'warning' : 'danger'}`} /><span className="font-mono font-bold">{id}</span><Badge auto>{twin.executionStatus}</Badge></div><span className="text-xs text-slate-400 flex items-center gap-1"><Activity size={12} /> Live</span></div><div className="grid md:grid-cols-2 gap-4"><div className="rounded-xl p-3 bg-slate-50 text-sm"><p className="text-xs text-slate-400">Segment</p>{twin.currentSegment}</div><div className="rounded-xl p-3 bg-[#0a0c10] text-white map-grid"><p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><MapPinned size={12}/> mini-map</p><div className="h-16 relative"><svg className="absolute inset-0 w-full h-full"><polyline points="10,40 65,22 130,32 200,12" fill="none" stroke="#f97316" strokeWidth="3" /></svg></div></div></div><div className="mt-3"><ResilienceBar score={shipment.resilience} /></div></div>})}</div>
}

function SupplierTwinTab() {
  const [selected, setSelected] = useState(DUMMY_SUPPLIERS[0].id)
  const supplier = DUMMY_SUPPLIERS.find(s => s.id === selected)!
  const radarData = [{ subject: 'On-Time', value: supplier.onTimeRate }, { subject: 'Capacity', value: supplier.capacity }, { subject: 'Reliability', value: 100 - supplier.riskScore }, { subject: 'Coverage', value: 80 }, { subject: 'Response', value: 75 }]
  return <div className="grid xl:grid-cols-3 gap-6"><div className="xl:col-span-2 space-y-3">{DUMMY_SUPPLIERS.map(s => <div key={s.id} onClick={() => setSelected(s.id)} className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all ${selected === s.id ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'}`}><div className="flex items-center justify-between"><p className="font-semibold">{s.name}</p><Badge variant={s.reliability === 'High' ? 'success' : s.reliability === 'Medium' ? 'warning' : 'danger'}>{s.reliability}</Badge></div></div>)}</div><div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5"><p className="font-semibold mb-3">{supplier.name}</p><ResponsiveContainer width="100%" height={220}><RadarChart data={radarData}><PolarGrid stroke="#f1f5f9" /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} /><Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} /></RadarChart></ResponsiveContainer></div></div>
}

function FinancialTwinTab() {
  return <div className="space-y-6"><div className="grid md:grid-cols-3 gap-4">{DUMMY_FINANCIALS.map(f => <div key={f.shipmentId} className="bg-white rounded-2xl border border-slate-200 shadow-card p-5"><p className="font-mono font-bold mb-3">{f.shipmentId}</p><p className="text-sm text-slate-500">Proposed New Rate</p><p className="text-2xl font-bold text-orange-600">{formatCurrency(f.total, '$')}</p><p className="text-xs text-slate-400 line-through">{formatCurrency(f.total + 286, '$')}</p></div>)}</div><div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5"><p className="font-semibold mb-4">Cost Breakdown by Shipment</p><ResponsiveContainer width="100%" height={200}><BarChart data={DUMMY_FINANCIALS.map(f => ({ name: f.shipmentId, Base: f.baseCost, Fuel: f.fuelSurcharge, Customs: f.customs, LastMile: f.lastMile }))}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="Base" stackId="a" fill="#f97316" /><Bar dataKey="Fuel" stackId="a" fill="#0ea5e9" /><Bar dataKey="Customs" stackId="a" fill="#f59e0b" /><Bar dataKey="LastMile" stackId="a" fill="#10b981" /></BarChart></ResponsiveContainer></div></div>
}

export default function DigitalTwinsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('order')
  const TAB_COMPONENTS: Record<TabId, React.ReactNode> = { order: <OrderTwinTab />, shipment: <ShipmentTwinTab />, supplier: <SupplierTwinTab />, financial: <FinancialTwinTab /> }
  return (
    <div className="page-enter">
      <PageHeader title="Digital Twins" subtitle="Live mirrors with predictive execution and negotiation context" />
      <div className="flex gap-1 mb-6 bg-orange-50 rounded-xl p-1 w-fit border border-orange-100">{TABS.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-card' : 'text-slate-500 hover:text-slate-700'}`}>{tab.icon} {tab.label}</button>)}</div>
      <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{TAB_COMPONENTS[activeTab]}</motion.div></AnimatePresence>
    </div>
  )
}
