'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Database, RefreshCw, Loader2, Upload, Edit3 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface HeroWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Hero configuration
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
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
}

export function HeroWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Hero props
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
  isSelected,
  elementId,
  onChange,
  onStyleChange
}: HeroWidgetProps) {
  // Data source state
  const [heroData, setHeroData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLHeadingElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const primaryButtonRef = useRef<HTMLSpanElement>(null)
  const secondaryButtonRef = useRef<HTMLSpanElement>(null)

  // Use data source data if available, otherwise use static data
  const activeTitle = (dataSourceId && heroData?.title) || title
  const activeSubtitle = (dataSourceId && heroData?.subtitle) || subtitle
  const activeDescription = (dataSourceId && heroData?.description) || description
  const activeBadgeText = (dataSourceId && heroData?.badgeText) || badgeText
  const activePrimaryButtonText = (dataSourceId && heroData?.primaryButtonText) || primaryButtonText
  const activeSecondaryButtonText = (dataSourceId && heroData?.secondaryButtonText) || secondaryButtonText

  // Handle field editing
  const handleFieldEdit = useCallback((field: string) => {
    if (isPreview) return
    setEditingField(field)
  }, [isPreview])

  const handleFieldBlur = useCallback((field: string) => {
    const refs = {
      title: titleRef,
      subtitle: subtitleRef,
      description: descriptionRef,
      badgeText: badgeRef,
      primaryButtonText: primaryButtonRef,
      secondaryButtonText: secondaryButtonRef
    }
    
    const ref = refs[field as keyof typeof refs]
    if (ref?.current && onChange) {
      onChange({ [field]: ref.current.innerText })
    }
    setEditingField(null)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFieldBlur(field)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleFieldBlur(field)
    }
  }, [handleFieldBlur])

  // Handle background image upload
  const handleBackgroundUpload = useCallback(() => {
    if (isPreview) return
    const url = prompt('Enter background image URL:', backgroundImage || '')
    if (url !== null && onChange) {
      onChange({ backgroundImage: url })
    }
  }, [backgroundImage, onChange, isPreview])

  // Fetch data from data source
  const fetchHeroData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId || '', {}, true)
      
      // Transform API response to hero format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for hero
      }
      
      if (transformedData && typeof transformedData === 'object' && !Array.isArray(transformedData)) {
        setHeroData({
          title: transformedData.title || transformedData.heading || transformedData.name,
          subtitle: transformedData.subtitle || transformedData.tagline,
          description: transformedData.description || transformedData.content || transformedData.body,
          badgeText: transformedData.badgeText || transformedData.badge || transformedData.announcement,
          primaryButtonText: transformedData.primaryButtonText || transformedData.cta || transformedData.button,
          secondaryButtonText: transformedData.secondaryButtonText || transformedData.secondaryCta,
          backgroundImage: transformedData.backgroundImage || transformedData.image || transformedData.hero_image
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hero data')
      console.error('Failed to fetch hero data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchHeroData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchHeroData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchHeroData()
    }
  }

  return (
    <section
      className={cn(
        "relative w-full min-h-[600px] flex items-center overflow-hidden group",
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
      {backgroundImage && backgroundOverlay > 0 && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: backgroundOverlay }}
        />
      )}

      {/* Background Upload Button */}
      {!isPreview && isSelected && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackgroundUpload}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {backgroundImage ? 'Change Background' : 'Add Background'}
          </Button>
        </div>
      )}

      {/* Data Source Indicator */}
      {dataSourceId && !isEditing && (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
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

      {/* Content */}
      <div className="relative z-10 w-full px-6 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          {showBadge && activeBadgeText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div
                ref={badgeRef}
                className={cn(
                  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-text",
                  editingField === 'badgeText' && "outline-none ring-2 ring-primary/50 bg-primary/5",
                  !isPreview && editingField !== 'badgeText' && "hover:bg-muted/30"
                )}
                contentEditable={editingField === 'badgeText'}
                suppressContentEditableWarning
                onBlur={() => handleFieldBlur('badgeText')}
                onKeyDown={(e) => handleKeyDown(e, 'badgeText')}
                onDoubleClick={() => handleFieldEdit('badgeText')}
              >
                {activeBadgeText}
              </div>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            ref={titleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight cursor-text",
              editingField === 'title' && "outline-none ring-2 ring-primary/50 rounded px-2 bg-primary/5",
              !isPreview && editingField !== 'title' && "hover:bg-muted/30 rounded px-2"
            )}
            contentEditable={editingField === 'title'}
            suppressContentEditableWarning
            onBlur={() => handleFieldBlur('title')}
            onKeyDown={(e) => handleKeyDown(e, 'title')}
            onDoubleClick={() => handleFieldEdit('title')}
          >
            {activeTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            ref={subtitleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "text-xl md:text-2xl lg:text-3xl font-semibold mb-6 text-muted-foreground cursor-text",
              editingField === 'subtitle' && "outline-none ring-2 ring-primary/50 rounded px-2 bg-primary/5",
              !isPreview && editingField !== 'subtitle' && "hover:bg-muted/30 rounded px-2"
            )}
            contentEditable={editingField === 'subtitle'}
            suppressContentEditableWarning
            onBlur={() => handleFieldBlur('subtitle')}
            onKeyDown={(e) => handleKeyDown(e, 'subtitle')}
            onDoubleClick={() => handleFieldEdit('subtitle')}
          >
            {activeSubtitle}
          </motion.h2>

          {/* Description */}
          <motion.p
            ref={descriptionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl mx-auto cursor-text",
              alignment === 'left' && "mx-0",
              alignment === 'right' && "ml-auto mr-0",
              editingField === 'description' && "outline-none ring-2 ring-primary/50 rounded px-2 bg-primary/5",
              !isPreview && editingField !== 'description' && "hover:bg-muted/30 rounded px-2"
            )}
            contentEditable={editingField === 'description'}
            suppressContentEditableWarning
            onBlur={() => handleFieldBlur('description')}
            onKeyDown={(e) => handleKeyDown(e, 'description')}
            onDoubleClick={() => handleFieldEdit('description')}
          >
            {activeDescription}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {/* Primary Button */}
            <Button
              size="lg"
              className="text-lg px-8 py-4 h-auto"
              onClick={() => !isEditing && !isPreview && primaryButtonLink && window.open(primaryButtonLink, '_blank')}
            >
              <span
                ref={primaryButtonRef}
                className={cn(
                  "cursor-text",
                  editingField === 'primaryButtonText' && "outline-none ring-2 ring-white/50 rounded px-1"
                )}
                contentEditable={editingField === 'primaryButtonText'}
                suppressContentEditableWarning
                onBlur={() => handleFieldBlur('primaryButtonText')}
                onKeyDown={(e) => handleKeyDown(e, 'primaryButtonText')}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  handleFieldEdit('primaryButtonText')
                }}
              >
                {activePrimaryButtonText}
              </span>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            {/* Secondary Button */}
            {activeSecondaryButtonText && (
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 h-auto"
                onClick={() => !isEditing && !isPreview && secondaryButtonLink && window.open(secondaryButtonLink, '_blank')}
              >
                <Play className="mr-2 w-5 h-5" />
                <span
                  ref={secondaryButtonRef}
                  className={cn(
                    "cursor-text",
                    editingField === 'secondaryButtonText' && "outline-none ring-2 ring-primary/50 rounded px-1"
                  )}
                  contentEditable={editingField === 'secondaryButtonText'}
                  suppressContentEditableWarning
                  onBlur={() => handleFieldBlur('secondaryButtonText')}
                  onKeyDown={(e) => handleKeyDown(e, 'secondaryButtonText')}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    handleFieldEdit('secondaryButtonText')
                  }}
                >
                  {activeSecondaryButtonText}
                </span>
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}