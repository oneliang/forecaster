import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  icon: ReactNode
  color: 'indigo' | 'gray' | 'green' | 'red'
}

const COLOR_MAP = {
  indigo: { accent: 'border-l-[#667eea]' },
  gray:   { accent: 'border-l-[#999]' },
  green:  { accent: 'border-l-[#4caf50]' },
  red:    { accent: 'border-l-[#ef4444]' },
}

export default function StatCard({ title, value, icon, color }: Props) {
  const c = COLOR_MAP[color]
  return (
    <div className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] p-5 border-l-[3px] ${c.accent}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 overflow-hidden text-[#667eea]">{icon}</span>
        <span className="text-sm text-[#666] font-medium">{title}</span>
      </div>
      <p className="text-2xl font-bold text-[#333]">{value}</p>
    </div>
  )
}
