import { Ship, Plane, Truck, Package } from 'lucide-react'

const MODE_MAP: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  ocean: { icon: <Ship size={14} />, color: 'text-sky-500 bg-sky-50', label: 'Ocean' },
  air: { icon: <Plane size={14} />, color: 'text-indigo-500 bg-indigo-50', label: 'Air' },
  road: { icon: <Truck size={14} />, color: 'text-amber-500 bg-amber-50', label: 'Road' },
  multimodal: { icon: <Package size={14} />, color: 'text-violet-500 bg-violet-50', label: 'Multi' },
}

export default function ModeIcon({ mode }: { mode: string }) {
  const m = MODE_MAP[mode] ?? MODE_MAP['road']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${m.color}`}>
      {m.icon} {m.label}
    </span>
  )
}
