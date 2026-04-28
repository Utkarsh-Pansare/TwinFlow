import { KPI_CARDS } from '../../data/dashboardData'
import { Waves, Truck } from 'lucide-react'

export default function KPICardsRow() {
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Waves':
                return <Waves size={20} className="text-slate-400" />
            case 'Truck':
                return <Truck size={20} className="text-slate-400" />
            default:
                return null
        }
    }

    const getBorderColor = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'border-blue-200',
            amber: 'border-amber-200',
            orange: 'border-orange-200',
            red: 'border-red-200',
            green: 'border-green-200',
        }
        return colors[color] || 'border-slate-200'
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {KPI_CARDS.map((card) => (
                <div
                    key={card.id}
                    className={`bg-white rounded-xl border ${getBorderColor(
                        card.color
                    )} p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">{card.title}</p>
                            <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
                        </div>
                        {getIcon(card.icon)}
                    </div>
                    <p className="text-xs text-slate-500">shipments</p>
                </div>
            ))}
        </div>
    )
}
