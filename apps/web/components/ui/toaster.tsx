'use client'

import { useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectToasts, removeToast } from '@/store/slices/uiSlice'
import { cn } from '@/lib/utils'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colors = {
  success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
}

export function Toaster() {
  const toasts = useAppSelector(selectToasts)
  const dispatch = useAppDispatch()
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          
          return (
            <Toast
              key={toast.id}
              toast={toast}
              Icon={Icon}
              onClose={() => dispatch(removeToast(toast.id))}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

interface ToastProps {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
  }
  Icon: React.ComponentType<{ className?: string }>
  onClose: () => void
}

function Toast({ toast, Icon, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onClose])
  
  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg',
        colors[toast.type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-1">{toast.message}</p>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </m.div>
  )
}