'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TextWidgetProps {
  text?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  fontSize?: string
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: string
  letterSpacing?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const TAG_STYLES = {
  h1: 'text-4xl md:text-5xl font-bold',
  h2: 'text-3xl md:text-4xl font-bold',
  h3: 'text-2xl md:text-3xl font-semibold',
  h4: 'text-xl md:text-2xl font-semibold',
  h5: 'text-lg md:text-xl font-medium',
  h6: 'text-base md:text-lg font-medium',
  p: 'text-base',
  span: 'text-base'
}

export function TextWidget({
  text = 'Enter your text here...',
  tag = 'p',
  fontSize,
  fontWeight,
  color,
  textAlign = 'left',
  lineHeight,
  letterSpacing,
  isEditing,
  isPreview,
  onChange
}: TextWidgetProps) {
  const textRef = useRef<HTMLElement>(null)
  const Tag = tag as keyof JSX.IntrinsicElements

  const handleBlur = () => {
    if (textRef.current && onChange) {
      onChange({ text: textRef.current.innerText })
    }
  }

  // Focus on edit mode
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus()
      // Place cursor at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(textRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [isEditing])

  return (
    <Tag
      ref={textRef as any}
      className={cn(
        TAG_STYLES[tag],
        "w-full px-4 py-2 transition-all",
        isEditing && "outline-none bg-primary/5 rounded"
      )}
      style={{
        fontSize,
        fontWeight,
        color,
        textAlign,
        lineHeight,
        letterSpacing
      }}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onBlur={handleBlur}
    >
      {text}
    </Tag>
  )
}
