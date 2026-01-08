'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ImageIcon, Upload, Edit, Link as LinkIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
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
  isSelected,
  elementId,
  onChange,
  onStyleChange
}: ImageWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showEditPopover, setShowEditPopover] = useState(false)
  const [localSrc, setLocalSrc] = useState(src)
  const [localAlt, setLocalAlt] = useState(alt)
  const [localCaption, setLocalCaption] = useState(caption)
  const [inlineEditingCaption, setInlineEditingCaption] = useState(false)
  const captionRef = useRef<HTMLElement>(null)

  // Update local values when props change
  useEffect(() => {
    setLocalSrc(src)
    setLocalAlt(alt)
    setLocalCaption(caption)
  }, [src, alt, caption])

  const handleImageUpload = () => {
    // In a real app, this would open a file picker or media library
    const newSrc = prompt('Enter image URL:', localSrc)
    if (newSrc !== null && onChange) {
      setLocalSrc(newSrc)
      onChange({ src: newSrc })
    }
  }

  const handleImageChange = (newSrc: string) => {
    setLocalSrc(newSrc)
    if (onChange) {
      onChange({ src: newSrc })
    }
  }

  const handleAltChange = (newAlt: string) => {
    setLocalAlt(newAlt)
    if (onChange) {
      onChange({ alt: newAlt })
    }
  }

  const handleCaptionBlur = () => {
    if (captionRef.current && onChange) {
      const newCaption = captionRef.current.innerText
      setLocalCaption(newCaption)
      onChange({ caption: newCaption })
      setInlineEditingCaption(false)
    }
  }

  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      captionRef.current?.blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalCaption(caption || '') // Reset to original
      captionRef.current?.blur()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreview) return
    e.preventDefault()
    e.stopPropagation()
    setShowEditPopover(true)
  }

  // Start editing when Enter is pressed on selected element
  useEffect(() => {
    if (isSelected && !isPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !showEditPopover) {
          e.preventDefault()
          setShowEditPopover(true)
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isPreview, showEditPopover])

  const imageContent = (
    <figure className="relative w-full group">
      {localSrc ? (
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
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={localSrc}
            alt={localAlt}
            className="w-full cursor-pointer"
            style={{
              width: typeof width === 'number' ? `${width}px` : width,
              height: typeof height === 'number' ? `${height}px` : height,
              objectFit
            }}
          />
          
          {/* Edit Overlay */}
          {!isPreview && (isHovered || isSelected) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
            >
              <Button variant="secondary" size="sm" onClick={handleImageUpload}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/80 transition-colors",
            SHADOW_CLASSES[shadow],
            isSelected && "border-primary"
          )}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            borderRadius
          }}
          onClick={!isPreview ? handleImageUpload : undefined}
          onDoubleClick={handleDoubleClick}
        >
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No image selected</p>
          {!isPreview && (
            <Button size="sm" variant="secondary" onClick={handleImageUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>
      )}
      
      {/* Caption */}
      {(localCaption || inlineEditingCaption || (!isPreview && isSelected)) && (
        <figcaption 
          ref={captionRef as any}
          className={cn(
            "text-center text-sm text-muted-foreground mt-2 px-2 py-1 rounded transition-all",
            inlineEditingCaption && "bg-primary/5 outline-none ring-2 ring-primary/50",
            !isPreview && !inlineEditingCaption && "hover:bg-muted/30 cursor-text"
          )}
          contentEditable={inlineEditingCaption}
          suppressContentEditableWarning
          onBlur={handleCaptionBlur}
          onKeyDown={handleCaptionKeyDown}
          onDoubleClick={(e) => {
            if (isPreview) return
            e.preventDefault()
            e.stopPropagation()
            setInlineEditingCaption(true)
          }}
        >
          {localCaption || (!isPreview && !inlineEditingCaption ? "Add a caption..." : "")}
        </figcaption>
      )}
    </figure>
  )

  if (link && !isEditing && isPreview) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {imageContent}
      </a>
    )
  }

  return imageContent
}
