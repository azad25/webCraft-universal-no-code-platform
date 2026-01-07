'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AlertWidgetProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message?: string
  dismissible?: boolean
  showIcon?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<AlertWidgetProps>) => void
}

export function AlertWidget({
  variant = 'info',
  title = 'Information',
  message = 'This is an informational alert message.',
  dismissible = true,
  showIcon = true,
  isEditing = false,
  isPreview = false,
  onChange
}: AlertWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const variants = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: AlertTriangle
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: AlertCircle
    }
  }

  const currentVariant = variants[variant]
  const IconComponent = currentVariant.icon

  if (isDismissed && !isEditing) return null

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Alert Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Variant</Label>
              <select
                value={variant}
                onChange={(e) => onChange?.({ variant: e.target.value as any })}
                className="w-full mt-1 text-sm border rounded px-3 py-2"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => onChange?.({ title: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => onChange?.({ message: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showIcon}
                  onChange={(e) => onChange?.({ showIcon: e.target.checked })}
                  className="rounded"
                />
                Show Icon
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={dismissible}
                  onChange={(e) => onChange?.({ dismissible: e.target.checked })}
                  className="rounded"
                />
                Dismissible
              </label>
            </div>
          </div>
        )}

        <div className={cn(
          'flex items-start gap-3 p-4 rounded-lg border',
          currentVariant.bg,
          currentVariant.border
        )}>
          {showIcon && <IconComponent className={cn('w-5 h-5 mt-0.5', currentVariant.text)} />}
          <div className="flex-1">
            {title && <p className={cn('font-medium', currentVariant.text)}>{title}</p>}
            {message && <p className={cn('text-sm mt-1', currentVariant.text)}>{message}</p>}
          </div>
          {dismissible && (
            <button className={cn('p-1 rounded hover:bg-black/10', currentVariant.text)}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-lg border transition-all',
      currentVariant.bg,
      currentVariant.border
    )}>
      {showIcon && <IconComponent className={cn('w-5 h-5 mt-0.5 flex-shrink-0', currentVariant.text)} />}
      <div className="flex-1 min-w-0">
        {title && <p className={cn('font-medium', currentVariant.text)}>{title}</p>}
        {message && <p className={cn('text-sm mt-1', currentVariant.text)}>{message}</p>}
      </div>
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className={cn('p-1 rounded hover:bg-black/10 flex-shrink-0', currentVariant.text)}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
