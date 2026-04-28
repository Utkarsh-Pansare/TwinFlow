import { cn } from '../../lib/utils'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

const VARIANTS: Record<Variant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
}

const SEVERITY_MAP: Record<string, Variant> = {
  'Critical': 'danger', 'High': 'danger', 'Medium': 'warning',
  'Low': 'success', 'None': 'neutral',
  'on-track': 'success', 'in-transit': 'info', 'delayed': 'warning',
  'at-risk': 'danger', 'delivered': 'success',
  'running': 'purple', 'idle': 'neutral', 'completed': 'success',
  'normal': 'success', 'disrupted': 'danger',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  auto?: boolean
  className?: string
  dot?: boolean
}

export default function Badge({ children, variant, auto, className, dot }: BadgeProps) {
  const resolvedVariant = auto
    ? (SEVERITY_MAP[String(children)] ?? 'neutral')
    : (variant ?? 'neutral')

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      VARIANTS[resolvedVariant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full',
        resolvedVariant === 'success' && 'bg-emerald-500',
        resolvedVariant === 'danger' && 'bg-rose-500',
        resolvedVariant === 'warning' && 'bg-amber-500',
        resolvedVariant === 'info' && 'bg-sky-500',
        resolvedVariant === 'neutral' && 'bg-slate-400',
        resolvedVariant === 'purple' && 'bg-violet-500',
      )} />}
      {children}
    </span>
  )
}
