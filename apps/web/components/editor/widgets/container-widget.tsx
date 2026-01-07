'use client'

import { cn } from '@/lib/utils'

interface ContainerWidgetProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: string
  backgroundColor?: string
  children?: React.ReactNode
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const MAX_WIDTH_CLASSES = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full'
}

export function ContainerWidget({
  maxWidth = 'xl',
  padding = '20px',
  backgroundColor = 'transparent',
  children,
  isEditing,
  isPreview,
  onChange
}: ContainerWidgetProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        MAX_WIDTH_CLASSES[maxWidth]
      )}
      style={{ padding, backgroundColor }}
    >
      {children || (
        <div className="min-h-[100px] border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm">
          Container - Drop elements here
        </div>
      )}
    </div>
  )
}
