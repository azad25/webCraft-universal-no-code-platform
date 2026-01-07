'use client'

import { cn } from '@/lib/utils'

interface DividerWidgetProps {
  style?: 'solid' | 'dashed' | 'dotted'
  color?: string
  thickness?: number
  width?: string
  margin?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function DividerWidget({
  style = 'solid',
  color = '#e5e7eb',
  thickness = 1,
  width = '100%',
  margin = '20px 0',
  isEditing,
  isPreview,
  onChange
}: DividerWidgetProps) {
  return (
    <div className="px-4" style={{ margin }}>
      <hr
        className="border-0"
        style={{
          borderTopStyle: style,
          borderTopWidth: `${thickness}px`,
          borderTopColor: color,
          width
        }}
      />
    </div>
  )
}
