'use client'

import { useState, useRef, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Edit, Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'
import { MediaManager } from '@/components/media/media-manager'

interface CardWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Card content
  title?: string
  description?: string
  image?: string
  buttonText?: string
  buttonUrl?: string
  
  // Styling
  backgroundColor?: string
  borderRadius?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  
  // Editor states
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  elementId?: string
  appId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
}

export function CardWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Card props
  title = 'Card Title',
  description = 'This is a description for the card. Add your content here.',
  image,
  buttonText = 'Learn More',
  buttonUrl = '#',
  backgroundColor = '#ffffff',
  borderRadius = '12px',
  shadow = 'md',
  isEditing = false,
  isPreview = false,
  isSelected = false,
  elementId,
  appId,
  onChange,
  onStyleChange
}: CardWidgetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const buttonRef = useRef<HTMLSpanElement>(null)
  const [inlineEditingTitle, setInlineEditingTitle] = useState(false)
  const [inlineEditingDesc, setInlineEditingDesc] = useState(false)
  const [inlineEditingButton, setInlineEditingButton] = useState(false)
  const [localImage, setLocalImage] = useState(image)
  const [showMediaManager, setShowMediaManager] = useState(false)

  // Data source state
  const [cardData, setCardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use props
  const activeCard = cardData || {
    title, description, image, buttonText, buttonUrl
  }

  // Fetch data from data source
  const fetchCardData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to card format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData[0] // Take first item for single card
      }
      
      if (transformedData && typeof transformedData === 'object') {
        const mappedCard = {
          title: transformedData.title || transformedData.name || transformedData.heading,
          description: transformedData.description || transformedData.content || transformedData.summary,
          image: transformedData.image || transformedData.image_url || transformedData.thumbnail,
          buttonText: transformedData.button_text || transformedData.cta || buttonText,
          buttonUrl: transformedData.button_url || transformedData.link || transformedData.url || buttonUrl
        }
        
        setCardData(mappedCard)
        setLocalImage(mappedCard.image)
        setLastRefresh(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch card data')
      console.error('Failed to fetch card data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchCardData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchCardData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchCardData()
    }
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  // Update local image when prop changes
  useEffect(() => {
    setLocalImage(image)
  }, [image])

  const handleTitleBlur = () => {
    if (titleRef.current && onChange) {
      onChange({ title: titleRef.current.innerText })
      setInlineEditingTitle(false)
    }
  }

  const handleDescBlur = () => {
    if (descRef.current && onChange) {
      onChange({ description: descRef.current.innerText })
      setInlineEditingDesc(false)
    }
  }

  const handleButtonBlur = () => {
    if (buttonRef.current && onChange) {
      onChange({ buttonText: buttonRef.current.innerText })
      setInlineEditingButton(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, onBlur: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onBlur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onBlur()
    }
  }

  const handleImageUpload = () => {
    if (isPreview) return
    setShowMediaManager(true)
  }

  const handleMediaSelect = (media: any) => {
    setLocalImage(media.url)
    if (onChange) {
      onChange({ image: media.url })
    }
    setShowMediaManager(false)
  }

  // Start editing when Enter is pressed on selected element
  useEffect(() => {
    if (isSelected && !isPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !inlineEditingTitle && !inlineEditingDesc && !inlineEditingButton) {
          e.preventDefault()
          setInlineEditingTitle(true)
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isPreview, inlineEditingTitle, inlineEditingDesc, inlineEditingButton])

  // Focus elements when entering inline editing mode
  useEffect(() => {
    if (inlineEditingTitle && titleRef.current) {
      titleRef.current.focus()
    }
  }, [inlineEditingTitle])

  useEffect(() => {
    if (inlineEditingDesc && descRef.current) {
      descRef.current.focus()
    }
  }, [inlineEditingDesc])

  useEffect(() => {
    if (inlineEditingButton && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [inlineEditingButton])

  return (
    <m.div
      className={cn(
        "w-full h-full overflow-hidden border cursor-pointer",
        shadowClasses[shadow],
        isSelected && "ring-2 ring-primary/50"
      )}
      style={{ backgroundColor, borderRadius }}
      whileHover={{ y: isEditing || inlineEditingTitle || inlineEditingDesc || inlineEditingButton ? 0 : -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      {activeCard.image || localImage ? (
        <div className="w-full h-40 overflow-hidden relative group">
          <img
            src={activeCard.image || localImage}
            alt={activeCard.title}
            className="w-full h-full object-cover"
          />
          {!isPreview && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button onClick={handleImageUpload} variant="secondary" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Change
              </Button>
            </div>
          )}
        </div>
      ) : (
        !isPreview && (
          <div 
            className="w-full h-40 bg-muted border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={handleImageUpload}
          >
            <Upload className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <span className="text-sm text-muted-foreground">Add Image</span>
          </div>
        )
      )}
      
      <div className="p-6">
        {/* Title */}
        <h3 
          ref={titleRef}
          className={cn(
            "text-xl font-bold mb-2 cursor-text transition-all",
            inlineEditingTitle && "outline-none ring-2 ring-primary/50 rounded px-1 bg-primary/5",
            !isPreview && !inlineEditingTitle && "hover:bg-muted/30 rounded px-1 hover:ring-1 hover:ring-primary/30"
          )}
          contentEditable={inlineEditingTitle}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={(e) => handleKeyDown(e, handleTitleBlur)}
          onDoubleClick={(e) => {
            if (isPreview) return
            e.preventDefault()
            e.stopPropagation()
            setInlineEditingTitle(true)
          }}
          onClick={(e) => {
            if (!isPreview && !inlineEditingTitle) {
              e.stopPropagation()
            }
          }}
        >
          {activeCard.title}
        </h3>

        {/* Description */}
        <p 
          ref={descRef}
          className={cn(
            "text-gray-600 mb-4 cursor-text transition-all",
            inlineEditingDesc && "outline-none ring-2 ring-primary/50 rounded px-1 bg-primary/5",
            !isPreview && !inlineEditingDesc && "hover:bg-muted/30 rounded px-1 hover:ring-1 hover:ring-primary/30"
          )}
          contentEditable={inlineEditingDesc}
          suppressContentEditableWarning
          onBlur={handleDescBlur}
          onKeyDown={(e) => handleKeyDown(e, handleDescBlur)}
          onDoubleClick={(e) => {
            if (isPreview) return
            e.preventDefault()
            e.stopPropagation()
            setInlineEditingDesc(true)
          }}
          onClick={(e) => {
            if (!isPreview && !inlineEditingDesc) {
              e.stopPropagation()
            }
          }}
        >
          {activeCard.description}
        </p>
        
        {/* Data Source Indicator */}
        {dataSourceId && !isEditing && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {dataSourceType === 'collection' ? 'Collection' : 
               dataSourceType === 'scraper' ? 'Scraper' : 'API'}
            </Badge>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        {/* Button */}
        {activeCard.buttonText && (
          <button
            className={cn(
              "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all",
              inlineEditingButton && "ring-2 ring-primary/50 bg-primary/5"
            )}
            onClick={(e) => {
              if (inlineEditingButton) {
                e.preventDefault()
                return
              }
              if (!isEditing && !isPreview && activeCard.buttonUrl) {
                window.open(activeCard.buttonUrl, '_blank')
              }
            }}
            onDoubleClick={(e) => {
              if (isPreview) return
              e.preventDefault()
              e.stopPropagation()
              setInlineEditingButton(true)
            }}
          >
            <span
              ref={buttonRef}
              contentEditable={inlineEditingButton}
              suppressContentEditableWarning
              onBlur={handleButtonBlur}
              onKeyDown={(e) => handleKeyDown(e, handleButtonBlur)}
              className="outline-none"
            >
              {activeCard.buttonText}
            </span>
          </button>
        )}
      </div>
      
      {/* Media Manager */}
      {appId && (
        <MediaManager
          appId={appId}
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onSelect={handleMediaSelect}
          acceptTypes={['image']}
        />
      )}
    </m.div>
  )
}
