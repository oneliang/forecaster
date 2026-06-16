import { useNavigate } from 'react-router-dom'
import { projectApi, recordApi, forecastApi } from '../api/client'
import StatCard from '../components/StatCard'
import { useAsync } from '../hooks/useAsync'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useAsync(async () => {
    const projects = await projectApi.list()
    const allRecords = await Promise.all(
      projects.map(p => recordApi.list(p.id))
    )
    const flatRecords = allRecords.flat()

    const totalProjects = projects.length
    const totalRecords = flatRecords.length
    const totalIncome = flatRecords
      .filter(r => r.direction === 0)
      .reduce((sum, r) => sum + parseFloat(r.amount), 0)
    const totalExpense = flatRecords
      .filter(r => r.direction === 1)
      .reduce((sum, r) => sum + parseFloat(r.amount), 0)

    // Get latest balance per project via forecast API
    const projectBalances = await Promise.all(
      projects.map(async p => {
        try {
          const forecast = await forecastApi.run(p.id)
          const last = forecast[forecast.length - 1]
          return { project: p, balance: last?.balance ?? '0', recordCount: allRecords[projects.indexOf(p)].length }
        } catch {
          return { project: p, balance: '0', recordCount: allRecords[projects.indexOf(p)].length }
        }
      })
    )

    return { totalProjects, totalRecords, totalIncome, totalExpense, projectBalances }
  }, [])

  const fmt = (v: number) =>
    v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading && !data) {
    return (
      <div>
        <div className="mb-6"><Skeleton.Line width="w-48" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-[#e8eaf6] p-5">
              <Skeleton.Line width="w-24" />
              <div className="mt-3"><Skeleton.Line width="w-32" /></div>
            </div>
          ))}
        </div>
        <Skeleton.Table rows={3} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  const { totalProjects, totalRecords, totalIncome, totalExpense, projectBalances } = data

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#333]">欢迎使用 Forecaster</h2>
        <p className="text-[#666] text-sm mt-1">资源预测管理仪表板</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="项目总数"
          value={String(totalProjects)}
          color="indigo"
          icon={
            <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
        />
        <StatCard
          title="流水总数"
          value={String(totalRecords)}
          color="gray"
          icon={
            <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <StatCard
          title="总收入"
          value={`¥${fmt(totalIncome)}`}
          color="green"
          icon={
            <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          title="总支出"
          value={`¥${fmt(totalExpense)}`}
          color="red"
          icon={
            <svg width="16" height="16" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
            </svg>
          }
        />
      </div>

      {/* Project Overview */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#333]">项目概览</h3>
      </div>

      {projectBalances.length === 0 ? (
        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#e8eaf6] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#667eea] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-[#555] font-medium mb-1">还没有项目</p>
          <p className="text-[#999] text-sm mb-4">创建第一个项目开始管理资源</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a6fd6]"
          >
            前往项目管理
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectBalances.map(({ project, balance, recordCount }) => {
            const balNum = parseFloat(balance)
            const balColor = isNaN(balNum) || balNum === 0 ? 'text-[#666]' : balNum > 0 ? 'text-[#4caf50]' : 'text-[#ef4444]'
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] p-5 hover:border-[#c5cae9] cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <h4 className="font-semibold text-[#333] group-hover:text-[#667eea] mb-2">{project.name}</h4>
                {project.description && <p className="text-[#666] text-sm mb-3 line-clamp-1">{project.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999]">{recordCount} 条记录</span>
                  <span className={`font-mono font-semibold ${balColor}`}>
                    ¥{fmt(balNum)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
