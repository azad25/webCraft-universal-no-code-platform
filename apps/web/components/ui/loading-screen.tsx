'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
}

export function LoadingScreen({ 
  message = 'Loading...', 
  className,
  size = 'md',
  overlay = false
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const content = (
    <div className={cn(
      "flex items-center justify-center",
      overlay ? "min-h-screen" : "min-h-[200px]",
      className
    )}>
      <div className="flex items-center gap-3 bg-card p-6 rounded-lg shadow-lg border">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        <div>
          <p className="font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return content
}

export function PageLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{message || 'Loading page...'}</span>
      </div>
    </div>
  )
}