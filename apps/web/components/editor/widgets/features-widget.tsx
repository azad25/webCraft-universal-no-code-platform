'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Globe, 
  Layers, 
  Smartphone,
  BarChart3,
  Lock,
  Rocket,
  Database,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'
import { LinkableWidgetWrapper } from './linkable-widget-wrapper'

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeaturesWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Features configuration
  title?: string
  subtitle?: string
  features?: Feature[]
  columns?: 2 | 3 | 4
  layout?: 'grid' | 'list' | 'cards'
  
  // Universal link support
  linkConfig?: {
    type: 'page' | 'section' | 'data' | 'custom' | 'external' | 'action'
    target: string
    label?: string
    openInNewTab?: boolean
    parameters?: Record<string, any>
  }
  href?: string
  target?: string
  
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  isHovered?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
}

const ICONS: Record<string, any> = {
  zap: Zap,
  shield: Shield,
  sparkles: Sparkles,
  globe: Globe,
  layers: Layers,
  smartphone: Smartphone,
  chart: BarChart3,
  lock: Lock,
  rocket: Rocket
}

export function FeaturesWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Features props
  title = 'Powerful Features',
  subtitle = 'Everything you need to build amazing products',
  features = [
    { icon: 'zap', title: 'Lightning Fast', description: 'Optimized for speed and performance' },
    { icon: 'shield', title: 'Secure by Default', description: 'Enterprise-grade security built-in' },
    { icon: 'sparkles', title: 'AI Powered', description: 'Smart suggestions and automation' },
    { icon: 'globe', title: 'Global CDN', description: 'Deploy worldwide in seconds' },
    { icon: 'layers', title: 'Modular Design', description: 'Build with reusable components' },
    { icon: 'smartphone', title: 'Mobile Ready', description: 'Responsive on all devices' }
  ],
  columns = 3,
  layout = 'grid',
  
  // Universal link props
  linkConfig,
  href,
  target,
  
  isEditing,
  isPreview,
  isSelected,
  isHovered,
  elementId,
  onChange,
  onStyleChange
}: FeaturesWidgetProps) {
  // Data source state
  const [featuresData, setFeaturesData] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeFeatures = dataSourceId && featuresData.length > 0 ? featuresData : features

  // Fetch data from data source
  const fetchFeaturesData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to features format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          icon: item.icon || 'zap',
          title: item.title || item.name || item.heading || 'Feature',
          description: item.description || item.content || item.text || 'Feature description'
        }))
      } else {
        transformedData = []
      }
      
      setFeaturesData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features data')
      console.error('Failed to fetch features data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchFeaturesData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchFeaturesData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchFeaturesData()
    }
  }
  return (
    <LinkableWidgetWrapper
      linkConfig={linkConfig}
      href={href}
      target={target}
      isPreview={isPreview}
      isSelected={isSelected}
      isHovered={isHovered}
      elementId={elementId}
      elementType="features"
    >
      <section className="w-full py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
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

        {/* Features Grid */}
        <div
          className={cn(
            "grid gap-8",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {activeFeatures.map((feature, index) => {
            const Icon = ICONS[feature.icon] || Zap
            return (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "group p-6 rounded-2xl transition-all duration-300",
                  layout === 'cards' && "bg-card border shadow-sm hover:shadow-lg"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
    </LinkableWidgetWrapper>
  )
}
