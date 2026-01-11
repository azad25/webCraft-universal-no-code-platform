'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface LogoCloudWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Logo cloud configuration
  title?: string
  logos?: { name: string; src?: string }[]
  grayscale?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function LogoCloudWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Logo cloud props
  title = 'Trusted by leading companies',
  logos = [
    { name: 'Company 1' },
    { name: 'Company 2' },
    { name: 'Company 3' },
    { name: 'Company 4' },
    { name: 'Company 5' },
    { name: 'Company 6' }
  ],
  grayscale = true,
  isEditing,
  isPreview,
  onChange
}: LogoCloudWidgetProps) {
  // Data source state
  const [logoData, setLogoData] = useState<{ name: string; src?: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeLogos = dataSourceId && logoData.length > 0 ? logoData : logos

  // Fetch data from data source
  const fetchLogoData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to logo format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          name: item.name || item.title || item.company || item.brand || 'Company',
          src: item.src || item.logo || item.image || item.url
        }))
      } else {
        transformedData = []
      }
      
      setLogoData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logo data')
      console.error('Failed to fetch logo data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchLogoData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchLogoData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchLogoData()
    }
  }
  return (
    <section className="w-full py-12 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-8">
          {title && (
            <p className="text-center text-sm text-muted-foreground">
              {title}
            </p>
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
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {activeLogos.map((logo, index) => (
            <m.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "h-8 flex items-center",
                grayscale && "opacity-50 hover:opacity-100 transition-opacity"
              )}
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={cn("h-full w-auto", grayscale && "grayscale hover:grayscale-0 transition-all")}
                />
              ) : (
                <div className="px-4 py-2 bg-muted rounded font-semibold text-muted-foreground">
                  {logo.name}
                </div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
