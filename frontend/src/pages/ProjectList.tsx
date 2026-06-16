import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi, type Project } from '../api/client'
import Modal from '../components/Modal'
import { ConfirmModal } from '../components/Modal'
import { useAsync } from '../hooks/useAsync'
import { useMutation } from '../hooks/useMutation'
import Skeleton from '../components/Skeleton'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'

export default function ProjectList() {
  const { data: projects, loading, error, refetch } = useAsync(
    () => projectApi.list(),
    []
  )
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const navigate = useNavigate()

  const createMutation = useMutation(
    (data: { name: string; description: string }) => projectApi.create(data),
    { successMessage: '项目创建成功' }
  )

  const deleteMutation = useMutation(
    (id: string) => projectApi.delete(id),
    { successMessage: '项目已删除' }
  )

  const handleCreate = async () => {
    if (!name.trim()) return
    const result = await createMutation.mutate({ name: name.trim(), description: description.trim() })
    if (result) {
      setName('')
      setDescription('')
      setShowCreate(false)
      refetch()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteMutation.mutate(deleteTarget.id)
    if (result !== null) {
      setDeleteTarget(null)
      refetch()
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')

  if (loading && !projects) {
    return (
      <div>
        <div className="flex justify-end items-center mb-6">
          <div className="bg-[#e8eaf6] rounded-lg h-10 w-28 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton.Card key={i} />)}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-[#5a6fd6] text-sm font-medium active:scale-[0.98]"
        >
          + 新建项目
        </button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-[#666] block mb-1">项目名称</label>
            <input
              className="w-full border border-[#c5cae9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="输入项目名称"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-[#666] block mb-1">描述</label>
            <input
              className="w-full border border-[#c5cae9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="可选"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-[#c5cae9] rounded-lg text-sm font-medium text-[#555] hover:bg-[#f5f7fa]">取消</button>
            <button
              onClick={handleCreate}
              disabled={createMutation.loading || !name.trim()}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a6fd6] disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {createMutation.loading && <Spinner size="sm" />}
              {createMutation.loading ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除项目"
        message={`确定删除「${deleteTarget?.name}」及其所有流水记录？此操作不可撤销。`}
        confirmText="删除"
        danger
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map(p => (
          <div
            key={p.id}
            className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-[#e8eaf6] p-5 hover:border-[#c5cae9] cursor-pointer group"
            onClick={() => navigate(`/projects/${p.id}`)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-[#333] group-hover:text-[#667eea]">{p.name}</h3>
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
                className="text-[#c5cae9] hover:text-[#ef4444] text-sm opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-[#f5f7fa]"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {p.description && <p className="text-[#666] text-sm mt-1 line-clamp-2">{p.description}</p>}
            <p className="text-xs text-[#999] mt-3">{formatDate(p.created_at)}</p>
          </div>
        ))}
        {(projects ?? []).length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#e8eaf6] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#667eea] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-[#555] font-medium mb-1">暂无项目</p>
            <p className="text-[#999] text-sm">点击「新建项目」开始使用</p>
          </div>
        )}
      </div>
    </div>
  )
}
