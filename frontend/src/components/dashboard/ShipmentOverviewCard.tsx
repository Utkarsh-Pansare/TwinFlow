import { SHIPMENT_STATUS_BREAKDOWN } from '../../data/dashboardData'
import { CheckCircle, AlertCircle, HelpCircle, Clock } from 'lucide-react'

export default function ShipmentOverviewCard() {
    const { early, onTime, unknown, late, total } = SHIPMENT_STATUS_BREAKDOWN
    const total_calc = early + onTime + unknown + late

    const earlyPct = (early / total_calc) * 100
    const onTimePct = (onTime / total_calc) * 100
    const unknownPct = (unknown / total_calc) * 100
    const latePct = (late / total_calc) * 100

    return (
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Welcome, Amalia</h2>

            <div className="mb-6">
                <div className="text-4xl font-bold mb-1">{total.toLocaleString()}</div>
                <p className="text-slate-400 text-sm">active shipments</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
                    <div
                        className="bg-pink-400"
                        style={{ width: `${earlyPct}%` }}
                    />
                    <div
                        className="bg-blue-400"
                        style={{ width: `${onTimePct}%` }}
                    />
                    <div
                        className="bg-orange-400"
                        style={{ width: `${unknownPct}%` }}
                    />
                    <div
                        className="bg-purple-400"
                        style={{ width: `${latePct}%` }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <div>
                        <p className="text-xs text-slate-400">Early</p>
                        <p className="text-sm font-semibold">{early.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <div>
                        <p className="text-xs text-slate-400">On time</p>
                        <p className="text-sm font-semibold">{onTime.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-400" />
                    <div>
                        <p className="text-xs text-slate-400">Unknown</p>
                        <p className="text-sm font-semibold">{unknown.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-400" />
                    <div>
                        <p className="text-xs text-slate-400">Late</p>
                        <p className="text-sm font-semibold">{late.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
