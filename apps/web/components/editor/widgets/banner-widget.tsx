'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, Sparkles, AlertCircle, Info, CheckCircle } from 'lucide-react'

interface BannerWidgetProps {
  text?: string
  buttonText?: string
  buttonLink?: string
  type?: 'info' | 'success' | 'warning' | 'promo'
  dismissible?: boolean
  position?: 'top' | 'inline'
  showIcon?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-500',
    icon: Info
  },
  success: {
    bg: 'bg-green-500',
    icon: CheckCircle
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: AlertCircle
  },
  promo: {
    bg: 'bg-gradient-to-r from-purple-600 to-pink-600',
    icon: Sparkles
  }
}

export function BannerWidget({
  text = '🎉 Special offer! Get 50% off your first month with code WELCOME50',
  buttonText = 'Get Started',
  buttonLink = '#',
  type = 'promo',
  dismissible = true,
  position = 'inline',
  showIcon = true,
  isEditing,
  isPreview,
  onChange
}: BannerWidgetProps) {
  const [isVisible, setIsVisible] = useState(true)

  const typeStyle = TYPE_STYLES[type]
  const Icon = typeStyle.icon

  if (!isVisible && !isEditing) return null

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 0 }}
        className={cn(
          "w-full py-3 px-4 text-white",
          typeStyle.bg,
          position === 'top' && "fixed top-0 left-0 right-0 z-50"
        )}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          {showIcon && (
            <Icon className="w-5 h-5 shrink-0" />
          )}
          
          <p className="text-sm md:text-base font-medium text-center">
            {text}
          </p>
          
          {buttonText && (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              asChild
            >
              <a href={buttonLink}>
                {buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
          
          {dismissible && (
            <button
              onClick={() => !isEditing && setIsVisible(false)}
              className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </m.div>
    </AnimatePresence>
  )
}
