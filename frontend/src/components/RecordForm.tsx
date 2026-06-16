import { useState, useEffect } from 'react'
import { recordApi, type Record as RecordType } from '../api/client'
import Spinner from './Spinner'
import { useToast } from '../context/ToastContext'

const DIRECTION_OPTIONS = [
  { value: 0, label: '收', color: 'bg-[#e8f5e9] text-[#2e7d32]' },
  { value: 1, label: '付', color: 'bg-[#fee2e2] text-[#c62828]' },
]

const TODAY = new Date().toISOString().slice(0, 10)

const TYPE_OPTIONS = [
  { value: 0, label: '计划应该', color: 'bg-[#e8eaf6] text-[#3f51b5]' },
  { value: 1, label: '实际应该', color: 'bg-[#f3e5f5] text-[#764ba2]' },
  { value: 2, label: '实际', color: 'bg-gray-100 text-gray-700' },
]

interface Props {
  projectId: string
  editRecord?: RecordType | null
  onSave: () => void
  onCancel: () => void
}

export default function RecordForm({ projectId, editRecord, onSave, onCancel }: Props) {
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState(0)
  const [type, setType] = useState(0)
  const [time, setTime] = useState(TODAY)
  const [amountTime, setAmountTime] = useState(TODAY)
  const [key, setKey] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editRecord) {
      setAmount(editRecord.amount)
      setDirection(editRecord.direction)
      setType(editRecord.type)
      setTime(editRecord.time?.slice(0, 10) ?? '')
      setAmountTime(editRecord.amount_time?.slice(0, 10) ?? '')
      setKey(editRecord.key ?? '')
      setNote(editRecord.note ?? '')
    } else {
      setAmount('')
      setDirection(0)
      setType(0)
      setTime(TODAY)
      setAmountTime(TODAY)
      setKey('')
      setNote('')
    }
    setError('')
  }, [editRecord])

  const isEditing = !!editRecord

  const handleSubmit = async () => {
    if (!amount || !time || !amountTime) {
      setError('请填写金额、录入日期和发生日期')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload = { amount, direction, type, time, amount_time: amountTime, key, note }
      if (isEditing) {
        await recordApi.update(projectId, editRecord.id, payload)
        toast.success('记录已更新')
      } else {
        await recordApi.create(projectId, payload)
        toast.success('记录创建成功')
      }
      onSave()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-[#c5cae9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#667eea]"

  return (
    <div className="bg-[#f5f7fa] rounded-xl border border-[#e8eaf6] p-4 mb-4">
      <h3 className="font-medium text-[#333] mb-3">{isEditing ? '编辑记录' : '新增记录'}</h3>

      {error && (
        <div className="bg-[#fee2e2] text-[#ef4444] text-sm px-3 py-2 rounded-lg mb-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="text-xs text-[#999] block mb-1">金额</label>
          <input
            className={inputClass}
            type="number"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">方向</label>
          <div className="flex gap-1">
            {DIRECTION_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setDirection(o.value)}
                className={`flex-1 text-xs px-2 py-2 rounded-full font-medium border ${
                  direction === o.value
                    ? o.color + ' border-current'
                    : 'bg-white text-[#999] border-[#e8eaf6] hover:border-[#c5cae9]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">类型</label>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setType(o.value)}
                className={`flex-1 text-xs px-2 py-2 rounded-full font-medium border ${
                  type === o.value
                    ? o.color + ' border-current'
                    : 'bg-white text-[#999] border-[#e8eaf6] hover:border-[#c5cae9]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">分类</label>
          <input
            className={inputClass}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="可选"
          />
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">录入日期</label>
          <input
            className={inputClass}
            type="date"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[#999] block mb-1">发生日期</label>
          <input
            className={inputClass}
            type="date"
            value={amountTime}
            onChange={e => setAmountTime(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-[#999] block mb-1">备注</label>
          <input
            className={inputClass}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="可选"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5a6fd6] disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {saving && <Spinner size="sm" />}
          {saving ? '保存中...' : (isEditing ? '更新' : '保存')}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-[#c5cae9] rounded-lg text-sm text-[#555] hover:bg-[#f5f7fa]"
        >
          取消
        </button>
      </div>
    </div>
  )
}
