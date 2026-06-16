import { useState, useMemo } from 'react'
import type { ForecastOutput } from '../api/client'

interface Props {
  data: ForecastOutput[]
}

const PADDING = { top: 24, right: 20, bottom: 36, left: 60 }
const VIEW_W = 800
const VIEW_H = 280

export default function BalanceChart({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const chart = useMemo(() => {
    if (data.length < 2) return null

    const chartW = VIEW_W - PADDING.left - PADDING.right
    const chartH = VIEW_H - PADDING.top - PADDING.bottom

    const balances = data.map(d => parseFloat(d.balance))
    const minVal = Math.min(...balances, 0)
    const maxVal = Math.max(...balances, 0)
    const range = maxVal - minVal || 1

    const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * chartW
    const yScale = (v: number) => PADDING.top + ((maxVal - v) / range) * chartH
    const zeroY = yScale(0)

    // Build points
    const points = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(parseFloat(d.balance)),
      balance: parseFloat(d.balance),
      date: d.time?.slice(0, 10) ?? '',
    }))

    // Polyline path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

    // Area path (close to zero line)
    const areaPath = `${linePath} L${points[points.length - 1].x},${zeroY} L${points[0].x},${zeroY} Z`

    // Y-axis grid lines (4-5 lines)
    const gridCount = 4
    const gridLines = Array.from({ length: gridCount + 1 }).map((_, i) => {
      const val = minVal + (range / gridCount) * i
      return { y: yScale(val), label: formatCompact(val) }
    })

    // X-axis labels (evenly pick ~6)
    const labelCount = Math.min(6, data.length)
    const xLabels = Array.from({ length: labelCount }).map((_, i) => {
      const idx = Math.round((i / (labelCount - 1)) * (data.length - 1))
      return { x: xScale(idx), label: data[idx].time?.slice(5, 10) ?? '' }
    })

    return { points, linePath, areaPath, gridLines, xLabels, zeroY, chartW, chartH }
  }, [data])

  if (!chart || data.length < 2) return null

  const fmt = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) ? v : n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = VIEW_W / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX
    const chartW = VIEW_W - PADDING.left - PADDING.right

    // Find closest point
    const ratio = (mouseX - PADDING.left) / chartW
    const idx = Math.round(ratio * (data.length - 1))
    const clampedIdx = Math.max(0, Math.min(data.length - 1, idx))
    setHoverIdx(clampedIdx)
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div className="relative bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] p-4">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid lines */}
        {chart.gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={VIEW_W - PADDING.right}
              y2={g.y}
              stroke="#e8eaf6"
              strokeDasharray={parseFloat(g.label) === 0 ? '0' : '4'}
              strokeWidth={parseFloat(g.label) === 0 ? 1.5 : 0.5}
            />
            <text
              x={PADDING.left - 8}
              y={g.y + 4}
              textAnchor="end"
              className="fill-[#999]"
              fontSize="11"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path
          d={chart.areaPath}
          fill="url(#areaGradient)"
          opacity={0.15}
        />

        {/* Line */}
        <path
          d={chart.linePath}
          fill="none"
          stroke="#667eea"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chart.points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 5 : 2.5}
            fill={p.balance >= 0 ? '#4caf50' : '#ef4444'}
            stroke="white"
            strokeWidth={hoverIdx === i ? 2 : 0}
            className="transition-none"
            style={{ transition: 'r 100ms' }}
          />
        ))}

        {/* Hover vertical line */}
        {hoverIdx !== null && chart.points[hoverIdx] && (
          <line
            x1={chart.points[hoverIdx].x}
            y1={PADDING.top}
            x2={chart.points[hoverIdx].x}
            y2={VIEW_H - PADDING.bottom}
            stroke="#667eea"
            strokeWidth={1}
            strokeDasharray="4"
            opacity={0.5}
          />
        )}

        {/* X-axis labels */}
        {chart.xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={VIEW_H - 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize="11"
          >
            {l.label}
          </text>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && chart.points[hoverIdx] && (
        <div
          className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 40,
            transform: mousePos.x > 400 ? 'translateX(-110%)' : undefined,
          }}
        >
          <p className="text-gray-300 mb-0.5">{chart.points[hoverIdx].date}</p>
          <p className="font-mono font-semibold">
            ¥{fmt(String(chart.points[hoverIdx].balance))}
          </p>
        </div>
      )}
    </div>
  )
}

function formatCompact(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 10000) return `${(v / 10000).toFixed(1)}万`
  if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`
  return v.toFixed(0)
}
