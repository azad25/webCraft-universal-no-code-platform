'use client'

import { motion } from 'framer-motion'

interface DropIndicatorProps {
  y: number
  width: number
}

export function DropIndicator({ y, width }: DropIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.8 }}
      className="absolute left-0 right-0 z-50 pointer-events-none"
      style={{ top: y }}
    >
      <div className="relative">
        {/* Line */}
        <div className="h-0.5 bg-primary rounded-full" style={{ width }} />
        
        {/* Dots at ends */}
        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full" />
        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full" />
        
        {/* Label */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
          Drop here
        </div>
      </div>
    </motion.div>
  )
}
