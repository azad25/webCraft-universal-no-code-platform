'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface Stat {
  value: number
  suffix?: string
  prefix?: string
  label: string
}

interface StatsWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Stats configuration
  title?: string
  stats?: Stat[]
  backgroundColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' })
    return controls.stop
  }, [count, value])

  return (
    <motion.span ref={ref}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

export function StatsWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Stats props
  title,
  stats = [
    { value: 50000, suffix: '+', label: 'Active Users' },
    { value: 99, suffix: '%', label: 'Uptime' },
    { value: 200, suffix: '+', label: 'Templates' },
    { value: 24, suffix: '/7', label: 'Support' }
  ],
  backgroundColor = 'transparent',
  isEditing = false,
  isPreview = false,
  onChange
}: StatsWidgetProps) {
  // Data source state
  const [statsData, setStatsData] = useState<Stat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeStats = dataSourceId && statsData.length > 0 ? statsData : stats

  // Fetch data from data source
  const fetchStatsData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to stats format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          value: parseFloat(item.value || item.count || item.amount || item.total || 0),
          label: item.label || item.name || item.title || 'Stat',
          suffix: item.suffix || '',
          prefix: item.prefix || ''
        }))
      } else if (transformedData && typeof transformedData === 'object') {
        // Single stat object with multiple values
        transformedData = Object.entries(transformedData)
          .filter(([key, value]) => typeof value === 'number' || !isNaN(Number(value)))
          .map(([key, value]) => ({
            value: parseFloat(String(value)),
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            suffix: '',
            prefix: ''
          }))
      } else {
        transformedData = []
      }
      
      setStatsData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats data')
      console.error('Failed to fetch stats data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchStatsData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchStatsData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchStatsData()
    }
  }
  // Loading state
  if (isLoading && activeStats.length === 0 && !isEditing) {
    return (
      <section className="w-full py-16 px-6" style={{ backgroundColor }}>
        <div className="max-w-6xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </section>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <section className="w-full py-16 px-6" style={{ backgroundColor }}>
        <div className="max-w-6xl mx-auto text-center">
          <Database className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load statistics</p>
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
    <section
      className="w-full py-16 px-6"
      style={{ backgroundColor }}
    >
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
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {activeStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                <AnimatedNumber 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  prefix={stat.prefix} 
                />
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        
        {activeStats.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No statistics available</p>
          </div>
        )}
      </div>
    </section>
  )
}
