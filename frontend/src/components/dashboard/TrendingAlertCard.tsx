import { TRENDING_INSIGHTS } from '../../data/dashboardData'
import { Zap, ChevronRight } from 'lucide-react'

export default function TrendingAlertCard() {
    const { isLive, title, description } = TRENDING_INSIGHTS

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
                {/* Image */}
                <div className="hidden sm:block w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 flex-shrink-0 flex items-center justify-center">
                    <div className="text-3xl">🌊</div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                            {isLive && (
                                <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    <span className="text-xs font-semibold">LIVE</span>
                                </div>
                            )}
                        </div>
                        <ChevronRight size={18} className="text-slate-400" />
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base leading-snug">
                        {title}
                    </h3>

                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        {description}
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}
