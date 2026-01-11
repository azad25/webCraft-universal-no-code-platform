'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResizeHandlesProps {
  element: any
  isSelected: boolean
  onResize: (newSize: { width: number; height: number }) => void
  onResizeEnd?: () => void
  onPositionChange?: (newPosition: { x: number; y: number }) => void
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  showGrid?: boolean
  snapToGrid?: boolean
  gridSize?: number
  aspectRatio?: number | null
  canvasRef?: React.RefObject<HTMLElement>
  zoom?: number
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
  onPositionChange,
  minWidth = 20,
  minHeight = 20,
  maxWidth,
  maxHeight,
  snapToGrid = true,
  gridSize = 8,
  aspectRatio = null,
  canvasRef,
  zoom = 100,
  className
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [startElementPosition, setStartElementPosition] = useState({ x: 0, y: 0 })
  const [elementRect, setElementRect] = useState<DOMRect | null>(null)
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  // Find the element's DOM position and canvas rect
  useEffect(() => {
    const updateRects = () => {
      if (isSelected && element) {
        const elementNode = document.querySelector(`[data-element-id="${element.id}"]`)
        if (elementNode) {
          const rect = elementNode.getBoundingClientRect()
          setElementRect(rect)
        }
        
        // Find canvas element
        const canvas = document.querySelector('[data-canvas="true"]') || canvasRef?.current
        if (canvas) {
          setCanvasRect(canvas.getBoundingClientRect())
        }
      }
    }
    
    updateRects()
    
    // Update on scroll/resize
    window.addEventListener('scroll', updateRects, true)
    window.addEventListener('resize', updateRects)
    
    // Use RAF for smooth updates during resize/drag
    let rafId: number
    const smoothUpdate = () => {
      if (isResizing || isDragging) {
        updateRects()
        rafId = requestAnimationFrame(smoothUpdate)
      }
    }
    
    if (isResizing || isDragging) {
      rafId = requestAnimationFrame(smoothUpdate)
    }
    
    return () => {
      window.removeEventListener('scroll', updateRects, true)
      window.removeEventListener('resize', updateRects)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isSelected, element, element?.size, element?.position, canvasRef, isResizing, isDragging])

  // Snap value to grid
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }, [snapToGrid, gridSize])

  // Handle resize start
  const handleResizeStart = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setResizeDirection(direction)
    setStartSize({
      width: element.size?.width || 200,
      height: element.size?.height || 100
    })
    setStartPosition({ x: e.clientX, y: e.clientY })
    setStartElementPosition({
      x: element.position?.x || 0,
      y: element.position?.y || 0
    })

    document.body.style.cursor = getCursorForDirection(direction)
    document.body.style.userSelect = 'none'
  }, [element.size, element.position])

  // Handle drag start (for moving the element)
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onPositionChange) return

    setIsDragging(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
    setStartElementPosition({
      x: element.position?.x || 0,
      y: element.position?.y || 0
    })

    document.body.style.cursor = 'move'
    document.body.style.userSelect = 'none'
  }, [element.position, onPositionChange])

  // Handle mouse move for resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const zoomFactor = zoom / 100

    if (isResizing && resizeDirection) {
      const deltaX = (e.clientX - startPosition.x) / zoomFactor
      const deltaY = (e.clientY - startPosition.y) / zoomFactor

      let newWidth = startSize.width
      let newHeight = startSize.height
      let newX = startElementPosition.x
      let newY = startElementPosition.y

      // Calculate new dimensions and position based on resize direction
      switch (resizeDirection) {
        case 'e':
          newWidth = startSize.width + deltaX
          break
        case 'w':
          newWidth = startSize.width - deltaX
          newX = startElementPosition.x + deltaX
          break
        case 's':
          newHeight = startSize.height + deltaY
          break
        case 'n':
          newHeight = startSize.height - deltaY
          newY = startElementPosition.y + deltaY
          break
        case 'se':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height + deltaY
          break
        case 'sw':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height + deltaY
          newX = startElementPosition.x + deltaX
          break
        case 'ne':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height - deltaY
          newY = startElementPosition.y + deltaY
          break
        case 'nw':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height - deltaY
          newX = startElementPosition.x + deltaX
          newY = startElementPosition.y + deltaY
          break
      }

      // Maintain aspect ratio if specified
      if (aspectRatio && ['se', 'sw', 'ne', 'nw'].includes(resizeDirection)) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio
        } else {
          newWidth = newHeight * aspectRatio
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
      newX = snapToGridValue(Math.max(0, newX))
      newY = snapToGridValue(Math.max(0, newY))

      onResize({ width: newWidth, height: newHeight })
      
      // Update position for directions that move the element
      if (['w', 'n', 'nw', 'ne', 'sw'].includes(resizeDirection) && onPositionChange) {
        onPositionChange({ x: newX, y: newY })
      }
    }

    if (isDragging && onPositionChange) {
      const deltaX = (e.clientX - startPosition.x) / zoomFactor
      const deltaY = (e.clientY - startPosition.y) / zoomFactor

      let newX = startElementPosition.x + deltaX
      let newY = startElementPosition.y + deltaY

      // Snap to grid
      newX = snapToGridValue(Math.max(0, newX))
      newY = snapToGridValue(Math.max(0, newY))

      onPositionChange({ x: newX, y: newY })
    }
  }, [
    isResizing, isDragging, resizeDirection, startPosition, startSize, 
    startElementPosition, aspectRatio, minWidth, minHeight, maxWidth, 
    maxHeight, snapToGridValue, onResize, onPositionChange, zoom
  ])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      setResizeDirection(null)
      onResizeEnd?.()
    }
    if (isDragging) {
      setIsDragging(false)
    }
    document.body.style.cursor = 'default'
    document.body.style.userSelect = ''
  }, [isResizing, isDragging, onResizeEnd])

  // Add/remove global event listeners
  useEffect(() => {
    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, isDragging, handleMouseMove, handleMouseUp])

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

  if (!isSelected || !elementRect) return null

  const handleStyle = "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm hover:bg-blue-100 hover:scale-110 transition-all z-[9999] shadow-sm"
  const edgeHandleStyle = "absolute bg-blue-500/0 hover:bg-blue-500/20 transition-colors z-[9998]"

  return (
    <div
      ref={elementRef}
      className={cn("fixed pointer-events-none", className)}
      style={{
        left: elementRect.left,
        top: elementRect.top,
        width: elementRect.width,
        height: elementRect.height,
        zIndex: 9999
      }}
    >
      {/* Move Handle (center) - for dragging the element */}
      {onPositionChange && (
        <div
          className="absolute inset-0 cursor-move"
          style={{ pointerEvents: 'auto' }}
          onMouseDown={handleDragStart}
        />
      )}

      {/* Corner Handles */}
      <div
        className={cn(handleStyle, "cursor-nw-resize")}
        style={{ 
          pointerEvents: 'auto',
          left: -6,
          top: -6
        }}
        onMouseDown={(e) => handleResizeStart('nw', e)}
      />
      <div
        className={cn(handleStyle, "cursor-ne-resize")}
        style={{ 
          pointerEvents: 'auto',
          right: -6,
          top: -6
        }}
        onMouseDown={(e) => handleResizeStart('ne', e)}
      />
      <div
        className={cn(handleStyle, "cursor-sw-resize")}
        style={{ 
          pointerEvents: 'auto',
          left: -6,
          bottom: -6
        }}
        onMouseDown={(e) => handleResizeStart('sw', e)}
      />
      <div
        className={cn(handleStyle, "cursor-se-resize")}
        style={{ 
          pointerEvents: 'auto',
          right: -6,
          bottom: -6
        }}
        onMouseDown={(e) => handleResizeStart('se', e)}
      />

      {/* Edge Handles */}
      <div
        className={cn(edgeHandleStyle, "cursor-n-resize")}
        style={{ 
          pointerEvents: 'auto',
          left: 12,
          right: 12,
          top: -4,
          height: 8
        }}
        onMouseDown={(e) => handleResizeStart('n', e)}
      />
      <div
        className={cn(edgeHandleStyle, "cursor-s-resize")}
        style={{ 
          pointerEvents: 'auto',
          left: 12,
          right: 12,
          bottom: -4,
          height: 8
        }}
        onMouseDown={(e) => handleResizeStart('s', e)}
      />
      <div
        className={cn(edgeHandleStyle, "cursor-w-resize")}
        style={{ 
          pointerEvents: 'auto',
          top: 12,
          bottom: 12,
          left: -4,
          width: 8
        }}
        onMouseDown={(e) => handleResizeStart('w', e)}
      />
      <div
        className={cn(edgeHandleStyle, "cursor-e-resize")}
        style={{ 
          pointerEvents: 'auto',
          top: 12,
          bottom: 12,
          right: -4,
          width: 8
        }}
        onMouseDown={(e) => handleResizeStart('e', e)}
      />

      {/* Selection Border */}
      <div 
        className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
        style={{ borderRadius: 2 }}
      />

      {/* Size Indicator */}
      {(isResizing || isDragging) && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-[10000] shadow-lg font-medium">
          {isDragging ? (
            <>
              X: {Math.round(element.position?.x || 0)} Y: {Math.round(element.position?.y || 0)}
            </>
          ) : (
            <>
              {Math.round(element.size?.width || 0)} × {Math.round(element.size?.height || 0)}
            </>
          )}
        </div>
      )}

      {/* Grid Snap Indicator */}
      {snapToGrid && (isResizing || isDragging) && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap z-[10000]">
          Grid: {gridSize}px
        </div>
      )}
    </div>
  )
}