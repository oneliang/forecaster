import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  dismiss: (id: string) => void
  toasts: Toast[]
}

const ToastContext = createContext<ToastContextValue | null>(null)

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'DISMISS'; id: string }

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast]
    case 'DISMISS':
      return state.filter(t => t.id !== action.id)
    default:
      return state
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, [])

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'DISMISS', id })
  }, [])

  const add = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID()
    dispatch({ type: 'ADD', toast: { id, type, message } })
    const duration = type === 'error' ? 5000 : 3000
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const success = useCallback((msg: string) => add('success', msg), [add])
  const error = useCallback((msg: string) => add('error', msg), [add])
  const info = useCallback((msg: string) => add('info', msg), [add])
  const warning = useCallback((msg: string) => add('warning', msg), [add])

  return (
    <ToastContext.Provider value={{ success, error, info, warning, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
