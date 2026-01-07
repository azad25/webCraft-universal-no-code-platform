'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MetricWidgetProps {
  label?: string
  value?: string
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  variant?: 'simple' | 'card' | 'compact'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<MetricWidgetProps>) => void
}

export function MetricWidget({
  label = 'Total Revenue',
  value = '45,231',
  change = 12.5,
  changeLabel = 'vs last month',
  prefix = '$',
  suffix = '',
  variant = 'card',
  isEditing = false,
  isPreview = false,
  onChange
}: MetricWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const isPositive = change > 0
  const isNeutral = change === 0
  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown

  const renderMetric = () => {
    switch (variant) {
      case 'simple':
        return (
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">
              {prefix}{value}{suffix}
            </p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-sm mt-1',
                isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'
              )}>
                <TrendIcon className="w-4 h-4" />
                <span>{isPositive ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
        )

      case 'card':
        return (
          <div className="p-6 rounded-lg border bg-card">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">
              {prefix}{value}{suffix}
            </p>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-sm mt-2',
                isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'
              )}>
                <TrendIcon className="w-4 h-4" />
                <span>{isPositive ? '+' : ''}{change}%</span>
                {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
              </div>
            )}
          </div>
        )

      case 'compact':
        return (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{prefix}{value}{suffix}</p>
            </div>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                isPositive ? 'bg-green-100 text-green-700' : isNeutral ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
              )}>
                <TrendIcon className="w-3 h-3" />
                <span>{isPositive ? '+' : ''}{change}%</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Metric Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={label} onChange={(e) => onChange?.({ label: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Prefix</Label>
                <Input value={prefix} onChange={(e) => onChange?.({ prefix: e.target.value })} placeholder="$" />
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input value={value} onChange={(e) => onChange?.({ value: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Suffix</Label>
                <Input value={suffix} onChange={(e) => onChange?.({ suffix: e.target.value })} placeholder="%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Change (%)</Label>
                <Input type="number" value={change} onChange={(e) => onChange?.({ change: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Change Label</Label>
                <Input value={changeLabel} onChange={(e) => onChange?.({ changeLabel: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Variant</Label>
              <select
                value={variant}
                onChange={(e) => onChange?.({ variant: e.target.value as any })}
                className="w-full mt-1 text-sm border rounded px-3 py-2"
              >
                <option value="simple">Simple</option>
                <option value="card">Card</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">{renderMetric()}</div>
      </div>
    )
  }

  return renderMetric()
}
