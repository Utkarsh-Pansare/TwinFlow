import { Package } from 'lucide-react'

interface Props { title: string; desc: string; action?: React.ReactNode; icon?: React.ReactNode }

export default function EmptyState({ title, desc, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        {icon ?? <Package size={24} />}
      </div>
      <p className="text-slate-900 font-semibold mb-1">{title}</p>
      <p className="text-slate-400 text-sm max-w-xs">{desc}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
