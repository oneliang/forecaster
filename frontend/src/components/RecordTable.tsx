import { useState } from 'react'
import { recordApi, type Record as RecordType } from '../api/client'
import RecordForm from './RecordForm'
import { ConfirmModal } from './Modal'
import { useAsync } from '../hooks/useAsync'
import { useMutation } from '../hooks/useMutation'
import Skeleton from './Skeleton'
import ErrorState from './ErrorState'

const DIRECTION_LABELS = ['收', '付']
const TYPE_LABELS = ['计划应该', '实际应该', '实际']

const TYPE_BADGE: { [key: number]: string } = {
  0: 'bg-[#e8eaf6] text-[#3f51b5]',
  1: 'bg-[#f3e5f5] text-[#764ba2]',
  2: 'bg-gray-100 text-gray-700',
}

interface Props {
  projectId: string
}

export default function RecordTable({ projectId }: Props) {
  const { data: records, loading, error, refetch } = useAsync(
    () => recordApi.list(projectId),
    [projectId]
  )
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ type: string; direction: string }>({ type: '', direction: '' })

  const deleteMutation = useMutation(
    (id: string) => recordApi.delete(projectId, id),
    { successMessage: '记录已删除' }
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutate(deleteTarget)
    if (result !== null) {
      setDeleteTarget(null)
      refetch()
    }
  }

  const filtered = (records ?? []).filter(r => {
    if (filter.type !== '' && r.type !== Number(filter.type)) return false
    if (filter.direction !== '' && r.direction !== Number(filter.direction)) return false
    return true
  })

  const fmt = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) ? v : n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading && !records) return <Skeleton.Table rows={6} />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
            className="border border-[#c5cae9] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部类型</option>
            {TYPE_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
          </select>
          <select
            value={filter.direction}
            onChange={e => setFilter(f => ({ ...f, direction: e.target.value }))}
            className="border border-[#c5cae9] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">全部方向</option>
            {DIRECTION_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditingRecord(null); setShowForm(!showForm) }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a6fd6] active:scale-[0.98]"
        >
          {showForm ? '收起' : '+ 新增记录'}
        </button>
      </div>

      {showForm && (
        <RecordForm
          projectId={projectId}
          editRecord={editingRecord}
          onSave={() => { setShowForm(false); setEditingRecord(null); refetch() }}
          onCancel={() => { setShowForm(false); setEditingRecord(null) }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除记录"
        message="确定删除这条流水记录？"
        confirmText="删除"
        danger
      />

      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#eef2ff]/60 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">录入日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">发生日期</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">方向</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#666] uppercase tracking-wider">金额</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#666] uppercase tracking-wider">备注</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaf6]">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-[#f5f7fa] group">
                  <td className="px-4 py-3 text-[#333] whitespace-nowrap">{r.time?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-[#333] whitespace-nowrap">{r.amount_time?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[r.type]}`}>
                      {TYPE_LABELS[r.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.direction === 0 ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fee2e2] text-[#c62828]'
                    }`}>
                      {DIRECTION_LABELS[r.direction]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#333]">{fmt(r.amount)}</td>
                  <td className="px-4 py-3 text-[#666]">{r.key || '-'}</td>
                  <td className="px-4 py-3 text-[#666] max-w-[200px] truncate">{r.note || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => { setEditingRecord(r); setShowForm(true) }}
                        className="text-[#999] hover:text-[#667eea] p-1 rounded-lg hover:bg-[#f5f7fa]"
                        title="编辑"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r.id)}
                        className="text-[#999] hover:text-[#ef4444] p-1 rounded-lg hover:bg-[#f5f7fa]"
                        title="删除"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-3 bg-[#e8eaf6] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#667eea] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-[#555] font-medium">暂无流水记录</p>
            <p className="text-[#999] text-sm mt-1">点击「新增记录」添加第一笔</p>
          </div>
        )}
      </div>
    </div>
  )
}
