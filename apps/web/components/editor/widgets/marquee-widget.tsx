'use client'

import { useState } from 'react'
import { Edit2, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MarqueeWidgetProps {
  items?: string[]
  speed?: 'slow' | 'normal' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  variant?: 'text' | 'badge' | 'card'
  separator?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<MarqueeWidgetProps>) => void
}

export function MarqueeWidget({
  items = ['🚀 New Feature Released', '⭐ 5000+ Happy Customers', '🎉 Special Offer: 20% Off', '📦 Free Shipping Worldwide'],
  speed = 'normal',
  direction = 'left',
  pauseOnHover = true,
  variant = 'text',
  separator = '•',
  isEditing = false,
  isPreview = false,
  onChange
}: MarqueeWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const speedDurations = {
    slow: '40s',
    normal: '25s',
    fast: '15s'
  }

  const addItem = () => {
    onChange?.({ items: [...items, 'New Item'] })
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange?.({ items: newItems })
  }

  const removeItem = (index: number) => {
    onChange?.({ items: items.filter((_, i) => i !== index) })
  }

  const renderItem = (item: string, index: number) => {
    switch (variant) {
      case 'badge':
        return (
          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium whitespace-nowrap">
            {item}
          </span>
        )
      case 'card':
        return (
          <span key={index} className="inline-flex items-center px-4 py-2 rounded-lg bg-card border shadow-sm text-sm whitespace-nowrap">
            {item}
          </span>
        )
      default:
        return (
          <span key={index} className="whitespace-nowrap">
            {item}
          </span>
        )
    }
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Marquee Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Speed</Label>
                <select
                  value={speed}
                  onChange={(e) => onChange?.({ speed: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Direction</Label>
                <select
                  value={direction}
                  onChange={(e) => onChange?.({ direction: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Style</Label>
                <select
                  value={variant}
                  onChange={(e) => onChange?.({ variant: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="text">Text</option>
                  <option value="badge">Badge</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pauseOnHover}
                onChange={(e) => onChange?.({ pauseOnHover: e.target.checked })}
                className="rounded"
              />
              Pause on Hover
            </label>
            <div className="space-y-2">
              <Label className="text-xs">Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeItem(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addItem} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const duplicatedItems = [...items, ...items]

  return (
    <div className="overflow-hidden py-2">
      <div
        className={cn(
          'flex gap-8 items-center',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
        style={{
          animation: `marquee ${speedDurations[speed]} linear infinite`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal'
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className="flex items-center gap-8">
            {renderItem(item, index)}
            {variant === 'text' && index < duplicatedItems.length - 1 && (
              <span className="text-muted-foreground">{separator}</span>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
