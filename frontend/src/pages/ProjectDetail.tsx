import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectApi } from '../api/client'
import RecordTable from '../components/RecordTable'
import ForecastTable from '../components/ForecastTable'
import { useAsync } from '../hooks/useAsync'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'records' | 'forecast'>('records')

  const { data: project, loading, error, refetch } = useAsync(
    () => projectApi.get(id!),
    [id]
  )

  if (loading && !project) {
    return (
      <div>
        <Skeleton.Line width="w-48" />
        <div className="mt-2"><Skeleton.Line width="w-72" /></div>
        <div className="mt-6"><Skeleton.Table rows={5} /></div>
      </div>
    )
  }

  if (error) {
    if (error.includes('404') || error.includes('not found')) {
      navigate('/projects')
      return null
    }
    return <ErrorState message={error} onRetry={refetch} />
  }

  if (!project) return null

  const tabs = [
    { key: 'records' as const, label: '流水记录' },
    { key: 'forecast' as const, label: '预测结果' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#333]">{project.name}</h2>
        {project.description && <p className="text-[#666] text-sm mt-1">{project.description}</p>}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              tab === t.key
                ? 'bg-[#667eea] text-white shadow-sm'
                : 'text-[#666] hover:bg-[#f5f7fa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'records' && <RecordTable projectId={id!} />}
      {tab === 'forecast' && <ForecastTable projectId={id!} />}
    </div>
  )
}
