'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryImage {
  src: string
  alt?: string
  caption?: string
}

interface GalleryWidgetProps {
  title?: string
  images?: GalleryImage[]
  columns?: 2 | 3 | 4
  gap?: string
  lightbox?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function GalleryWidget({
  title,
  images = [
    { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', alt: 'Image 1' },
    { src: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600', alt: 'Image 2' },
    { src: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=600', alt: 'Image 3' },
    { src: 'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=600', alt: 'Image 4' },
    { src: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600', alt: 'Image 5' },
    { src: 'https://images.unsplash.com/photo-1614849963640-9cc74b2a826f?w=600', alt: 'Image 6' }
  ],
  columns = 3,
  gap = '16px',
  lightbox = true,
  isEditing,
  isPreview,
  onChange
}: GalleryWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    if (lightbox && !isEditing) {
      setSelectedIndex(index)
    }
  }

  const closeLightbox = () => setSelectedIndex(null)

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {title}
          </h2>
        )}
        
        {/* Gallery Grid */}
        <div
          className={cn(
            "grid",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}
          style={{ gap }}
        >
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.src}
                alt={image.alt || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              
              <motion.img
                key={selectedIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={images[selectedIndex].src}
                alt={images[selectedIndex].alt}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); goToNext() }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
