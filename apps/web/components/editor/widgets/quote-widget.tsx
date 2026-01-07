'use client'

import { useState } from 'react'
import { Quote, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface QuoteWidgetProps {
  quote?: string
  author?: string
  source?: string
  variant?: 'simple' | 'bordered' | 'highlighted' | 'modern'
  alignment?: 'left' | 'center' | 'right'
  showQuoteIcon?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<QuoteWidgetProps>) => void
}

export function QuoteWidget({
  quote = 'The only way to do great work is to love what you do.',
  author = 'Steve Jobs',
  source = 'Stanford Commencement Speech, 2005',
  variant = 'bordered',
  alignment = 'left',
  showQuoteIcon = true,
  isEditing = false,
  isPreview = false,
  onChange
}: QuoteWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  const renderQuote = () => {
    switch (variant) {
      case 'simple':
        return (
          <blockquote className={cn('space-y-2', alignmentClasses[alignment])}>
            {showQuoteIcon && alignment === 'center' && (
              <Quote className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            )}
            <p className="text-lg italic text-foreground">"{quote}"</p>
            {(author || source) && (
              <footer className="text-sm text-muted-foreground">
                {author && <span className="font-medium">— {author}</span>}
                {source && <span>, {source}</span>}
              </footer>
            )}
          </blockquote>
        )

      case 'bordered':
        return (
          <blockquote className={cn(
            'border-l-4 border-primary pl-4 py-2',
            alignmentClasses[alignment]
          )}>
            <p className="text-lg text-foreground">{quote}</p>
            {(author || source) && (
              <footer className="mt-2 text-sm text-muted-foreground">
                {author && <span className="font-medium">— {author}</span>}
                {source && <span>, {source}</span>}
              </footer>
            )}
          </blockquote>
        )

      case 'highlighted':
        return (
          <blockquote className={cn(
            'bg-primary/5 border border-primary/20 rounded-lg p-6',
            alignmentClasses[alignment]
          )}>
            {showQuoteIcon && (
              <Quote className={cn(
                'w-10 h-10 text-primary/30 mb-3',
                alignment === 'center' && 'mx-auto',
                alignment === 'right' && 'ml-auto'
              )} />
            )}
            <p className="text-xl font-medium text-foreground">{quote}</p>
            {(author || source) && (
              <footer className="mt-4 text-sm text-muted-foreground">
                {author && <span className="font-semibold text-foreground">{author}</span>}
                {source && <span className="block mt-1">{source}</span>}
              </footer>
            )}
          </blockquote>
        )

      case 'modern':
        return (
          <blockquote className={cn('relative', alignmentClasses[alignment])}>
            {showQuoteIcon && (
              <Quote className="absolute -top-2 -left-2 w-12 h-12 text-primary/10" />
            )}
            <p className="text-2xl font-light leading-relaxed text-foreground relative z-10">
              {quote}
            </p>
            {(author || source) && (
              <footer className="mt-4 flex items-center gap-3">
                <div className="w-12 h-0.5 bg-primary" />
                <div className="text-sm">
                  {author && <span className="font-semibold text-foreground">{author}</span>}
                  {source && <span className="text-muted-foreground ml-2">{source}</span>}
                </div>
              </footer>
            )}
          </blockquote>
        )

      default:
        return null
    }
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Quote Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Quote Text</Label>
              <Textarea
                value={quote}
                onChange={(e) => onChange?.({ quote: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Author</Label>
                <Input
                  value={author}
                  onChange={(e) => onChange?.({ author: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Input
                  value={source}
                  onChange={(e) => onChange?.({ source: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Style</Label>
                <select
                  value={variant}
                  onChange={(e) => onChange?.({ variant: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="simple">Simple</option>
                  <option value="bordered">Bordered</option>
                  <option value="highlighted">Highlighted</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Alignment</Label>
                <select
                  value={alignment}
                  onChange={(e) => onChange?.({ alignment: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showQuoteIcon}
                onChange={(e) => onChange?.({ showQuoteIcon: e.target.checked })}
                className="rounded"
              />
              Show Quote Icon
            </label>
          </div>
        )}

        <div className="pt-2 border-t">{renderQuote()}</div>
      </div>
    )
  }

  return renderQuote()
}
