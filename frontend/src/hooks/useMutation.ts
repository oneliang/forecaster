import { useState, useCallback } from 'react'
import { useToast } from '../context/ToastContext'

interface UseMutationResult<TVars, TResult> {
  mutate: (vars: TVars) => Promise<TResult | null>
  loading: boolean
}

export function useMutation<TVars, TResult = void>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  options?: { successMessage?: string; errorMessage?: string }
): UseMutationResult<TVars, TResult> {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const mutate = useCallback(async (vars: TVars): Promise<TResult | null> => {
    setLoading(true)
    try {
      const result = await mutationFn(vars)
      if (options?.successMessage) toast.success(options.successMessage)
      return result
    } catch (err: unknown) {
      const defaultMsg = err instanceof Error ? err.message : '操作失败'
      const msg = options?.errorMessage || defaultMsg
      toast.error(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [mutationFn, toast, options?.successMessage, options?.errorMessage])

  return { mutate, loading }
}
