import { DEMURRAGE_CHARGES } from '../../data/dashboardData'

export default function DemurrageChargesCard() {
    const { containers, cost, breakdown } = DEMURRAGE_CHARGES

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Demurrage charges</h3>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <p className="text-xs text-slate-600 mb-1">Containers</p>
                    <p className="text-3xl font-bold text-slate-900">{containers.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-600 mb-1">Current total cost</p>
                    <p className="text-3xl font-bold text-slate-900">${(cost / 1000).toFixed(0)}K</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
                {breakdown.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-700 font-medium">{item.period}</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {item.containers} · ${(item.cost / 1000).toFixed(0)}K
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${idx === 0
                                        ? 'bg-green-400'
                                        : idx === 1
                                            ? 'bg-blue-400'
                                            : idx === 2
                                                ? 'bg-yellow-400'
                                                : 'bg-orange-400'
                                    }`}
                                style={{ width: `${item.percentage * 10}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-6 inline-block">
                Learn more →
            </a>
        </div>
    )
}
