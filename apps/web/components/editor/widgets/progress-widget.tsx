'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressItem {
  label: string
  value: number
  color?: string
}

interface ProgressWidgetProps {
  title?: string
  items?: ProgressItem[]
  style?: 'bar' | 'circle' | 'semicircle'
  showPercentage?: boolean
  animated?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function ProgressWidget({
  title,
  items = [
    { label: 'Web Development', value: 95, color: '#3b82f6' },
    { label: 'UI/UX Design', value: 88, color: '#8b5cf6' },
    { label: 'Mobile Apps', value: 75, color: '#10b981' },
    { label: 'Cloud Services', value: 82, color: '#f59e0b' }
  ],
  style = 'bar',
  showPercentage = true,
  animated = true,
  isEditing,
  isPreview,
  onChange
}: ProgressWidgetProps) {
  const [isVisible, setIsVisible] = useState(!animated)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    }
  }, [animated])

  const renderBar = (item: ProgressItem, index: number) => (
    <div key={index} className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{item.label}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{item.value}%</span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: item.color || '#3b82f6' }}
          initial={{ width: 0 }}
          animate={{ width: isVisible ? `${item.value}%` : 0 }}
          transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )

  const renderCircle = (item: ProgressItem, index: number) => {
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (item.value / 100) * circumference

    return (
      <div key={index} className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={item.color || '#3b82f6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isVisible ? strokeDashoffset : circumference }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{item.value}%</span>
            </div>
          )}
        </div>
        <span className="mt-3 font-medium text-sm text-center">{item.label}</span>
      </div>
    )
  }

  const renderSemicircle = (item: ProgressItem, index: number) => {
    const circumference = Math.PI * 45
    const strokeDashoffset = circumference - (item.value / 100) * circumference

    return (
      <div key={index} className="flex flex-col items-center">
        <div className="relative w-32 h-16 overflow-hidden">
          <svg className="w-full h-32 transform rotate-180" viewBox="0 0 100 50">
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={item.color || '#3b82f6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isVisible ? strokeDashoffset : circumference }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
            />
          </svg>
          {showPercentage && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold">{item.value}%</span>
            </div>
          )}
        </div>
        <span className="mt-2 font-medium text-sm text-center">{item.label}</span>
      </div>
    )
  }

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{title}</h2>
        )}
        
        {style === 'bar' && (
          <div className="space-y-6">
            {items.map((item, index) => renderBar(item, index))}
          </div>
        )}
        
        {style === 'circle' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {items.map((item, index) => renderCircle(item, index))}
          </div>
        )}
        
        {style === 'semicircle' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {items.map((item, index) => renderSemicircle(item, index))}
          </div>
        )}
      </div>
    </section>
  )
}
