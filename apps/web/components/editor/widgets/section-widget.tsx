'use client'

import { useState, useRef, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionWidgetProps {
  backgroundColor?: string
  backgroundImage?: string
  backgroundOverlay?: string
  padding?: string
  minHeight?: string
  alignment?: 'left' | 'center' | 'right'
  children?: React.ReactNode
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function SectionWidget({
  backgroundColor = 'transparent',
  backgroundImage,
  backgroundOverlay = 'rgba(0,0,0,0)',
  padding = '80px 40px',
  minHeight = '400px',
  alignment = 'center',
  children,
  isEditing,
  isPreview,
  onChange
}: SectionWidgetProps) {
  return (
    <section
      className={cn(
        "relative w-full",
        alignment === 'center' && "text-center",
        alignment === 'left' && "text-left",
        alignment === 'right' && "text-right"
      )}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding,
        minHeight
      }}
    >
      {/* Background Overlay */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-0"
          style={{ backgroundColor: backgroundOverlay }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {children || (
          <div className="text-muted-foreground py-20">
            <p>Empty Section - Add content or drag widgets here</p>
          </div>
        )}
      </div>
    </section>
  )
}
