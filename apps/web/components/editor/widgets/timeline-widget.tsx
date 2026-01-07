'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Circle } from 'lucide-react'

interface TimelineItem {
  title: string
  description: string
  date?: string
  icon?: string
  status?: 'completed' | 'current' | 'upcoming'
}

interface TimelineWidgetProps {
  title?: string
  items?: TimelineItem[]
  layout?: 'vertical' | 'horizontal' | 'alternating'
  showConnector?: boolean
  accentColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function TimelineWidget({
  title,
  items = [
    { title: 'Project Started', description: 'Initial planning and research phase', date: 'Jan 2024', status: 'completed' },
    { title: 'Design Phase', description: 'UI/UX design and prototyping', date: 'Feb 2024', status: 'completed' },
    { title: 'Development', description: 'Building the core features', date: 'Mar 2024', status: 'current' },
    { title: 'Testing', description: 'Quality assurance and bug fixes', date: 'Apr 2024', status: 'upcoming' },
    { title: 'Launch', description: 'Public release and marketing', date: 'May 2024', status: 'upcoming' }
  ],
  layout = 'vertical',
  showConnector = true,
  accentColor = '#3b82f6',
  isEditing,
  isPreview,
  onChange
}: TimelineWidgetProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />
      case 'current':
        return <Circle className="w-3 h-3 fill-current" />
      default:
        return <Circle className="w-3 h-3" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return accentColor
      case 'current':
        return accentColor
      default:
        return '#9ca3af'
    }
  }

  const renderVertical = () => (
    <div className="relative">
      {showConnector && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
      )}
      <div className="space-y-8">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-6"
          >
            {/* Icon */}
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {getStatusIcon(item.status)}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              {item.date && (
                <span className="text-sm text-muted-foreground">{item.date}</span>
              )}
              <h3 className="text-lg font-semibold mt-1">{item.title}</h3>
              <p className="text-muted-foreground mt-1">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderAlternating = () => (
    <div className="relative">
      {showConnector && (
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted -translate-x-1/2" />
      )}
      <div className="space-y-12">
        {items.map((item, index) => {
          const isLeft = index % 2 === 0
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex items-center gap-8",
                isLeft ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Content */}
              <div className={cn("flex-1", isLeft ? "text-right" : "text-left")}>
                {item.date && (
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                )}
                <h3 className="text-lg font-semibold mt-1">{item.title}</h3>
                <p className="text-muted-foreground mt-1">{item.description}</p>
              </div>
              
              {/* Icon */}
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {getStatusIcon(item.status)}
              </div>
              
              {/* Spacer */}
              <div className="flex-1" />
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  const renderHorizontal = () => (
    <div className="relative overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max px-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col items-center w-48"
          >
            {/* Connector */}
            {showConnector && index < items.length - 1 && (
              <div 
                className="absolute top-4 left-1/2 w-full h-0.5 bg-muted"
                style={{ left: '50%' }}
              />
            )}
            
            {/* Icon */}
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white mb-4"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {getStatusIcon(item.status)}
            </div>
            
            {/* Content */}
            <div className="text-center">
              {item.date && (
                <span className="text-sm text-muted-foreground">{item.date}</span>
              )}
              <h3 className="font-semibold mt-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{title}</h2>
        )}
        
        {layout === 'vertical' && renderVertical()}
        {layout === 'alternating' && renderAlternating()}
        {layout === 'horizontal' && renderHorizontal()}
      </div>
    </section>
  )
}
