function PulseBlock({ className }: { className: string }) {
  return <div className={`bg-[#e8eaf6] rounded animate-pulse ${className}`} />
}

function Line({ width = 'w-full' }: { width?: string }) {
  return <PulseBlock className={`h-4 ${width}`} />
}

function Card() {
  return (
    <div className="bg-white rounded-xl border border-[#e8eaf6] p-5">
      <div className="flex justify-between items-start mb-3">
        <PulseBlock className="h-5 w-32" />
        <PulseBlock className="h-4 w-4" />
      </div>
      <PulseBlock className="h-4 w-48 mb-2" />
      <PulseBlock className="h-3 w-24" />
    </div>
  )
}

function Table({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8eaf6] overflow-hidden">
      <div className="bg-[#eef2ff]/60 px-4 py-3 flex gap-8 border-b border-[#e8eaf6]">
        <PulseBlock className="h-3 w-16" />
        <PulseBlock className="h-3 w-16" />
        <PulseBlock className="h-3 w-12" />
        <PulseBlock className="h-3 w-12" />
        <PulseBlock className="h-3 w-20" />
        <PulseBlock className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex gap-8 border-b border-[#e8eaf6] last:border-0">
          <PulseBlock className="h-4 w-20" />
          <PulseBlock className="h-4 w-20" />
          <PulseBlock className="h-4 w-12" />
          <PulseBlock className="h-4 w-12" />
          <PulseBlock className="h-4 w-24" />
          <PulseBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export const Skeleton = { Line, Card, Table }
export default Skeleton
