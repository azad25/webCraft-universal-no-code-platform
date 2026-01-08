'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Twitter, Github, Linkedin, Instagram, Youtube, Facebook, Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

interface FooterWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Footer configuration
  logo?: string
  logoText?: string
  description?: string
  columns?: FooterColumn[]
  socialLinks?: { platform: string; href: string }[]
  copyright?: string
  backgroundColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const SOCIAL_ICONS: Record<string, any> = {
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook
}

export function FooterWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Footer props
  logo,
  logoText = 'WebCraft',
  description = 'Build beautiful websites and apps with our no-code platform.',
  columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Templates', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Status', href: '#' }
      ]
    }
  ],
  socialLinks = [
    { platform: 'twitter', href: '#' },
    { platform: 'github', href: '#' },
    { platform: 'linkedin', href: '#' }
  ],
  copyright = `© ${new Date().getFullYear()} WebCraft. All rights reserved.`,
  backgroundColor = '#0f172a',
  isEditing,
  isPreview,
  onChange
}: FooterWidgetProps) {
  // Data source state
  const [footerData, setFooterData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeLogoText = (dataSourceId && footerData?.logoText) || logoText
  const activeDescription = (dataSourceId && footerData?.description) || description
  const activeColumns = (dataSourceId && footerData?.columns) || columns
  const activeSocialLinks = (dataSourceId && footerData?.socialLinks) || socialLinks
  const activeCopyright = (dataSourceId && footerData?.copyright) || copyright

  // Fetch data from data source
  const fetchFooterData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to footer format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for footer
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setFooterData({
          logoText: transformedData.logoText || transformedData.brand || transformedData.company,
          description: transformedData.description || transformedData.about,
          columns: transformedData.columns || transformedData.links || [],
          socialLinks: transformedData.socialLinks || transformedData.social || [],
          copyright: transformedData.copyright || transformedData.footer_text
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch footer data')
      console.error('Failed to fetch footer data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchFooterData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchFooterData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchFooterData()
    }
  }
  return (
    <footer
      className="w-full py-12 px-6 text-white"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Data Source Indicator */}
        {dataSourceId && !isEditing && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/30">
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {logo ? (
                <img src={logo} alt={activeLogoText} className="h-8" />
              ) : (
                <span className="text-xl font-bold">{activeLogoText}</span>
              )}
            </div>
            <p className="text-white/70 text-sm mb-4 max-w-xs">
              {activeDescription}
            </p>
            <div className="flex gap-3">
              {activeSocialLinks.map((social, index) => {
                const Icon = SOCIAL_ICONS[social.platform] || Twitter
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link Columns */}
          {activeColumns.map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 text-center text-sm text-white/50">
          {activeCopyright}
        </div>
      </div>
    </footer>
  )
}
