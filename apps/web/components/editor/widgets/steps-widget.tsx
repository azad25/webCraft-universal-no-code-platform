'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description: string
  icon?: string
}

interface StepsWidgetProps {
  title?: string
  subtitle?: string
  steps?: Step[]
  layout?: 'horizontal' | 'vertical' | 'cards'
  showNumbers?: boolean
  accentColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function StepsWidget({
  title = 'How It Works',
  subtitle = 'Get started in just a few simple steps',
  steps = [
    { title: 'Sign Up', description: 'Create your free account in seconds. No credit card required.' },
    { title: 'Choose Template', description: 'Pick from hundreds of professionally designed templates.' },
    { title: 'Customize', description: 'Use our drag-and-drop editor to make it your own.' },
    { title: 'Publish', description: 'Go live with one click and share with the world.' }
  ],
  layout = 'horizontal',
  showNumbers = true,
  accentColor = '#3b82f6',
  isEditing,
  isPreview,
  onChange
}: StepsWidgetProps) {
  const renderHorizontal = () => (
    <div className="relative">
      {/* Connector Line */}
      <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-muted" style={{ left: '10%', right: '10%' }} />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative text-center"
          >
            {/* Number */}
            {showNumbers && (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 relative z-10"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderVertical = () => (
    <div className="relative max-w-2xl mx-auto">
      {/* Connector Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted" />
      
      <div className="space-y-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-6"
          >
            {/* Number */}
            {showNumbers && (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 relative z-10"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </div>
            )}
            
            <div className="pt-3">
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative p-6 bg-card rounded-2xl border hover:shadow-lg transition-shadow"
        >
          {/* Number Badge */}
          {showNumbers && (
            <div
              className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {index + 1}
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-2 mt-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {/* Arrow to next */}
          {index < steps.length - 1 && (
            <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              →
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )

  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        {layout === 'horizontal' && renderHorizontal()}
        {layout === 'vertical' && renderVertical()}
        {layout === 'cards' && renderCards()}
      </div>
    </section>
  )
}
