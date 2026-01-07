'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Stat {
  value: number
  suffix?: string
  prefix?: string
  label: string
}

interface StatsWidgetProps {
  title?: string
  stats?: Stat[]
  backgroundColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' })
    return controls.stop
  }, [count, value])

  return (
    <motion.span ref={ref}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

export function StatsWidget({
  title,
  stats = [
    { value: 50000, suffix: '+', label: 'Active Users' },
    { value: 99, suffix: '%', label: 'Uptime' },
    { value: 200, suffix: '+', label: 'Templates' },
    { value: 24, suffix: '/7', label: 'Support' }
  ],
  backgroundColor = 'transparent',
  isEditing,
  isPreview,
  onChange
}: StatsWidgetProps) {
  return (
    <section
      className="w-full py-16 px-6"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            {title}
          </h2>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <AnimatedNumber 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  prefix={stat.prefix} 
                />
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
