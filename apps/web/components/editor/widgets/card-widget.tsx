'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardWidgetProps {
  title?: string
  description?: string
  image?: string
  buttonText?: string
  buttonUrl?: string
  backgroundColor?: string
  borderRadius?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function CardWidget({
  title = 'Card Title',
  description = 'This is a description for the card. Add your content here.',
  image,
  buttonText = 'Learn More',
  buttonUrl = '#',
  backgroundColor = '#ffffff',
  borderRadius = '12px',
  shadow = 'md',
  isEditing = false,
  onChange
}: CardWidgetProps) {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  return (
    <motion.div
      className={cn(
        "w-full h-full overflow-hidden border",
        shadowClasses[shadow]
      )}
      style={{ backgroundColor, borderRadius }}
      whileHover={{ y: isEditing ? 0 : -4 }}
      transition={{ duration: 0.2 }}
    >
      {image && (
        <div className="w-full h-40 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        {buttonText && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => !isEditing && buttonUrl && window.open(buttonUrl, '_blank')}
          >
            {buttonText}
          </button>
        )}
      </div>
    </motion.div>
  )
}
