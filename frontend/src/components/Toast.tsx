import React, { useEffect, useState, createContext, useContext, useCallback } from 'react'
import '../styles/scheduler.css'

export type ToastType = 'success' | 'danger' | 'warning' | 'info'

interface ToastMessage {
  id: number
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const Icons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  danger: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

// Individual Toast Item
interface ToastItemProps {
  toast: ToastMessage
  onRemove: (id: number) => void
  duration: number
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, duration }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation after mount
    const showTimer = setTimeout(() => setIsVisible(true), 20)

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [duration])

  const handleClose = () => {
    if (isLeaving) return
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  return (
    <div className={`ms-toast ms-toast-${toast.type} ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}>
      <div className="ms-toast-icon">
        {Icons[toast.type]}
      </div>
      <div className="ms-toast-content">
        <p className="ms-toast-message">{toast.message}</p>
      </div>
      <button className="ms-toast-close" onClick={handleClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div className="ms-toast-progress" style={{ animationDuration: `${duration}ms` }} />
    </div>
  )
}

// Toast Provider & Container
interface ToastProviderProps {
  children: React.ReactNode
  duration?: number
}

let toastIdCounter = 0

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, duration = 5000 }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="ms-toast-container">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            duration={duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
