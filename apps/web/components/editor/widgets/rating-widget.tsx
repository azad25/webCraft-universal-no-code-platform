'use client'

import { useState } from 'react'
import { Star, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RatingWidgetProps {
  rating?: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
  reviewCount?: number
  color?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<RatingWidgetProps>) => void
}

export function RatingWidget({
  rating = 4.5,
  maxRating = 5,
  size = 'md',
  showValue = true,
  label = '',
  reviewCount = 128,
  color = '#facc15',
  isEditing = false,
  isPreview = false,
  onChange
}: RatingWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < maxRating; i++) {
      const isFull = i < fullStars
      const isHalf = i === fullStars && hasHalfStar

      stars.push(
        <div key={i} className="relative">
          <Star
            className={cn(sizeClasses[size], 'text-gray-300')}
            fill="currentColor"
          />
          {(isFull || isHalf) && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: isHalf ? '50%' : '100%' }}
            >
              <Star
                className={cn(sizeClasses[size])}
                fill={color}
                style={{ color }}
              />
            </div>
          )}
        </div>
      )
    }
    return stars
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Rating Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Rating</Label>
                <Input
                  type="number"
                  min={0}
                  max={maxRating}
                  step={0.5}
                  value={rating}
                  onChange={(e) => onChange?.({ rating: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Max Rating</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxRating}
                  onChange={(e) => onChange?.({ maxRating: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                value={label}
                onChange={(e) => onChange?.({ label: e.target.value })}
                placeholder="Optional label"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Review Count</Label>
                <Input
                  type="number"
                  value={reviewCount}
                  onChange={(e) => onChange?.({ reviewCount: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Star Color</Label>
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => onChange?.({ color: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          {renderStars()}
          {showValue && (
            <span className={cn(textSizes[size], 'font-medium ml-1')}>
              {rating.toFixed(1)}
            </span>
          )}
          {reviewCount > 0 && (
            <span className="text-muted-foreground text-sm">
              ({reviewCount} reviews)
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && <span className={cn(textSizes[size], 'font-medium mr-1')}>{label}</span>}
      <div className="flex items-center gap-0.5">{renderStars()}</div>
      {showValue && (
        <span className={cn(textSizes[size], 'font-medium ml-1')}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount > 0 && (
        <span className="text-muted-foreground text-sm">
          ({reviewCount.toLocaleString()} reviews)
        </span>
      )}
    </div>
  )
}
