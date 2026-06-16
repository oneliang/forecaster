import { useEffect, useRef, useState, useCallback } from 'react'

export function useModal(open: boolean, onClose: () => void) {
  const [visible, setVisible] = useState(false)
  const [animState, setAnimState] = useState<'in' | 'out'>('out')
  const modalRef = useRef<HTMLDivElement>(null)

  // Animate in/out
  useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimState('in'))
      })
    } else if (visible) {
      setAnimState('out')
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape to close
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  // Body scroll lock
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [visible])

  // Focus trap
  useEffect(() => {
    if (!visible) return
    const modal = modalRef.current
    if (!modal) return

    const getFocusable = () =>
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

    // Focus first element
    requestAnimationFrame(() => {
      const focusable = getFocusable()
      focusable[0]?.focus()
    })

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [visible])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  return { visible, animState, modalRef, handleBackdropClick }
}
