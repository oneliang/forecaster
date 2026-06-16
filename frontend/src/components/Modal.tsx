import { type ReactNode } from 'react'
import { useModal } from '../hooks/useModal'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  const { visible, animState, modalRef, handleBackdropClick } = useModal(open, onClose)

  if (!visible) return null

  const animating = animState === 'in'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-none ${
        animating ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
      style={{
        transition: 'background-color 200ms ease',
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 w-full ${maxWidth} mx-4 ${
          animating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={e => e.stopPropagation()}
        style={{
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#333]">{title}</h3>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] p-1 rounded-lg hover:bg-[#f5f7fa]">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = '确认', danger = false }: ConfirmModalProps) {
  const { visible, animState, modalRef, handleBackdropClick } = useModal(open, onClose)

  if (!visible) return null

  const animating = animState === 'in'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-none ${
        animating ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
      style={{ transition: 'background-color 200ms ease' }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 w-full max-w-sm mx-4 ${
          animating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={e => e.stopPropagation()}
        style={{ transition: 'opacity 200ms ease, transform 200ms ease' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? 'bg-[#fee2e2]' : 'bg-[#e8eaf6]'
          }`}>
            {danger ? (
              <svg className="w-5 h-5 text-[#ef4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#667eea] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#333]">{title}</h3>
            <p className="text-sm text-[#666] mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#c5cae9] rounded-lg text-sm font-medium text-[#555] hover:bg-[#f5f7fa]"
          >
            取消
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              danger ? 'bg-error hover:bg-[#c62828]' : 'bg-primary hover:bg-[#5a6fd6]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
