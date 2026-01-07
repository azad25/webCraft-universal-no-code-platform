'use client'

import { useState } from 'react'
import { ExternalLink, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmbedWidgetProps {
  url?: string
  title?: string
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'custom'
  customHeight?: number
  allowFullscreen?: boolean
  showBorder?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<EmbedWidgetProps>) => void
}

export function EmbedWidget({
  url = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.30596073366!2d-74.25986548248684!3d40.69714941932609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1635959481000!5m2!1sen!2s',
  title = 'Embedded Content',
  aspectRatio = '16:9',
  customHeight = 400,
  allowFullscreen = true,
  showBorder = true,
  isEditing = false,
  isPreview = false,
  onChange
}: EmbedWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const aspectRatioClasses = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    'custom': ''
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Embed Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Embed URL</Label>
              <Input
                value={url}
                onChange={(e) => onChange?.({ url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste an embed URL (Google Maps, Figma, Loom, etc.)
              </p>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => onChange?.({ title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Aspect Ratio</Label>
                <select
                  value={aspectRatio}
                  onChange={(e) => onChange?.({ aspectRatio: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="16:9">16:9 (Video)</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="custom">Custom Height</option>
                </select>
              </div>
              {aspectRatio === 'custom' && (
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => onChange?.({ customHeight: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allowFullscreen}
                  onChange={(e) => onChange?.({ allowFullscreen: e.target.checked })}
                  className="rounded"
                />
                Allow Fullscreen
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showBorder}
                  onChange={(e) => onChange?.({ showBorder: e.target.checked })}
                  className="rounded"
                />
                Show Border
              </label>
            </div>
          </div>
        )}

        <div className={cn(
          'rounded-lg overflow-hidden',
          showBorder && 'border',
          aspectRatioClasses[aspectRatio]
        )}
        style={aspectRatio === 'custom' ? { height: customHeight } : undefined}
        >
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ExternalLink className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Embed Preview</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden w-full',
        showBorder && 'border',
        aspectRatioClasses[aspectRatio]
      )}
      style={aspectRatio === 'custom' ? { height: customHeight } : undefined}
    >
      <iframe
        src={url}
        title={title}
        className="w-full h-full"
        allowFullScreen={allowFullscreen}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
