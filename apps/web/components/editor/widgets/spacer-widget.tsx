'use client'

import { cn } from '@/lib/utils'

interface SpacerWidgetProps {
  height?: number
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function SpacerWidget({
  height = 40,
  isEditing,
  isPreview,
  onChange
}: SpacerWidgetProps) {
  return (
    <div
      className={cn(
        "w-full",
        isEditing && "bg-primary/5 border border-dashed border-primary/30"
      )}
      style={{ height: `${height}px` }}
    >
      {isEditing && (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Spacer: {height}px
        </div>
      )}
    </div>
  )
}
