'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface ProgressItem {
  label: string
  value: number
  color?: string
}

interface ProgressWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Progress configuration
  title?: string
  items?: ProgressItem[]
  style?: 'bar' | 'circle' | 'semicircle'
  showPercentage?: boolean
  animated?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function ProgressWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Progress props
  title,
  items = [
    { label: 'Web Development', value: 95, color: '#3b82f6' },
    { label: 'UI/UX Design', value: 88, color: '#8b5cf6' },
    { label: 'Mobile Apps', value: 75, color: '#10b981' },
    { label: 'Cloud Services', value: 82, color: '#f59e0b' }
  ],
  style = 'bar',
  showPercentage = true,
  animated = true,
  isEditing,
  isPreview,
  onChange
}: ProgressWidgetProps) {
  // Data source state
  const [progressData, setProgressData] = useState<ProgressItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeItems = dataSourceId && progressData.length > 0 ? progressData : items

  // Fetch data from data source
  const fetchProgressData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to progress format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          label: item.label || item.name || item.title || 'Progress Item',
          value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0,
          color: item.color || item.colour || '#3b82f6'
        }))
      } else {
        transformedData = []
      }
      
      setProgressData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data')
      console.error('Failed to fetch progress data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchProgressData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchProgressData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchProgressData()
    }
  }

  const [isVisible, setIsVisible] = useState(!animated)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    }
  }, [animated])

  const renderBar = (item: ProgressItem, index: number) => (
    <div key={index} className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{item.label}</span>
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{item.value}%</span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: item.color || '#3b82f6' }}
          initial={{ width: 0 }}
          animate={{ width: isVisible ? `${item.value}%` : 0 }}
          transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )

  const renderCircle = (item: ProgressItem, index: number) => {
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (item.value / 100) * circumference

    return (
      <div key={index} className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={item.color || '#3b82f6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isVisible ? strokeDashoffset : circumference }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{item.value}%</span>
            </div>
          )}
        </div>
        <span className="mt-3 font-medium text-sm text-center">{item.label}</span>
      </div>
    )
  }

  const renderSemicircle = (item: ProgressItem, index: number) => {
    const circumference = Math.PI * 45
    const strokeDashoffset = circumference - (item.value / 100) * circumference

    return (
      <div key={index} className="flex flex-col items-center">
        <div className="relative w-32 h-16 overflow-hidden">
          <svg className="w-full h-32 transform rotate-180" viewBox="0 0 100 50">
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <motion.path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={item.color || '#3b82f6'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: isVisible ? strokeDashoffset : circumference }}
              transition={{ duration: 1.5, delay: index * 0.2, ease: 'easeOut' }}
            />
          </svg>
          {showPercentage && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold">{item.value}%</span>
            </div>
          )}
        </div>
        <span className="mt-2 font-medium text-sm text-center">{item.label}</span>
      </div>
    )
  }

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
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
          {isLoadingData && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {dataSourceId && lastRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoadingData}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {style === 'bar' && (
          <div className="space-y-6">
            {activeItems.map((item, index) => renderBar(item, index))}
          </div>
        )}
        
        {style === 'circle' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {activeItems.map((item, index) => renderCircle(item, index))}
          </div>
        )}
        
        {style === 'semicircle' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {activeItems.map((item, index) => renderSemicircle(item, index))}
          </div>
        )}
      </div>
    </section>
  )
}
