'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResizeHandlesProps {
  element: any
  isSelected: boolean
  onResize: (newSize: { width: number; height: number }) => void
  onResizeEnd?: () => void
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  showGrid?: boolean
  snapToGrid?: boolean
  gridSize?: number
  aspectRatio?: number | null
  className?: string
}

type ResizeDirection = 
  | 'n' | 's' | 'e' | 'w' 
  | 'ne' | 'nw' | 'se' | 'sw'

export function ResizeHandles({
  element,
  isSelected,
  onResize,
  onResizeEnd,
  minWidth = 20,
  minHeight = 20,
  maxWidth,
  maxHeight,
  showGrid = false,
  snapToGrid = false,
  gridSize = 8,
  aspectRatio = null,
  className
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }, [snapToGrid, gridSize])

  const handleMouseDown = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setResizeDirection(direction)
    setStartSize({
      width: element.size?.width || 200,
      height: element.size?.height || 100
    })
    setStartPosition({ x: e.clientX, y: e.clientY })

    document.body.style.cursor = getCursorForDirection(direction)
  }, [element.size])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return

    const deltaX = e.clientX - startPosition.x
    const deltaY = e.clientY - startPosition.y

    let newWidth = startSize.width
    let newHeight = startSize.height

    // Calculate new dimensions based on resize direction
    switch (resizeDirection) {
      case 'e':
        newWidth = startSize.width + deltaX
        break
      case 'w':
        newWidth = startSize.width - deltaX
        break
      case 's':
        newHeight = startSize.height + deltaY
        break
      case 'n':
        newHeight = startSize.height - deltaY
        break
      case 'se':
        newWidth = startSize.width + deltaX
        newHeight = startSize.height + deltaY
        break
      case 'sw':
        newWidth = startSize.width - deltaX
        newHeight = startSize.height + deltaY
        break
      case 'ne':
        newWidth = startSize.width + deltaX
        newHeight = startSize.height - deltaY
        break
      case 'nw':
        newWidth = startSize.width - deltaX
        newHeight = startSize.height - deltaY
        break
    }

    // Maintain aspect ratio if specified
    if (aspectRatio && (resizeDirection === 'se' || resizeDirection === 'sw' || resizeDirection === 'ne' || resizeDirection === 'nw')) {
      const ratio = aspectRatio
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / ratio
      } else {
        newWidth = newHeight * ratio
      }
    }

    // Apply constraints
    newWidth = Math.max(minWidth, newWidth)
    newHeight = Math.max(minHeight, newHeight)

    if (maxWidth) newWidth = Math.min(maxWidth, newWidth)
    if (maxHeight) newHeight = Math.min(maxHeight, newHeight)

    // Snap to grid
    newWidth = snapToGridValue(newWidth)
    newHeight = snapToGridValue(newHeight)

    onResize({ width: newWidth, height: newHeight })
  }, [isResizing, resizeDirection, startPosition, startSize, aspectRatio, minWidth, minHeight, maxWidth, maxHeight, snapToGridValue, onResize])

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      setResizeDirection(null)
      document.body.style.cursor = 'default'
      onResizeEnd?.()
    }
  }, [isResizing, onResizeEnd])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const getCursorForDirection = (direction: ResizeDirection): string => {
    const cursors = {
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      ne: 'ne-resize',
      nw: 'nw-resize',
      se: 'se-resize',
      sw: 'sw-resize'
    }
    return cursors[direction]
  }

  if (!isSelected) return null

  const handleStyle = "absolute w-2 h-2 bg-white border-2 border-blue-500 rounded-sm hover:bg-blue-100 transition-colors z-50"
  const edgeHandleStyle = "absolute bg-transparent hover:bg-blue-200/50 transition-colors z-40"

  return (
    <div
      ref={elementRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
    >
      {/* Corner Handles */}
      <div
        className={cn(handleStyle, "-top-1 -left-1 cursor-nw-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('nw', e)}
      />
      <div
        className={cn(handleStyle, "-top-1 -right-1 cursor-ne-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('ne', e)}
      />
      <div
        className={cn(handleStyle, "-bottom-1 -left-1 cursor-sw-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('sw', e)}
      />
      <div
        className={cn(handleStyle, "-bottom-1 -right-1 cursor-se-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('se', e)}
      />

      {/* Edge Handles */}
      <div
        className={cn(edgeHandleStyle, "-top-1 left-2 right-2 h-2 cursor-n-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('n', e)}
      />
      <div
        className={cn(edgeHandleStyle, "-bottom-1 left-2 right-2 h-2 cursor-s-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('s', e)}
      />
      <div
        className={cn(edgeHandleStyle, "-left-1 top-2 bottom-2 w-2 cursor-w-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('w', e)}
      />
      <div
        className={cn(edgeHandleStyle, "-right-1 top-2 bottom-2 w-2 cursor-e-resize")}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => handleMouseDown('e', e)}
      />

      {/* Size Indicator */}
      {isResizing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
          {Math.round(element.size?.width || 0)} × {Math.round(element.size?.height || 0)}
        </div>
      )}

      {/* Grid Snap Indicators */}
      {showGrid && snapToGrid && isResizing && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 border border-dashed border-blue-400 opacity-50"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`
            }}
          />
        </div>
      )}

      {/* Aspect Ratio Lock Indicator */}
      {aspectRatio && (
        <div className="absolute -top-8 -right-8 bg-purple-500 text-white text-xs px-1 py-0.5 rounded">
          🔒
        </div>
      )}
    </div>
  )
}