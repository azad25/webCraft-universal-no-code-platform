'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Mail, Globe, Database, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface SocialLink {
  platform: string
  url: string
}

interface SocialWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Social configuration
  links?: SocialLink[]
  layout?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  style?: 'filled' | 'outline' | 'minimal'
  showLabels?: boolean
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultLinks: SocialLink[] = [
  { platform: 'facebook', url: 'https://facebook.com' },
  { platform: 'twitter', url: 'https://twitter.com' },
  { platform: 'instagram', url: 'https://instagram.com' },
  { platform: 'linkedin', url: 'https://linkedin.com' }
]

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  email: Mail,
  website: Globe
}

const platformColors: Record<string, string> = {
  facebook: '#1877f2',
  twitter: '#1da1f2',
  instagram: '#e4405f',
  linkedin: '#0a66c2',
  youtube: '#ff0000',
  github: '#333333',
  email: '#ea4335',
  website: '#4285f4'
}

export function SocialWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Social props
  links = defaultLinks,
  layout = 'horizontal',
  size = 'md',
  style = 'filled',
  showLabels = false,
  isEditing = false,
  onChange
}: SocialWidgetProps) {
  // Data source state
  const [socialData, setSocialData] = useState<SocialLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeLinks = dataSourceId && socialData.length > 0 ? socialData : links

  // Fetch data from data source
  const fetchSocialData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to social links format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          platform: item.platform || item.name || item.type || 'website',
          url: item.url || item.link || item.href || '#'
        }))
      } else {
        transformedData = []
      }
      
      setSocialData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch social data')
      console.error('Failed to fetch social data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchSocialData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchSocialData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchSocialData()
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const getButtonStyle = (platform: string) => {
    const color = platformColors[platform] || '#666666'
    
    switch (style) {
      case 'filled':
        return { backgroundColor: color, color: '#ffffff' }
      case 'outline':
        return { border: `2px solid ${color}`, color: color, backgroundColor: 'transparent' }
      case 'minimal':
        return { color: color, backgroundColor: 'transparent' }
      default:
        return {}
    }
  }

  return (
    <div className="w-full py-6 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Data Source Indicator */}
        {dataSourceId && !isEditing && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {dataSourceType === 'collection' ? 'Collection' : 
               dataSourceType === 'scraper' ? 'Scraper' : 'API'}
            </Badge>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {lastRefresh && (
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex gap-3",
            layout === 'vertical' ? 'flex-col items-start' : 'flex-row items-center justify-center flex-wrap'
          )}
        >
          {activeLinks.map((link, index) => {
            const Icon = platformIcons[link.platform] || Globe
            
            return (
              <motion.a
                key={index}
                href={isEditing ? undefined : link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-full transition-all duration-200",
                  sizeClasses[size],
                  style === 'minimal' ? 'hover:opacity-70' : 'hover:scale-110',
                  showLabels && 'px-4 rounded-lg'
                )}
                style={getButtonStyle(link.platform)}
                whileHover={{ scale: isEditing ? 1 : 1.1 }}
                whileTap={{ scale: isEditing ? 1 : 0.95 }}
                onClick={(e) => isEditing && e.preventDefault()}
              >
                <Icon className={iconSizes[size]} />
                {showLabels && (
                  <span className="text-sm font-medium capitalize">{link.platform}</span>
                )}
              </motion.a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
