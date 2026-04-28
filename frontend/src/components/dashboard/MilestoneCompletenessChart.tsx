import { MILESTONE_COMPLETENESS } from '../../data/dashboardData'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap } from 'lucide-react'

export default function MilestoneCompletenessChart() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Milestone completeness</h3>
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                    <Zap size={12} />
                    Enhanced with AI
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MILESTONE_COMPLETENESS} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                            }}
                            formatter={(value) => `${value}%`}
                        />
                        <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-4 inline-block">
                Learn more →
            </a>
        </div>
    )
}
