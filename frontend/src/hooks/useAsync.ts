import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../context/ToastContext'

interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = [],
  options?: { showToast?: boolean }
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const mountedRef = useRef(true)
  const showToast = options?.showToast ?? true

  const execute = useCallback(() => {
    setLoading(true)
    setError(null)
    asyncFn()
      .then(result => {
        if (!mountedRef.current) return
        setData(result)
      })
      .catch(err => {
        if (!mountedRef.current) return
        const msg = err?.response?.data?.error || err?.message || '请求失败'
        setError(msg)
        if (showToast) toast.error(msg)
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true
    execute()
    return () => { mountedRef.current = false }
  }, [execute])

  return { data, loading, error, refetch: execute }
}
