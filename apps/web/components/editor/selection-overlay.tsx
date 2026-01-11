'use client'

import { useState, useRef, useCallback } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SelectionOverlayProps {
  element: any
  onMove: (position: { x: number; y: number }) => void
  onResize: (size: { width: number; height: number }) => void
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export function SelectionOverlay({ element, onMove, onResize }: SelectionOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })
  const startElementPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: ResizeHandle) => {
    e.stopPropagation()
    e.preventDefault()

    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { width: element.size.width, height: element.size.height }
    startElementPos.current = { x: element.position.x, y: element.position.y }

    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
    } else {
      setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y

      if (handle) {
        let newWidth = startSize.current.width
        let newHeight = startSize.current.height
        let newX = startElementPos.current.x
        let newY = startElementPos.current.y

        switch (handle) {
          case 'e':
            newWidth = Math.max(50, startSize.current.width + deltaX)
            break
          case 'w':
            newWidth = Math.max(50, startSize.current.width - deltaX)
            newX = startElementPos.current.x + deltaX
            break
          case 's':
            newHeight = Math.max(50, startSize.current.height + deltaY)
            break
          case 'n':
            newHeight = Math.max(50, startSize.current.height - deltaY)
            newY = startElementPos.current.y + deltaY
            break
          case 'se':
            newWidth = Math.max(50, startSize.current.width + deltaX)
            newHeight = Math.max(50, startSize.current.height + deltaY)
            break
          case 'sw':
            newWidth = Math.max(50, startSize.current.width - deltaX)
            newHeight = Math.max(50, startSize.current.height + deltaY)
            newX = startElementPos.current.x + deltaX
            break
          case 'ne':
            newWidth = Math.max(50, startSize.current.width + deltaX)
            newHeight = Math.max(50, startSize.current.height - deltaY)
            newY = startElementPos.current.y + deltaY
            break
          case 'nw':
            newWidth = Math.max(50, startSize.current.width - deltaX)
            newHeight = Math.max(50, startSize.current.height - deltaY)
            newX = startElementPos.current.x + deltaX
            newY = startElementPos.current.y + deltaY
            break
        }

        onResize({ width: newWidth, height: newHeight })
        if (newX !== startElementPos.current.x || newY !== startElementPos.current.y) {
          onMove({ x: newX, y: newY })
        }
      } else {
        onMove({
          x: startElementPos.current.x + deltaX,
          y: startElementPos.current.y + deltaY
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [element, onMove, onResize])

  const handles: { position: ResizeHandle; className: string; cursor: string }[] = [
    { position: 'nw', className: '-top-1.5 -left-1.5', cursor: 'nw-resize' },
    { position: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2', cursor: 'n-resize' },
    { position: 'ne', className: '-top-1.5 -right-1.5', cursor: 'ne-resize' },
    { position: 'e', className: 'top-1/2 -right-1.5 -translate-y-1/2', cursor: 'e-resize' },
    { position: 'se', className: '-bottom-1.5 -right-1.5', cursor: 'se-resize' },
    { position: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2', cursor: 's-resize' },
    { position: 'sw', className: '-bottom-1.5 -left-1.5', cursor: 'sw-resize' },
    { position: 'w', className: 'top-1/2 -left-1.5 -translate-y-1/2', cursor: 'w-resize' }
  ]

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height
      }}
    >
      {/* Selection border */}
      <div className="absolute inset-0 border-2 border-primary rounded pointer-events-auto cursor-move"
        onMouseDown={(e) => handleMouseDown(e)}
      />

      {/* Resize handles */}
      {handles.map(({ position, className, cursor }) => (
        <div
          key={position}
          className={cn(
            "absolute w-3 h-3 bg-primary border-2 border-white rounded-full pointer-events-auto",
            className
          )}
          style={{ cursor }}
          onMouseDown={(e) => handleMouseDown(e, position)}
        />
      ))}
    </div>
  )
}
