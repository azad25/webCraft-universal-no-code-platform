'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  aspectRatio?: number
  showGrid?: boolean
}

type ResizeDirection = 
  | 'n' | 's' | 'e' | 'w' 
  | 'ne' | 'nw' | 'se' | 'sw'

export function ResizeHandles({
  element,
  isSelected,
  onResize,
  onResizeEnd,
  minWidth = 50,
  minHeight = 20,
  maxWidth,
  maxHeight,
  aspectRatio,
  showGrid = false
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  // Get element bounds
  const getElementBounds = useCallback(() => {
    const elementNode = document.querySelector(`[data-element-id="${element.id}"]`)
    if (elementNode) {
      return elementNode.getBoundingClientRect()
    }
    return null
  }, [element.id])

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const bounds = getElementBounds()
    if (!bounds) return

    setIsResizing(true)
    setResizeDirection(direction)
    setStartSize({ 
      width: element.size?.width || bounds.width, 
      height: element.size?.height || bounds.height 
    })
    setStartPosition({ x: e.clientX, y: e.clientY })

    // Add global mouse events
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = getCursor(direction)
    document.body.style.userSelect = 'none'
  }, [element.size, getElementBounds])

  // Handle mouse move during resize
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

    // Apply constraints
    newWidth = Math.max(minWidth, newWidth)
    newHeight = Math.max(minHeight, newHeight)

    if (maxWidth) newWidth = Math.min(maxWidth, newWidth)
    if (maxHeight) newHeight = Math.min(maxHeight, newHeight)

    // Maintain aspect ratio if specified
    if (aspectRatio) {
      if (resizeDirection.includes('e') || resizeDirection.includes('w')) {
        newHeight = newWidth / aspectRatio
      } else if (resizeDirection.includes('n') || resizeDirection.includes('s')) {
        newWidth = newHeight * aspectRatio
      } else {
        // Corner resize - maintain aspect ratio based on the larger change
        const widthRatio = newWidth / startSize.width
        const heightRatio = newHeight / startSize.height
        
        if (Math.abs(widthRatio - 1) > Math.abs(heightRatio - 1)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
        }
      }
    }

    // Snap to grid if enabled
    if (showGrid) {
      const gridSize = 10
      newWidth = Math.round(newWidth / gridSize) * gridSize
      newHeight = Math.round(newHeight / gridSize) * gridSize
    }

    onResize({ width: Math.round(newWidth), height: Math.round(newHeight) })
  }, [isResizing, resizeDirection, startPosition, startSize, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, showGrid, onResize])

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      setResizeDirection(null)
      
      // Remove global mouse events
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      onResizeEnd?.()
    }
  }, [isResizing, handleMouseMove, onResizeEnd])

  // Get cursor style for resize direction
  const getCursor = (direction: ResizeDirection): string => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove])

  if (!isSelected) return null

  const bounds = getElementBounds()
  if (!bounds) return null

  const handleSize = 8
  const handleOffset = handleSize / 2

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute pointer-events-none z-50"
      style={{
        left: bounds.left - handleOffset,
        top: bounds.top - handleOffset,
        width: bounds.width + handleSize,
        height: bounds.height + handleSize,
      }}
    >
      {/* Resize Handles */}
      {[
        { direction: 'nw' as ResizeDirection, className: 'top-0 left-0 cursor-nw-resize' },
        { direction: 'n' as ResizeDirection, className: 'top-0 left-1/2 -translate-x-1/2 cursor-n-resize' },
        { direction: 'ne' as ResizeDirection, className: 'top-0 right-0 cursor-ne-resize' },
        { direction: 'e' as ResizeDirection, className: 'top-1/2 right-0 -translate-y-1/2 cursor-e-resize' },
        { direction: 'se' as ResizeDirection, className: 'bottom-0 right-0 cursor-se-resize' },
        { direction: 's' as ResizeDirection, className: 'bottom-0 left-1/2 -translate-x-1/2 cursor-s-resize' },
        { direction: 'sw' as ResizeDirection, className: 'bottom-0 left-0 cursor-sw-resize' },
        { direction: 'w' as ResizeDirection, className: 'top-1/2 left-0 -translate-y-1/2 cursor-w-resize' },
      ].map(({ direction, className }) => (
        <div
          key={direction}
          className={cn(
            'absolute pointer-events-auto bg-primary border-2 border-white rounded-sm shadow-lg hover:bg-primary/80 transition-colors',
            className,
            isResizing && resizeDirection === direction && 'bg-primary/80 scale-110'
          )}
          style={{
            width: handleSize,
            height: handleSize,
          }}
          onMouseDown={(e) => handleMouseDown(direction, e)}
        />
      ))}

      {/* Size indicator */}
      {isResizing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg"
        >
          {Math.round(element.size?.width || bounds.width)} × {Math.round(element.size?.height || bounds.height)}
        </motion.div>
      )}

      {/* Grid overlay when resizing */}
      {isResizing && showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px'
          }}
        />
      )}

      {/* Aspect ratio indicator */}
      {aspectRatio && isResizing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-lg"
        >
          Ratio: {aspectRatio.toFixed(2)}
        </motion.div>
      )}
    </motion.div>
  )
}