'use client'

import { useRef, useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink, Download, Play, Mail, Phone } from 'lucide-react'
import { WidgetContainer, BaseWidgetProps, useInlineEditing } from './widget-base'

interface ButtonWidgetProps extends BaseWidgetProps {
  text?: string
  link?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  icon?: 'none' | 'arrow' | 'external' | 'download' | 'play' | 'mail' | 'phone'
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  alignment?: 'left' | 'center' | 'right'
  buttonBackgroundColor?: string
  buttonTextColor?: string
  buttonBorderColor?: string
  buttonBorderRadius?: string
  buttonPadding?: string
  hoverBackgroundColor?: string
  hoverTextColor?: string
}

const ICONS = {
  none: null,
  arrow: ArrowRight,
  external: ExternalLink,
  download: Download,
  play: Play,
  mail: Mail,
  phone: Phone
}

export function EnhancedButtonWidget({
  text = 'Click Me',
  link = '#',
  variant = 'default',
  size = 'default',
  icon = 'none',
  iconPosition = 'right',
  fullWidth = false,
  alignment = 'left',
  buttonBackgroundColor,
  buttonTextColor,
  buttonBorderColor,
  buttonBorderRadius,
  buttonPadding,
  hoverBackgroundColor,
  hoverTextColor,
  isEditing,
  isPreview,
  isSelected,
  elementId,
  onChange,
  onStyleChange,
  ...styleProps
}: ButtonWidgetProps) {
  const IconComponent = ICONS[icon]
  
  const {
    isEditing: inlineEditing,
    localValue,
    ref: textRef,
    editableProps
  } = useInlineEditing(text, (value) => onChange?.({ text: value }), isSelected, isPreview)

  const buttonStyle = {
    backgroundColor: buttonBackgroundColor,
    color: buttonTextColor,
    borderColor: buttonBorderColor,
    borderRadius: buttonBorderRadius,
    padding: buttonPadding,
  }

  // Remove undefined values
  Object.keys(buttonStyle).forEach(key => {
    if (buttonStyle[key as keyof typeof buttonStyle] === undefined) {
      delete buttonStyle[key as keyof typeof buttonStyle]
    }
  })

  return (
    <WidgetContainer
      {...styleProps}
      className={cn(
        "py-4 px-4",
        alignment === 'center' && "text-center",
        alignment === 'right' && "text-right"
      )}
    >
      <m.div
        whileHover={!inlineEditing && !isEditing ? { scale: 1.02 } : undefined}
        whileTap={!inlineEditing && !isEditing ? { scale: 0.98 } : undefined}
        className={cn(fullWidth ? "w-full" : "inline-block")}
      >
        <Button
          variant={variant}
          size={size}
          className={cn(
            "gap-2 relative transition-all",
            fullWidth && "w-full",
            (inlineEditing || isEditing) && "cursor-text",
            isSelected && !inlineEditing && "ring-2 ring-primary/50"
          )}
          style={buttonStyle}
          onClick={(e) => {
            if (inlineEditing || isEditing) {
              e.preventDefault()
            }
          }}
          asChild={!inlineEditing && !isEditing}
        >
          {inlineEditing ? (
            <span className="flex items-center gap-2">
              {IconComponent && iconPosition === 'left' && (
                <IconComponent className="w-4 h-4 flex-shrink-0" />
              )}
              <span
                ref={textRef as any}
                className="outline-none min-w-[20px]"
                {...editableProps}
              >
                {localValue}
              </span>
              {IconComponent && iconPosition === 'right' && (
                <IconComponent className="w-4 h-4 flex-shrink-0" />
              )}
            </span>
          ) : (
            <a href={isPreview ? link : '#'} className="flex items-center gap-2">
              {IconComponent && iconPosition === 'left' && (
                <IconComponent className="w-4 h-4" />
              )}
              <span>{localValue}</span>
              {IconComponent && iconPosition === 'right' && (
                <IconComponent className="w-4 h-4" />
              )}
            </a>
          )}
        </Button>
      </m.div>
    </WidgetContainer>
  )
}