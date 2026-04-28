import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { TrendingUp, Leaf, DollarSign, Shield, Package, Filter, Download } from 'lucide-react'
import { DUMMY_ANALYTICS } from '../../data/dummy'

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981']

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')

  return (
    <div className="page-enter">
      <PageHeader
        title="Analytics"
        subtitle="Historical performance, risk trends, and sustainability insights"
        actions={<div className="flex items-center gap-2"><button className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm flex items-center gap-2"><Filter size={14} /> Filter</button><button className="px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-sm flex items-center gap-2"><Download size={14} /> Export</button><select value={dateRange} onChange={e => setDateRange(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none bg-white shadow-card"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select></div>}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-1">Sustainability Overview</h3>
        <p className="text-sm text-slate-500 mb-5">Track emissions and intensity factors across delivered volumes, modes, and distance.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">Last 30 Days Emissions</p><p className="text-3xl font-display font-bold">227 MTCO2e</p></div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50"><p className="text-xs text-slate-500">All-time Emissions</p><p className="text-3xl font-display font-bold">24,000 MTCO2e</p></div>
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50"><p className="text-xs text-slate-500">Quarter trend</p><p className="text-3xl font-display font-bold text-orange-600">+4%</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Shipments" value="12,847" change="+18% vs prev period" changeType="up" icon={<Package size={18} />} accent="sky" />
        <StatCard label="Disruptions Prevented" value="2,341" change="+34% better" changeType="up" icon={<Shield size={18} />} accent="emerald" />
        <StatCard label="Cost Saved" value="₹28L" change="vs unoptimized routes" changeType="up" icon={<DollarSign size={18} />} accent="indigo" />
        <StatCard label="CO₂ Saved" value="48.2t" change="vs air-only routing" changeType="up" icon={<Leaf size={18} />} accent="emerald" />
        <StatCard label="Avg Resilience" value="91.4%" change="+4.2% vs baseline" changeType="up" icon={<TrendingUp size={18} />} accent="amber" />
      </div>

      {/* Charts Grid */}
      <div className="grid xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">On-Time Delivery Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={DUMMY_ANALYTICS.onTimeDelivery}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[80, 100]} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Disruptions by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={DUMMY_ANALYTICS.disruptionTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {DUMMY_ANALYTICS.disruptionTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">Shipping Cost by Mode (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DUMMY_ANALYTICS.costByMode}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="cost" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <h3 className="font-semibold text-slate-900 mb-6">CO₂ Emissions by Mode (kg)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DUMMY_ANALYTICS.co2ByMode}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mode" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="co2" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Learning Agent Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Learning Agent — Model Performance</h3>
        <div className="grid xl:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500 mb-4">XGBoost Resilience Model Accuracy Over Time</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={[
                { batch: 'B338', acc: 88.2 }, { batch: 'B339', acc: 89.1 }, { batch: 'B340', acc: 90.3 },
                { batch: 'B341', acc: 90.8 }, { batch: 'B342', acc: 91.1 }, { batch: 'B343', acc: 91.4 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="batch" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[86, 94]} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="acc" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-4">Feature Importance (Top 5)</p>
            <div className="space-y-3">
              {[
                { feature: 'weather_risk_score', importance: 0.31 },
                { feature: 'carrier_reliability', importance: 0.24 },
                { feature: 'route_distance_km', importance: 0.19 },
                { feature: 'customs_complexity', importance: 0.16 },
                { feature: 'port_congestion_idx', importance: 0.10 },
              ].map(({ feature, importance }) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-slate-600 w-44 flex-shrink-0">{feature}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${importance * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8">{(importance * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
