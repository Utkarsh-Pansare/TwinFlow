import { DATA_LATENCY_METRICS, LATENCY_REDUCTION_SUMMARY } from '../../data/dashboardData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CheckCircle } from 'lucide-react'

export default function DataLatencyCard() {
    const { dataLatencyReduction, additionalPercentage } = LATENCY_REDUCTION_SUMMARY

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Data latency reduction</h3>

            <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DATA_LATENCY_METRICS} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                            }}
                            formatter={(value) => `${value} hrs`}
                        />
                        <Legend />
                        <Bar dataKey="carrier" fill="#cbd5e1" radius={[8, 8, 0, 0]} name="Carrier" />
                        <Bar dataKey="aiEnhanced" fill="#2563eb" radius={[8, 8, 0, 0]} name="AI-Enhanced" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200">
                <div className="text-center">
                    <p className="text-xs text-slate-600 mb-2">Data latency reduction</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-green-600">{dataLatencyReduction}%</span>
                        <CheckCircle size={16} className="text-green-600" />
                    </div>
                </div>

                <div className="text-center border-l border-r border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">Additional</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">{additionalPercentage}%</span>
                        <CheckCircle size={16} className="text-blue-600" />
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-slate-600 mb-2">Vessel Arrival</p>
                    <p className="text-lg font-bold text-slate-900">60.4 hrs</p>
                </div>
            </div>
        </div>
    )
}
