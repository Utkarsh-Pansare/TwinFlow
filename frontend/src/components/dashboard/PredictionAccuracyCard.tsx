import { PREDICTION_ACCURACY } from '../../data/dashboardData'
import { CheckCircle, TrendingUp } from 'lucide-react'

export default function PredictionAccuracyCard() {
    const { p44OverCarrier, actualArrival, measurableImpact } = PREDICTION_ACCURACY

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Prediction accuracy</h3>

            <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-600 mb-2">p44 over carrier ETA</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-green-600">{p44OverCarrier}%</span>
                            <CheckCircle size={16} className="text-green-600 mb-1" />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-slate-600 mb-2">Actual arrival</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-green-600">{actualArrival}%</span>
                            <CheckCircle size={16} className="text-green-600 mb-1" />
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200" />

                {/* Measurable Impact */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Measurable impact</p>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-600" />
                            <span className="text-sm text-slate-700">Advance notice</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">+{measurableImpact.advanceNotice} days</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-600" />
                            <span className="text-sm text-slate-700">More accurate discharge</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">+{measurableImpact.accurateDischarge}%</span>
                    </div>
                </div>
            </div>

            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-6 inline-block">
                Learn more →
            </a>
        </div>
    )
}
