'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'

interface HeroWidgetProps {
  title?: string
  subtitle?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundImage?: string
  backgroundColor?: string
  backgroundOverlay?: number
  alignment?: 'left' | 'center' | 'right'
  layout?: 'simple' | 'split' | 'video'
  showBadge?: boolean
  badgeText?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function HeroWidget({
  title = 'Build Something Amazing',
  subtitle = 'The modern way to create',
  description = 'Create beautiful websites, apps, and digital experiences with our powerful no-code platform. No coding required.',
  primaryButtonText = 'Get Started',
  primaryButtonLink = '#',
  secondaryButtonText = 'Watch Demo',
  secondaryButtonLink = '#',
  backgroundImage,
  backgroundColor = 'transparent',
  backgroundOverlay = 0.5,
  alignment = 'center',
  layout = 'simple',
  showBadge = true,
  badgeText = '✨ New Feature Available',
  isEditing,
  isPreview,
  onChange
}: HeroWidgetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)

  // Inline editing handlers
  const handleTitleBlur = () => {
    if (titleRef.current && onChange) {
      onChange({ title: titleRef.current.innerText })
    }
  }

  const handleDescBlur = () => {
    if (descRef.current && onChange) {
      onChange({ description: descRef.current.innerText })
    }
  }

  return (
    <section
      className={cn(
        "relative w-full min-h-[600px] flex items-center overflow-hidden",
        alignment === 'center' && "text-center",
        alignment === 'left' && "text-left",
        alignment === 'right' && "text-right"
      )}
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Overlay */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-black z-0"
          style={{ opacity: backgroundOverlay }}
        />
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "max-w-3xl",
            alignment === 'center' && "mx-auto",
            alignment === 'right' && "ml-auto"
          )}
        >
          {/* Badge */}
          {showBadge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {badgeText}
              </span>
            </motion.div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-primary font-semibold text-lg mb-4"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Title */}
          <motion.h1
            ref={titleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight",
              backgroundImage ? "text-white" : "text-foreground",
              isEditing && "outline-none ring-2 ring-primary/50 rounded px-2"
            )}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
          >
            {title}
          </motion.h1>

          {/* Description */}
          <motion.p
            ref={descRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "text-lg md:text-xl mb-8 leading-relaxed",
              backgroundImage ? "text-white/80" : "text-muted-foreground",
              isEditing && "outline-none ring-2 ring-primary/50 rounded px-2"
            )}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleDescBlur}
          >
            {description}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "flex flex-wrap gap-4",
              alignment === 'center' && "justify-center",
              alignment === 'right' && "justify-end"
            )}
          >
            <Button size="lg" className="gap-2 text-base px-8 h-12">
              {primaryButtonText}
              <ArrowRight className="w-4 h-4" />
            </Button>
            {secondaryButtonText && (
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                <Play className="w-4 h-4" />
                {secondaryButtonText}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
