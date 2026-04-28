import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  accent?: 'indigo' | 'sky' | 'emerald' | 'rose' | 'amber'
  className?: string
}

const ACCENTS = {
  indigo: 'text-indigo-500 bg-indigo-50',
  sky: 'text-sky-500 bg-sky-50',
  emerald: 'text-emerald-500 bg-emerald-50',
  rose: 'text-rose-500 bg-rose-50',
  amber: 'text-amber-500 bg-amber-50',
}

export default function StatCard({ label, value, change, changeType = 'up', icon, accent = 'indigo', className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-elevated transition-shadow', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', ACCENTS[accent])}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
      {change && (
        <p className={cn('flex items-center gap-1 text-xs font-medium mt-2',
          changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-rose-500' : 'text-slate-500'
        )}>
          {changeType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </p>
      )}
    </div>
  )
}
