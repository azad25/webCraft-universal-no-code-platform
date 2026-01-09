'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, X, Database, RefreshCw, Loader2 } from 'lucide-react'
import { SmartButton } from '@/components/ui/smart-button'
import { testDataSourceEndpoint } from '@/lib/data-source-api'

interface NavItem {
  label: string
  href: string
  icon?: string
  children?: NavItem[]
  action?: {
    type: 'navigate' | 'page' | 'data-action'
    target?: string
    pageId?: string
    dataSourceId?: string
    dataEndpointId?: string
  }
}

interface NavbarWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Navbar configuration
  logo?: string
  logoText?: string
  items?: NavItem[]
  ctaText?: string
  ctaLink?: string
  sticky?: boolean
  transparent?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function NavbarWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Navbar props
  logo,
  logoText = 'WebCraft',
  items = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ],
  ctaText = 'Get Started',
  ctaLink = '#',
  sticky = true,
  transparent = false,
  isEditing,
  isPreview,
  onChange
}: NavbarWidgetProps) {
  // Data source state
  const [navbarData, setNavbarData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeLogoText = (dataSourceId && navbarData?.logoText) || logoText
  const activeItems = (dataSourceId && navbarData?.items) || items
  const activeCtaText = (dataSourceId && navbarData?.ctaText) || ctaText

  // Fetch data from data source
  const fetchNavbarData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await testDataSourceEndpoint(dataSourceId, dataEndpointId || '', {})
      
      // Transform API response to navbar format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for navbar
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setNavbarData({
          logoText: transformedData.logoText || transformedData.brand || transformedData.title,
          items: transformedData.items || transformedData.navigation || transformedData.menu || [],
          ctaText: transformedData.ctaText || transformedData.cta || transformedData.button
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch navbar data')
      console.error('Failed to fetch navbar data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchNavbarData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchNavbarData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchNavbarData()
    }
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      className={cn(
        "w-full py-4 px-6",
        transparent ? "bg-transparent" : "bg-background border-b",
        sticky && "sticky top-0 z-50"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={activeLogoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{activeLogoText}</span>
          )}
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {activeItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button and Data Source Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <SmartButton
            text={activeCtaText}
            actions={[{ type: 'navigate', target: ctaLink }]}
            variant="default"
            size="default"
            isPreview={isPreview}
            isEditing={isEditing}
          />
          {dataSourceId && !isEditing && (
            <>
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
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t"
          >
            <div className="flex flex-col gap-2 pt-4">
              {activeItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 pt-2">
                <SmartButton
                  text={activeCtaText}
                  actions={[{ type: 'navigate', target: ctaLink }]}
                  variant="default"
                  size="default"
                  fullWidth={true}
                  isPreview={isPreview}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
