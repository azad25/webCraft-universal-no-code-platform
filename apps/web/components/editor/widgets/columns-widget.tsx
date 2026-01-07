'use client'

import { cn } from '@/lib/utils'

interface ColumnsWidgetProps {
  columns?: number
  gap?: string
  children?: React.ReactNode[]
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function ColumnsWidget({
  columns = 2,
  gap = '24px',
  children,
  isEditing,
  isPreview,
  onChange
}: ColumnsWidgetProps) {
  return (
    <div
      className="w-full px-4 py-6"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap
      }}
    >
      {children && children.length > 0 ? (
        children.map((child, index) => (
          <div key={index} className="min-h-[100px]">
            {child}
          </div>
        ))
      ) : (
        Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="min-h-[150px] border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm"
          >
            Column {index + 1}
          </div>
        ))
      )}
    </div>
  )
}
