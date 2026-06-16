import { type Record as RecordType } from '../api/client'

const DIRECTION_LABELS = ['收', '付']
const TYPE_LABELS = ['计划应该', '实际应该', '实际']

const TYPE_BADGE: { [key: number]: string } = {
  0: 'bg-[#e8eaf6] text-[#3f51b5]',
  1: 'bg-[#f3e5f5] text-[#764ba2]',
  2: 'bg-gray-100 text-gray-700',
}

interface Props {
  date: string
  records: RecordType[]
  balance: string
}

export default function DailyRecordsPanel({ date, records, balance }: Props) {
  const fmt = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) ? v : n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const balanceNum = parseFloat(balance)
  const balanceColor = isNaN(balanceNum) ? '' : balanceNum >= 0 ? 'text-[#4caf50]' : 'text-[#ef4444]'

  // Filter records relevant to this date:
  // - time = date → affects plan/actual-should accumulation
  // - amount_time = date → affects actual receive/pay
  const dayRecords = records.filter(r => {
    const t = r.time?.slice(0, 10)
    const at = r.amount_time?.slice(0, 10)
    return t === date || at === date
  })

  return (
    <div className="w-80 shrink-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] flex flex-col max-h-[600px]">
      <div className="px-4 py-3 border-b border-[#e8eaf6] shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[#333] text-sm">{date}</h3>
          <span className={`text-sm font-mono font-semibold ${balanceColor}`}>
            {fmt(balance)}
          </span>
        </div>
        <p className="text-xs text-[#999] mt-0.5">当日流水</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {dayRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#999] text-sm">当日无相关记录</p>
            <p className="text-[#c5cae9] text-xs mt-1">该日期没有录入或发生的流水</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e8eaf6]">
            {dayRecords.map(r => (
              <div key={r.id} className="px-4 py-3 hover:bg-[#f5f7fa]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_BADGE[r.type]}`}>
                      {TYPE_LABELS[r.type]}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      r.direction === 0 ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fee2e2] text-[#c62828]'
                    }`}>
                      {DIRECTION_LABELS[r.direction]}
                    </span>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${
                    r.direction === 0 ? 'text-[#4caf50]' : 'text-[#ef4444]'
                  }`}>
                    {r.direction === 0 ? '+' : '-'}{fmt(r.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#999]">
                  <span>录入 {r.time?.slice(0, 10)}</span>
                  <span>发生 {r.amount_time?.slice(0, 10)}</span>
                </div>
                {r.key && <p className="text-xs text-[#666] mt-1">{r.key}</p>}
                {r.note && <p className="text-xs text-[#999] mt-0.5 truncate">{r.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
