'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface Step {
  title: string
  description: string
  icon?: string
}

interface StepsWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Steps configuration
  title?: string
  subtitle?: string
  steps?: Step[]
  layout?: 'horizontal' | 'vertical' | 'cards'
  showNumbers?: boolean
  accentColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function StepsWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Steps props
  title = 'How It Works',
  subtitle = 'Get started in just a few simple steps',
  steps = [
    { title: 'Sign Up', description: 'Create your free account in seconds. No credit card required.' },
    { title: 'Choose Template', description: 'Pick from hundreds of professionally designed templates.' },
    { title: 'Customize', description: 'Use our drag-and-drop editor to make it your own.' },
    { title: 'Publish', description: 'Go live with one click and share with the world.' }
  ],
  layout = 'horizontal',
  showNumbers = true,
  accentColor = '#3b82f6',
  isEditing,
  isPreview,
  onChange
}: StepsWidgetProps) {
  // Data source state
  const [stepsData, setStepsData] = useState<Step[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeSteps = dataSourceId && stepsData.length > 0 ? stepsData : steps

  // Fetch data from data source
  const fetchStepsData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to steps format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          title: item.title || item.name || item.step || 'Step',
          description: item.description || item.content || item.text || 'Step description',
          icon: item.icon || item.image
        }))
      } else {
        transformedData = []
      }
      
      setStepsData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch steps data')
      console.error('Failed to fetch steps data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchStepsData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchStepsData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchStepsData()
    }
  }

  const renderHorizontal = () => (
    <div className="relative">
      {/* Connector Line */}
      <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-muted" style={{ left: '10%', right: '10%' }} />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {activeSteps.map((step, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative text-center"
          >
            {/* Number */}
            {showNumbers && (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 relative z-10"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </m.div>
        ))}
      </div>
    </div>
  )

  const renderVertical = () => (
    <div className="relative max-w-2xl mx-auto">
      {/* Connector Line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted" />
      
      <div className="space-y-8">
        {activeSteps.map((step, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-6"
          >
            {/* Number */}
            {showNumbers && (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 relative z-10"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </div>
            )}
            
            <div className="pt-3">
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  )

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {activeSteps.map((step, index) => (
        <m.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative p-6 bg-card rounded-2xl border hover:shadow-lg transition-shadow"
        >
          {/* Number Badge */}
          {showNumbers && (
            <div
              className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {index + 1}
            </div>
          )}
          
          <h3 className="text-lg font-semibold mb-2 mt-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {/* Arrow to next */}
          {index < activeSteps.length - 1 && (
            <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              →
            </div>
          )}
        </m.div>
      ))}
    </div>
  )

  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <m.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              {title}
            </m.h2>
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
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </m.p>
          {dataSourceId && lastRefresh && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {layout === 'horizontal' && renderHorizontal()}
        {layout === 'vertical' && renderVertical()}
        {layout === 'cards' && renderCards()}
      </div>
    </section>
  )
}
