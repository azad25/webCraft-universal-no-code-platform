'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface GalleryImage {
  src: string
  alt?: string
  caption?: string
}

interface GalleryWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Gallery configuration
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
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Gallery props
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

  // Data source state
  const [galleryData, setGalleryData] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeImages = dataSourceId && galleryData.length > 0 ? galleryData : images

  // Fetch data from data source
  const fetchGalleryData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId || '', {}, true)
      
      // Transform API response to gallery format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any, index: number) => ({
          src: item.src || item.image || item.image_url || item.url || item.thumbnail,
          alt: item.alt || item.title || item.name || `Image ${index + 1}`,
          caption: item.caption || item.description || item.title
        })).filter((item: GalleryImage) => item.src) // Filter out items without images
      } else {
        transformedData = []
      }
      
      setGalleryData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gallery data')
      console.error('Failed to fetch gallery data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchGalleryData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchGalleryData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchGalleryData()
    }
  }

  const openLightbox = (index: number) => {
    if (lightbox && !isEditing) {
      setSelectedIndex(index)
    }
  }

  const closeLightbox = () => setSelectedIndex(null)

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? activeImages.length - 1 : selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === activeImages.length - 1 ? 0 : selectedIndex + 1)
    }
  }

  // Loading state
  if (isLoading && activeImages.length === 0 && !isEditing) {
    return (
      <section className="w-full py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </section>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <section className="w-full py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Database className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load gallery</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold">
                {title}
              </h2>
            )}
            {dataSourceId && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                {dataSourceType === 'collection' ? 'Collection' : 
                 dataSourceType === 'scraper' ? 'Scraper' : 'API'}
              </Badge>
            )}
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {dataSourceId && (
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
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
          {activeImages.map((image, index) => (
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
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {activeImages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No images available</p>
            <p className="text-sm">Connect a data source to display dynamic images</p>
          </div>
        )}

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
                src={activeImages[selectedIndex].src}
                alt={activeImages[selectedIndex].alt}
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
