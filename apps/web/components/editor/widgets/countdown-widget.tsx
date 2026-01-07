'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CountdownWidgetProps {
  targetDate?: string
  title?: string
  subtitle?: string
  showDays?: boolean
  showHours?: boolean
  showMinutes?: boolean
  showSeconds?: boolean
  style?: 'cards' | 'minimal' | 'circles'
  backgroundColor?: string
  textColor?: string
  accentColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function CountdownWidget({
  targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  title = 'Coming Soon',
  subtitle = 'Something amazing is on the way',
  showDays = true,
  showHours = true,
  showMinutes = true,
  showSeconds = true,
  style = 'cards',
  backgroundColor = 'transparent',
  textColor,
  accentColor = '#3b82f6',
  isEditing,
  isPreview,
  onChange
}: CountdownWidgetProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, show: showDays },
    { label: 'Hours', value: timeLeft.hours, show: showHours },
    { label: 'Minutes', value: timeLeft.minutes, show: showMinutes },
    { label: 'Seconds', value: timeLeft.seconds, show: showSeconds }
  ].filter(u => u.show)

  const renderCards = () => (
    <div className="flex justify-center gap-4">
      {timeUnits.map((unit, index) => (
        <motion.div
          key={unit.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="text-center"
        >
          <div 
            className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-bold mb-2"
            style={{ backgroundColor: accentColor, color: 'white' }}
          >
            {String(unit.value).padStart(2, '0')}
          </div>
          <span className="text-sm text-muted-foreground">{unit.label}</span>
        </motion.div>
      ))}
    </div>
  )

  const renderMinimal = () => (
    <div className="flex justify-center items-center gap-2 text-4xl md:text-6xl font-bold">
      {timeUnits.map((unit, index) => (
        <span key={unit.label} className="flex items-center">
          <span style={{ color: accentColor }}>{String(unit.value).padStart(2, '0')}</span>
          {index < timeUnits.length - 1 && <span className="mx-2 text-muted-foreground">:</span>}
        </span>
      ))}
    </div>
  )

  const renderCircles = () => (
    <div className="flex justify-center gap-6">
      {timeUnits.map((unit, index) => {
        const max = unit.label === 'Days' ? 365 : unit.label === 'Hours' ? 24 : 60
        const percentage = (unit.value / max) * 100
        const circumference = 2 * Math.PI * 45
        const strokeDashoffset = circumference - (percentage / 100) * circumference

        return (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative w-24 h-24 md:w-28 md:h-28"
          >
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/20"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{String(unit.value).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">{unit.label}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <section 
      className="w-full py-16 px-6"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {title}
          </motion.h2>
        )}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-8"
          >
            {subtitle}
          </motion.p>
        )}
        
        {style === 'cards' && renderCards()}
        {style === 'minimal' && renderMinimal()}
        {style === 'circles' && renderCircles()}
      </div>
    </section>
  )
}
