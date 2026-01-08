'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface CTAWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // CTA configuration
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundColor?: string
  backgroundGradient?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function CTAWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // CTA props
  title = 'Ready to Get Started?',
  description = 'Join thousands of creators building amazing websites with our platform. Start your free trial today.',
  primaryButtonText = 'Start Free Trial',
  primaryButtonLink = '#',
  secondaryButtonText = 'Talk to Sales',
  secondaryButtonLink = '#',
  backgroundColor,
  backgroundGradient = true,
  isEditing,
  isPreview,
  onChange
}: CTAWidgetProps) {
  // Data source state
  const [ctaData, setCtaData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeTitle = (dataSourceId && ctaData?.title) || title
  const activeDescription = (dataSourceId && ctaData?.description) || description
  const activePrimaryButtonText = (dataSourceId && ctaData?.primaryButtonText) || primaryButtonText
  const activeSecondaryButtonText = (dataSourceId && ctaData?.secondaryButtonText) || secondaryButtonText

  // Fetch data from data source
  const fetchCtaData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to CTA format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for CTA
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setCtaData({
          title: transformedData.title || transformedData.heading || transformedData.cta_title,
          description: transformedData.description || transformedData.content || transformedData.text,
          primaryButtonText: transformedData.primaryButtonText || transformedData.cta || transformedData.button,
          secondaryButtonText: transformedData.secondaryButtonText || transformedData.secondary_cta
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CTA data')
      console.error('Failed to fetch CTA data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchCtaData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchCtaData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchCtaData()
    }
  }
  return (
    <section
      className={cn(
        "w-full py-20 px-6",
        backgroundGradient && "bg-gradient-to-r from-primary to-primary/80"
      )}
      style={!backgroundGradient && backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Data Source Indicator */}
        {dataSourceId && !isEditing && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                <Database className="w-3 h-3 mr-1" />
                {dataSourceType === 'collection' ? 'Collection' : 
                 dataSourceType === 'scraper' ? 'Scraper' : 'API'}
              </Badge>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              )}
              {lastRefresh && (
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading} className="text-white hover:bg-white/10">
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Limited Time Offer
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            {activeTitle}
          </h2>
          
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {activeDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SmartButton
              text={activePrimaryButtonText}
              actions={[{ type: 'navigate', target: primaryButtonLink, openInNewTab: false }]}
              variant="secondary"
              size="lg"
              icon="arrow"
              iconPosition="right"
              className="text-base px-8"
              isPreview={isPreview}
              isEditing={isEditing}
            />
            {activeSecondaryButtonText && (
              <SmartButton
                text={activeSecondaryButtonText}
                actions={[{ type: 'navigate', target: secondaryButtonLink, openInNewTab: false }]}
                variant="outline"
                size="lg"
                className="text-base px-8 bg-transparent text-white border-white/30 hover:bg-white/10"
                isPreview={isPreview}
                isEditing={isEditing}
              />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
