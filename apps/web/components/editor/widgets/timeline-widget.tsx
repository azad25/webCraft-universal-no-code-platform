'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Circle, Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface TimelineItem {
  title: string
  description: string
  date?: string
  icon?: string
  status?: 'completed' | 'current' | 'upcoming'
}

interface TimelineWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Timeline configuration
  title?: string
  items?: TimelineItem[]
  layout?: 'vertical' | 'horizontal' | 'alternating'
  showConnector?: boolean
  accentColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function TimelineWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Timeline props
  title,
  items = [
    { title: 'Project Started', description: 'Initial planning and research phase', date: 'Jan 2024', status: 'completed' },
    { title: 'Design Phase', description: 'UI/UX design and prototyping', date: 'Feb 2024', status: 'completed' },
    { title: 'Development', description: 'Building the core features', date: 'Mar 2024', status: 'current' },
    { title: 'Testing', description: 'Quality assurance and bug fixes', date: 'Apr 2024', status: 'upcoming' },
    { title: 'Launch', description: 'Public release and marketing', date: 'May 2024', status: 'upcoming' }
  ],
  layout = 'vertical',
  showConnector = true,
  accentColor = '#3b82f6',
  isEditing,
  isPreview,
  onChange
}: TimelineWidgetProps) {
  // Data source state
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeItems = dataSourceId && timelineData.length > 0 ? timelineData : items

  // Fetch data from data source
  const fetchTimelineData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to timeline format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          title: item.title || item.name || item.event || 'Timeline Item',
          description: item.description || item.content || item.text || 'Timeline description',
          date: item.date || item.time || item.when,
          icon: item.icon || item.image,
          status: item.status || item.state || 'upcoming'
        }))
      } else {
        transformedData = []
      }
      
      setTimelineData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline data')
      console.error('Failed to fetch timeline data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchTimelineData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchTimelineData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchTimelineData()
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4" />
      case 'current':
        return <Circle className="w-3 h-3 fill-current" />
      default:
        return <Circle className="w-3 h-3" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return accentColor
      case 'current':
        return accentColor
      default:
        return '#9ca3af'
    }
  }

  const renderVertical = () => (
    <div className="relative">
      {showConnector && (
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
      )}
      <div className="space-y-8">
        {activeItems.map((item, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-6"
          >
            {/* Icon */}
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {getStatusIcon(item.status)}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              {item.date && (
                <span className="text-sm text-muted-foreground">{item.date}</span>
              )}
              <h3 className="text-lg font-semibold mt-1">{item.title}</h3>
              <p className="text-muted-foreground mt-1">{item.description}</p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  )

  const renderAlternating = () => (
    <div className="relative">
      {showConnector && (
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted -translate-x-1/2" />
      )}
      <div className="space-y-12">
        {activeItems.map((item, index) => {
          const isLeft = index % 2 === 0
          return (
            <m.div
              key={index}
              initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative flex items-center gap-8",
                isLeft ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Content */}
              <div className={cn("flex-1", isLeft ? "text-right" : "text-left")}>
                {item.date && (
                  <span className="text-sm text-muted-foreground">{item.date}</span>
                )}
                <h3 className="text-lg font-semibold mt-1">{item.title}</h3>
                <p className="text-muted-foreground mt-1">{item.description}</p>
              </div>
              
              {/* Icon */}
              <div
                className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                {getStatusIcon(item.status)}
              </div>
              
              {/* Spacer */}
              <div className="flex-1" />
            </m.div>
          )
        })}
      </div>
    </div>
  )

  const renderHorizontal = () => (
    <div className="relative overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max px-4">
        {activeItems.map((item, index) => (
          <m.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative flex flex-col items-center w-48"
          >
            {/* Connector */}
            {showConnector && index < activeItems.length - 1 && (
              <div 
                className="absolute top-4 left-1/2 w-full h-0.5 bg-muted"
                style={{ left: '50%' }}
              />
            )}
            
            {/* Icon */}
            <div
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white mb-4"
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {getStatusIcon(item.status)}
            </div>
            
            {/* Content */}
            <div className="text-center">
              {item.date && (
                <span className="text-sm text-muted-foreground">{item.date}</span>
              )}
              <h3 className="font-semibold mt-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
          </m.div>
        ))}
      </div>
    </div>
  )

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          {title && (
            <h2 className="text-2xl md:text-3xl font-bold text-center">{title}</h2>
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
          {dataSourceId && lastRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {layout === 'vertical' && renderVertical()}
        {layout === 'alternating' && renderAlternating()}
        {layout === 'horizontal' && renderHorizontal()}
      </div>
    </section>
  )
}
