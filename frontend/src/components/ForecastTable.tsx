import { useState, useEffect } from 'react'
import { forecastApi, recordApi, type ForecastOutput, type Record as RecordType } from '../api/client'
import DailyRecordsPanel from './DailyRecordsPanel'
import BalanceChart from './BalanceChart'
import Spinner from './Spinner'
import Skeleton from './Skeleton'
import ErrorState from './ErrorState'

interface Props {
  projectId: string
}

export default function ForecastTable({ projectId }: Props) {
  const [outputs, setOutputs] = useState<ForecastOutput[]>([])
  const [records, setRecords] = useState<RecordType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showChart, setShowChart] = useState(true)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const [forecastData, recordData] = await Promise.all([
        forecastApi.run(projectId),
        recordApi.list(projectId),
      ])
      setOutputs(forecastData)
      setRecords(recordData)
      if (forecastData.length > 0 && selectedIndex == null) {
        setSelectedIndex(0)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '预测计算失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { run() }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n)) return v
    return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const balanceBg = (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n) || n === 0) return ''
    return n > 0 ? 'bg-[#e8f5e9]' : 'bg-[#fee2e2]'
  }

  const balanceColor = (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n) || n === 0) return 'text-[#666]'
    return n > 0 ? 'text-[#4caf50]' : 'text-[#ef4444]'
  }

  const selected = selectedIndex != null ? outputs[selectedIndex] : null

  if (loading && outputs.length === 0) return <Skeleton.Table rows={8} />
  if (error) return <ErrorState message={error} onRetry={run} />

  return (
    <div className="flex gap-4">
      {/* Left: Forecast Table */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-[#666]">
            {outputs.length > 0 ? `${outputs.length} 天` : '暂无预测数据'}
          </p>
          <button
            onClick={run}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a6fd6] disabled:opacity-50 inline-flex items-center gap-1.5 active:scale-[0.98]"
          >
            {loading && <Spinner size="sm" />}
            {loading ? '计算中...' : '刷新预测'}
          </button>
        </div>

        {outputs.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-sm text-[#666] hover:text-[#333] mb-2 flex items-center gap-1.5 font-medium"
            >
              <svg className={`w-4 h-4 shrink-0 transition-transform ${showChart ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              余额趋势图
            </button>
            {showChart && <BalanceChart data={outputs} />}
          </div>
        )}

        {outputs.length > 0 ? (
          <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#eef2ff]/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-[#666] sticky left-0 bg-[#eef2ff]/60 z-20">日期</th>
                    <th colSpan={3} className="px-2 py-1.5 text-center border-l border-[#e8eaf6] font-medium text-[#667eea]">计划应该</th>
                    <th colSpan={3} className="px-2 py-1.5 text-center border-l border-[#e8eaf6] font-medium text-[#764ba2]">实际应该</th>
                    <th colSpan={3} className="px-2 py-1.5 text-center border-l border-[#e8eaf6] font-medium text-[#666]">实际</th>
                    <th className="px-3 py-2 text-right border-l border-[#e8eaf6] font-medium text-[#333]">余额</th>
                  </tr>
                  <tr className="text-[#999]">
                    <th className="px-3 py-1 text-left sticky left-0 bg-[#eef2ff]/60 z-20"></th>
                    <th className="px-2 py-1 text-right font-normal">收</th>
                    <th className="px-2 py-1 text-right font-normal">付</th>
                    <th className="px-2 py-1 text-right font-normal border-r border-[#e8eaf6]">差</th>
                    <th className="px-2 py-1 text-right font-normal">收</th>
                    <th className="px-2 py-1 text-right font-normal">付</th>
                    <th className="px-2 py-1 text-right font-normal border-r border-[#e8eaf6]">差</th>
                    <th className="px-2 py-1 text-right font-normal">收</th>
                    <th className="px-2 py-1 text-right font-normal">付</th>
                    <th className="px-2 py-1 text-right font-normal border-r border-[#e8eaf6]">差</th>
                    <th className="px-3 py-1 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eaf6]">
                  {outputs.map((o, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`cursor-pointer ${
                        selectedIndex === i
                          ? 'bg-[#eef2ff] border-l-[3px] border-l-[#667eea]'
                          : 'hover:bg-[#f5f7fa]'
                      } ${balanceBg(o.balance)}`}
                    >
                      <td className={`px-3 py-2 whitespace-nowrap font-medium ${
                        selectedIndex === i ? 'text-[#667eea]' : 'text-[#333]'
                      }`}>
                        {o.time?.slice(0, 10)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.plan_should_receive)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.plan_should_pay)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666] border-r border-[#e8eaf6]">{fmt(o.plan_should_different)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.actual_should_receive)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.actual_should_pay)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666] border-r border-[#e8eaf6]">{fmt(o.actual_should_different)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.actual_receive)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666]">{fmt(o.actual_pay)}</td>
                      <td className="px-2 py-2 text-right font-mono text-[#666] border-r border-[#e8eaf6]">{fmt(o.actual_different)}</td>
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${balanceColor(o.balance)}`}>
                        {fmt(o.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#e8eaf6] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#667eea] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-[#555] font-medium">暂无预测数据</p>
            <p className="text-[#999] text-sm mt-1">添加流水记录后可查看预测结果</p>
          </div>
        )}
      </div>

      {/* Right: Daily Records Panel */}
      {selected && (
        <DailyRecordsPanel
          date={selected.time?.slice(0, 10)}
          records={records}
          balance={selected.balance}
        />
      )}
    </div>
  )
}
