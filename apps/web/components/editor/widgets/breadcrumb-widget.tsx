'use client'

import { useState } from 'react'
import { ChevronRight, Home, Edit2, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbWidgetProps {
  items?: BreadcrumbItem[]
  showHome?: boolean
  separator?: 'chevron' | 'slash' | 'arrow'
  size?: 'sm' | 'md' | 'lg'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<BreadcrumbWidgetProps>) => void
}

export function BreadcrumbWidget({
  items = [
    { label: 'Products', href: '/products' },
    { label: 'Electronics', href: '/products/electronics' },
    { label: 'Smartphones', href: '/products/electronics/smartphones' }
  ],
  showHome = true,
  separator = 'chevron',
  size = 'md',
  isEditing = false,
  isPreview = false,
  onChange
}: BreadcrumbWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const renderSeparator = () => {
    switch (separator) {
      case 'slash':
        return <span className="text-muted-foreground mx-2">/</span>
      case 'arrow':
        return <span className="text-muted-foreground mx-2">→</span>
      default:
        return <ChevronRight className={cn(iconSizes[size], 'text-muted-foreground mx-1')} />
    }
  }

  const addItem = () => {
    onChange?.({ items: [...items, { label: 'New Item', href: '#' }] })
  }

  const updateItem = (index: number, field: keyof BreadcrumbItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange?.({ items: newItems })
  }

  const removeItem = (index: number) => {
    onChange?.({ items: items.filter((_, i) => i !== index) })
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Breadcrumb Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showHome}
                  onChange={(e) => onChange?.({ showHome: e.target.checked })}
                  className="rounded"
                />
                Show Home Icon
              </label>
              <div>
                <Label className="text-xs">Separator</Label>
                <select
                  value={separator}
                  onChange={(e) => onChange?.({ separator: e.target.value as any })}
                  className="ml-2 text-sm border rounded px-2 py-1"
                >
                  <option value="chevron">Chevron</option>
                  <option value="slash">Slash</option>
                  <option value="arrow">Arrow</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={item.href}
                    onChange={(e) => updateItem(index, 'href', e.target.value)}
                    placeholder="URL"
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

        <nav className="flex items-center pt-2 border-t">
          {showHome && (
            <>
              <a href="/" className="text-muted-foreground hover:text-foreground">
                <Home className={iconSizes[size]} />
              </a>
              {renderSeparator()}
            </>
          )}
          {items.map((item, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && renderSeparator()}
              <span className={cn(
                sizeClasses[size],
                index === items.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              )}>
                {item.label}
              </span>
            </span>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <nav className={cn('flex items-center flex-wrap', sizeClasses[size])}>
      {showHome && (
        <>
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className={iconSizes[size]} />
          </a>
          {renderSeparator()}
        </>
      )}
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && renderSeparator()}
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <a
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          )}
        </span>
      ))}
    </nav>
  )
}
