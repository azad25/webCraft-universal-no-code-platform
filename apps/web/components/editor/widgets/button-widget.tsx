'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink, Download, Play, Mail, Phone } from 'lucide-react'

interface ButtonWidgetProps {
  text?: string
  link?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  icon?: 'none' | 'arrow' | 'external' | 'download' | 'play' | 'mail' | 'phone'
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  alignment?: 'left' | 'center' | 'right'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
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

export function ButtonWidget({
  text = 'Click Me',
  link = '#',
  variant = 'default',
  size = 'default',
  icon = 'none',
  iconPosition = 'right',
  fullWidth = false,
  alignment = 'left',
  isEditing,
  isPreview,
  onChange
}: ButtonWidgetProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const IconComponent = ICONS[icon]

  const handleBlur = () => {
    if (textRef.current && onChange) {
      onChange({ text: textRef.current.innerText })
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault()
    }
  }

  return (
    <div
      className={cn(
        "py-4 px-4",
        alignment === 'center' && "text-center",
        alignment === 'right' && "text-right"
      )}
    >
      <motion.div
        whileHover={!isEditing ? { scale: 1.02 } : undefined}
        whileTap={!isEditing ? { scale: 0.98 } : undefined}
        className={cn(fullWidth ? "w-full" : "inline-block")}
      >
        <Button
          variant={variant}
          size={size}
          className={cn(
            "gap-2",
            fullWidth && "w-full",
            isEditing && "cursor-text"
          )}
          onClick={handleClick}
          asChild={!isEditing}
        >
          {isEditing ? (
            <span className="flex items-center gap-2">
              {IconComponent && iconPosition === 'left' && (
                <IconComponent className="w-4 h-4" />
              )}
              <span
                ref={textRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                className="outline-none"
              >
                {text}
              </span>
              {IconComponent && iconPosition === 'right' && (
                <IconComponent className="w-4 h-4" />
              )}
            </span>
          ) : (
            <a href={link}>
              {IconComponent && iconPosition === 'left' && (
                <IconComponent className="w-4 h-4" />
              )}
              {text}
              {IconComponent && iconPosition === 'right' && (
                <IconComponent className="w-4 h-4" />
              )}
            </a>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
