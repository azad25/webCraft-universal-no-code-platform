'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageWidgetProps {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  borderRadius?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  caption?: string
  link?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const SHADOW_CLASSES = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
}

export function ImageWidget({
  src,
  alt = 'Image',
  width = '100%',
  height = 400,
  objectFit = 'cover',
  borderRadius = '8px',
  shadow = 'md',
  caption,
  link,
  isEditing,
  isPreview,
  onChange
}: ImageWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleImageUpload = () => {
    // In a real app, this would open a file picker or media library
    const newSrc = prompt('Enter image URL:', src)
    if (newSrc && onChange) {
      onChange({ src: newSrc })
    }
  }

  const imageContent = (
    <figure className="relative w-full">
      {src ? (
        <motion.div
          className={cn(
            "relative overflow-hidden",
            SHADOW_CLASSES[shadow]
          )}
          style={{ borderRadius }}
          whileHover={!isPreview ? { scale: 1.02 } : undefined}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={src}
            alt={alt}
            className="w-full"
            style={{
              width: typeof width === 'number' ? `${width}px` : width,
              height: typeof height === 'number' ? `${height}px` : height,
              objectFit
            }}
          />
          
          {/* Edit Overlay */}
          {isEditing && isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Button onClick={handleImageUpload} variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30",
            SHADOW_CLASSES[shadow]
          )}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius
          }}
        >
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No image selected</p>
          {isEditing && (
            <Button size="sm" variant="secondary" onClick={handleImageUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
      )}
      
      {/* Caption */}
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  )

  if (link && !isEditing) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {imageContent}
      </a>
    )
  }

  return imageContent
}
