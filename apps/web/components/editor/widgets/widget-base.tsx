'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BaseWidgetProps {
  // Content props
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
  
  // Style props that all widgets should support
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: 'cover' | 'contain' | 'auto'
  backgroundPosition?: string
  backgroundRepeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y'
  textColor?: string
  padding?: string
  margin?: string
  borderRadius?: string
  borderWidth?: string
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  boxShadow?: string
  opacity?: number
  
  // Layout props
  width?: string
  height?: string
  minHeight?: string
  maxHeight?: string
  minWidth?: string
  maxWidth?: string
  
  // Animation props
  animationDelay?: number
  animationDuration?: number
  animationType?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'none'
}

interface WidgetContainerProps extends BaseWidgetProps {
  children: ReactNode
  className?: string
  tag?: keyof JSX.IntrinsicElements
}

export function WidgetContainer({
  children,
  className,
  tag: Tag = 'div',
  backgroundColor,
  backgroundImage,
  backgroundSize = 'cover',
  backgroundPosition = 'center',
  backgroundRepeat = 'no-repeat',
  textColor,
  padding,
  margin,
  borderRadius,
  borderWidth,
  borderColor,
  borderStyle = 'solid',
  boxShadow,
  opacity = 1,
  width,
  height,
  minHeight,
  maxHeight,
  minWidth,
  maxWidth,
  animationType = 'none',
  animationDelay = 0,
  animationDuration = 0.5,
  isSelected,
  ...props
}: WidgetContainerProps) {
  const containerStyle = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize,
    backgroundPosition,
    backgroundRepeat,
    color: textColor,
    padding,
    margin,
    borderRadius,
    borderWidth,
    borderColor,
    borderStyle: borderWidth ? borderStyle : undefined,
    boxShadow,
    opacity,
    width,
    height,
    minHeight,
    maxHeight,
    minWidth,
    maxWidth,
  }

  // Remove undefined values
  Object.keys(containerStyle).forEach(key => {
    if (containerStyle[key as keyof typeof containerStyle] === undefined) {
      delete containerStyle[key as keyof typeof containerStyle]
    }
  })

  return (
    <Tag
      className={cn(
        "relative transition-all duration-300",
        animationType === 'fadeIn' && "animate-in fade-in",
        animationType === 'slideUp' && "animate-in slide-in-from-bottom-4",
        animationType === 'slideDown' && "animate-in slide-in-from-top-4",
        animationType === 'slideLeft' && "animate-in slide-in-from-right-4",
        animationType === 'slideRight' && "animate-in slide-in-from-left-4",
        animationType === 'zoom' && "animate-in zoom-in-95",
        className
      )}
      style={{
        ...containerStyle,
        animationDelay: `${animationDelay}ms`,
        animationDuration: `${animationDuration}s`,
      }}
      {...props}
    >
      {children}
    </Tag>
  )
}

// Utility function to extract style props from widget props
export function extractStyleProps(props: any): {
  styleProps: Partial<BaseWidgetProps>
  contentProps: any
} {
  const styleKeys = [
    'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
    'textColor', 'padding', 'margin', 'borderRadius', 'borderWidth', 'borderColor', 'borderStyle',
    'boxShadow', 'opacity', 'width', 'height', 'minHeight', 'maxHeight', 'minWidth', 'maxWidth',
    'animationDelay', 'animationDuration', 'animationType'
  ]
  
  const styleProps: Partial<BaseWidgetProps> = {}
  const contentProps: any = {}
  
  Object.keys(props).forEach(key => {
    if (styleKeys.includes(key)) {
      styleProps[key as keyof BaseWidgetProps] = props[key]
    } else {
      contentProps[key] = props[key]
    }
  })
  
  return { styleProps, contentProps }
}

// Inline editing utilities
export function useInlineEditing(
  initialValue: string,
  onChange?: (value: string) => void,
  isSelected?: boolean,
  isPreview?: boolean
) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(initialValue)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])

  const startEditing = () => {
    if (isPreview) return
    setIsEditing(true)
  }

  const stopEditing = () => {
    if (ref.current && onChange) {
      const newValue = ref.current.innerText
      onChange(newValue)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      stopEditing()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalValue(initialValue)
      setIsEditing(false)
    }
  }

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    setLocalValue(e.currentTarget.innerText)
  }

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus()
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(ref.current)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  // Start editing on Enter key when selected
  useEffect(() => {
    if (isSelected && !isPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !isEditing) {
          e.preventDefault()
          startEditing()
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isPreview, isEditing])

  return {
    isEditing,
    localValue,
    ref,
    startEditing,
    stopEditing,
    handleKeyDown,
    handleInput,
    editableProps: {
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onBlur: stopEditing,
      onKeyDown: handleKeyDown,
      onDoubleClick: startEditing,
    }
  }
}