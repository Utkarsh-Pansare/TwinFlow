import { cn } from '../../lib/utils'
interface Props { score: number; showLabel?: boolean }
export default function ResilienceBar({ score, showLabel = true }: Props) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      {showLabel && <span className={cn('text-xs font-semibold w-8', textColor)}>{score}</span>}
    </div>
  )
}
