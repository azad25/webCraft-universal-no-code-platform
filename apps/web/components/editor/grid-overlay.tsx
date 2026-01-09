'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface GridOverlayProps {
  gridSize?: number
  showMajorLines?: boolean
  majorLineInterval?: number
  className?: string
}

export function GridOverlay({ 
  gridSize = 8, 
  showMajorLines = true, 
  majorLineInterval = 10,
  className 
}: GridOverlayProps) {
  const majorGridSize = gridSize * majorLineInterval

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Minor Grid Lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`
        }}
      />
      
      {/* Major Grid Lines */}
      {showMajorLines && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${majorGridSize}px ${majorGridSize}px`
          }}
        />
      )}

      {/* Center Lines */}
      <div className="absolute inset-0">
        {/* Vertical Center Line */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-blue-400/30"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        />
        {/* Horizontal Center Line */}
        <div 
          className="absolute left-0 right-0 h-px bg-blue-400/30"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      </div>

      {/* Grid Size Indicator */}
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Grid: {gridSize}px
      </div>
    </div>
  )
}