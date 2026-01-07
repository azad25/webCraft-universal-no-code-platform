'use client'

import { useState } from 'react'
import { Edit2, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Avatar {
  name: string
  image?: string
  color?: string
}

interface AvatarGroupWidgetProps {
  avatars?: Avatar[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  overlap?: boolean
  showNames?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<AvatarGroupWidgetProps>) => void
}

export function AvatarGroupWidget({
  avatars = [
    { name: 'John Doe', color: '#3b82f6' },
    { name: 'Jane Smith', color: '#10b981' },
    { name: 'Bob Wilson', color: '#f59e0b' },
    { name: 'Alice Brown', color: '#ef4444' },
    { name: 'Charlie Davis', color: '#8b5cf6' }
  ],
  maxDisplay = 4,
  size = 'md',
  overlap = true,
  showNames = false,
  isEditing = false,
  isPreview = false,
  onChange
}: AvatarGroupWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const displayAvatars = avatars.slice(0, maxDisplay)
  const remainingCount = avatars.length - maxDisplay

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const addAvatar = () => {
    onChange?.({ avatars: [...avatars, { name: 'New User', color: '#6b7280' }] })
  }

  const updateAvatar = (index: number, field: keyof Avatar, value: string) => {
    const newAvatars = [...avatars]
    newAvatars[index] = { ...newAvatars[index], [field]: value }
    onChange?.({ avatars: newAvatars })
  }

  const removeAvatar = (index: number) => {
    onChange?.({ avatars: avatars.filter((_, i) => i !== index) })
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Avatar Group Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Max Display</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxDisplay}
                  onChange={(e) => onChange?.({ maxDisplay: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Size</Label>
                <select
                  value={size}
                  onChange={(e) => onChange?.({ size: e.target.value as any })}
                  className="w-full mt-1 text-sm border rounded px-3 py-2"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={overlap}
                  onChange={(e) => onChange?.({ overlap: e.target.checked })}
                  className="rounded"
                />
                Overlap
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showNames}
                  onChange={(e) => onChange?.({ showNames: e.target.checked })}
                  className="rounded"
                />
                Show Names
              </label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Avatars</Label>
              {avatars.map((avatar, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={avatar.name}
                    onChange={(e) => updateAvatar(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={avatar.color || '#6b7280'}
                    onChange={(e) => updateAvatar(index, 'color', e.target.value)}
                    className="w-12"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeAvatar(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addAvatar} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Avatar
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center">
      <div className={cn('flex', overlap ? '-space-x-3' : 'space-x-1')}>
        {displayAvatars.map((avatar, index) => (
          <div
            key={index}
            className={cn(
              sizeClasses[size],
              'rounded-full flex items-center justify-center font-medium text-white ring-2 ring-background',
              avatar.image ? '' : ''
            )}
            style={{ backgroundColor: avatar.color || '#6b7280' }}
            title={avatar.name}
          >
            {avatar.image ? (
              <img src={avatar.image} alt={avatar.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(avatar.name)
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              sizeClasses[size],
              'rounded-full flex items-center justify-center font-medium bg-gray-200 text-gray-600 ring-2 ring-background'
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      {showNames && (
        <div className="ml-3 text-sm text-muted-foreground">
          {displayAvatars.map(a => a.name.split(' ')[0]).join(', ')}
          {remainingCount > 0 && ` +${remainingCount} more`}
        </div>
      )}
    </div>
  )
}
