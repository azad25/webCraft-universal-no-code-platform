'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface RulerOverlayProps {
  zoom?: number
  className?: string
}

export function RulerOverlay({ zoom = 100, className }: RulerOverlayProps) {
  const scale = zoom / 100
  const rulerHeight = 20
  const rulerWidth = 20
  const majorTickInterval = 100 // Major ticks every 100px
  const minorTickInterval = 10  // Minor ticks every 10px

  // Calculate visible area
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800

  const renderTicks = (isHorizontal: boolean, length: number) => {
    const ticks = []
    const tickCount = Math.ceil(length / (minorTickInterval * scale))

    for (let i = 0; i <= tickCount; i++) {
      const position = i * minorTickInterval * scale
      const isMajor = i % (majorTickInterval / minorTickInterval) === 0
      const tickSize = isMajor ? (isHorizontal ? 12 : 12) : (isHorizontal ? 6 : 6)
      
      if (isHorizontal) {
        ticks.push(
          <g key={i}>
            <line
              x1={position}
              y1={rulerHeight - tickSize}
              x2={position}
              y2={rulerHeight}
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1"
            />
            {isMajor && position > 0 && (
              <text
                x={position}
                y={rulerHeight - tickSize - 2}
                fontSize="10"
                fill="rgba(0,0,0,0.8)"
                textAnchor="middle"
                dominantBaseline="bottom"
              >
                {Math.round(position / scale)}
              </text>
            )}
          </g>
        )
      } else {
        ticks.push(
          <g key={i}>
            <line
              x1={rulerWidth - tickSize}
              y1={position}
              x2={rulerWidth}
              y2={position}
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1"
            />
            {isMajor && position > 0 && (
              <text
                x={rulerWidth - tickSize - 2}
                y={position}
                fontSize="10"
                fill="rgba(0,0,0,0.8)"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {Math.round(position / scale)}
              </text>
            )}
          </g>
        )
      }
    }

    return ticks
  }

  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Horizontal Ruler */}
      <div 
        className="absolute top-0 left-0 right-0 bg-gray-100 border-b border-gray-300"
        style={{ height: rulerHeight }}
      >
        <svg
          width="100%"
          height={rulerHeight}
          className="absolute inset-0"
        >
          {renderTicks(true, viewportWidth)}
        </svg>
      </div>

      {/* Vertical Ruler */}
      <div 
        className="absolute top-0 left-0 bottom-0 bg-gray-100 border-r border-gray-300"
        style={{ width: rulerWidth }}
      >
        <svg
          width={rulerWidth}
          height="100%"
          className="absolute inset-0"
        >
          {renderTicks(false, viewportHeight)}
        </svg>
      </div>

      {/* Corner */}
      <div 
        className="absolute top-0 left-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center"
        style={{ width: rulerWidth, height: rulerHeight }}
      >
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
      </div>

      {/* Zoom Indicator */}
      <div className="absolute top-1 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
        {zoom}%
      </div>
    </div>
  )
}