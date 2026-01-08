'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
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
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
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
  isSelected,
  elementId,
  onChange,
  onStyleChange
}: TextWidgetProps) {
  const textRef = useRef<HTMLElement | null>(null)
  const [localText, setLocalText] = useState(text)
  const [inlineEditing, setInlineEditing] = useState(false)

  // Update local text when prop changes
  useEffect(() => {
    setLocalText(text)
  }, [text])

  const refCallback = useCallback((node: HTMLElement | null) => {
    textRef.current = node
    if (inlineEditing && node) {
      node.focus()
      // Place cursor at end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(node)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [inlineEditing])

  // Handle text changes during editing
  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText
    setLocalText(newText)
  }

  const handleBlur = () => {
    if (textRef.current && onChange) {
      const newText = textRef.current.innerText
      onChange({ text: newText })
      setInlineEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      textRef.current?.blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalText(text) // Reset to original
      textRef.current?.blur()
    }
  }

  // Start editing on double click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    setInlineEditing(true)
  }

  // Start editing when Enter is pressed on selected element
  useEffect(() => {
    if (isSelected && !isPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !inlineEditing && !e.shiftKey) {
          e.preventDefault()
          setInlineEditing(true)
        }
        if (e.key === 'Escape' && inlineEditing) {
          e.preventDefault()
          setLocalText(text) // Reset to original
          setInlineEditing(false)
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isPreview, inlineEditing, text])

  const commonProps = {
    className: cn(
      TAG_STYLES[tag],
      "w-full px-4 py-2 transition-all cursor-text relative",
      inlineEditing && "outline-none bg-primary/5 rounded ring-2 ring-primary/50",
      !isPreview && !inlineEditing && "hover:bg-muted/30 rounded",
      isSelected && !inlineEditing && "bg-primary/5"
    ),
    style: {
      fontSize,
      fontWeight,
      color,
      textAlign,
      lineHeight,
      letterSpacing
    },
    contentEditable: inlineEditing,
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onDoubleClick: handleDoubleClick,
    children: (
      <>
        {localText || text}
        {inlineEditing && (
          <div className="absolute -top-10 left-0 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1 z-50">
            <button
              type="button"
              className="p-1 hover:bg-muted rounded text-xs"
              onMouseDown={(e) => {
                e.preventDefault()
                document.execCommand('bold')
              }}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="p-1 hover:bg-muted rounded text-xs italic"
              onMouseDown={(e) => {
                e.preventDefault()
                document.execCommand('italic')
              }}
            >
              I
            </button>
            <button
              type="button"
              className="p-1 hover:bg-muted rounded text-xs underline"
              onMouseDown={(e) => {
                e.preventDefault()
                document.execCommand('underline')
              }}
            >
              U
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              className="px-2 py-1 hover:bg-muted rounded text-xs text-green-600"
              onMouseDown={(e) => {
                e.preventDefault()
                textRef.current?.blur()
              }}
            >
              ✓ Save
            </button>
            <button
              type="button"
              className="px-2 py-1 hover:bg-muted rounded text-xs text-red-600"
              onMouseDown={(e) => {
                e.preventDefault()
                setLocalText(text)
                setInlineEditing(false)
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}
      </>
    )
  }

  // Render specific tag to avoid union type issues
  switch (tag) {
    case 'h1':
      return <h1 ref={refCallback as any} {...commonProps} />
    case 'h2':
      return <h2 ref={refCallback as any} {...commonProps} />
    case 'h3':
      return <h3 ref={refCallback as any} {...commonProps} />
    case 'h4':
      return <h4 ref={refCallback as any} {...commonProps} />
    case 'h5':
      return <h5 ref={refCallback as any} {...commonProps} />
    case 'h6':
      return <h6 ref={refCallback as any} {...commonProps} />
    case 'span':
      return <span ref={refCallback as any} {...commonProps} />
    default:
      return <p ref={refCallback as any} {...commonProps} />
  }
}
