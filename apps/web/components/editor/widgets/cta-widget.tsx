'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

interface CTAWidgetProps {
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundColor?: string
  backgroundGradient?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function CTAWidget({
  title = 'Ready to Get Started?',
  description = 'Join thousands of creators building amazing websites with our platform. Start your free trial today.',
  primaryButtonText = 'Start Free Trial',
  primaryButtonLink = '#',
  secondaryButtonText = 'Talk to Sales',
  secondaryButtonLink = '#',
  backgroundColor,
  backgroundGradient = true,
  isEditing,
  isPreview,
  onChange
}: CTAWidgetProps) {
  return (
    <section
      className={cn(
        "w-full py-20 px-6",
        backgroundGradient && "bg-gradient-to-r from-primary to-primary/80"
      )}
      style={!backgroundGradient && backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Limited Time Offer
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 text-base px-8"
              asChild
            >
              <a href={primaryButtonLink}>
                {primaryButtonText}
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            {secondaryButtonText && (
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base px-8 bg-transparent text-white border-white/30 hover:bg-white/10"
                asChild
              >
                <a href={secondaryButtonLink}>{secondaryButtonText}</a>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
