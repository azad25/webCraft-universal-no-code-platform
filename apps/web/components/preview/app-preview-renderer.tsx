'use client'

import React, { useState, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Monitor, Smartphone, Tablet, Eye, EyeOff, RotateCcw, ExternalLink } from 'lucide-react'
import { WidgetRenderer } from '@/components/editor/widget-renderer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppPreviewRendererProps {
  app: {
    id: string
    name: string
    slug: string
    app_type: string
    config: any
    theme_config?: any
    seo_config?: any
  }
  device?: 'desktop' | 'tablet' | 'mobile'
  pages?: Array<{
    id: string
    title: string
    slug: string
    content: any
    is_homepage: boolean
    meta_title?: string
    meta_description?: string
  }>
  showControls?: boolean
  onDeviceChange?: (device: 'desktop' | 'tablet' | 'mobile') => void
  className?: string
}

const deviceDimensions = {
  desktop: { width: '100%', maxWidth: 'none', height: 'auto', minHeight: '600px' },
  tablet: { width: '768px', maxWidth: '768px', height: '1024px', aspectRatio: '4/3' },
  mobile: { width: '375px', maxWidth: '375px', height: '812px', aspectRatio: '9/16' }
}

export function AppPreviewRenderer({
  app,
  device = 'desktop',
  pages = [],
  showControls = true,
  onDeviceChange,
  className
}: AppPreviewRendererProps) {
  const [currentDevice, setCurrentDevice] = useState(device)
  const [currentPage, setCurrentPage] = useState(() => {
    if (!pages || pages.length === 0) return 'home'
    const homepage = pages.find(p => p.is_homepage)
    return homepage ? homepage.slug : pages[0].slug
  })
  const [showDeviceFrame, setShowDeviceFrame] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Find the current page
  const activePage = useMemo(() => {
    return pages?.find(p => p.slug === currentPage) || 
           pages?.find(p => p.is_homepage) || 
           pages?.[0]
  }, [pages, currentPage])

  // Get elements from app config or page content
  const elements = useMemo(() => {
    return app.config?.elements || activePage?.content?.elements || []
  }, [app.config, activePage])

  const handleDeviceChange = (newDevice: 'desktop' | 'tablet' | 'mobile') => {
    setCurrentDevice(newDevice)
    onDeviceChange?.(newDevice)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getDeviceStyles = () => {
    const dims = deviceDimensions[currentDevice]
    return {
      width: dims.width,
      maxWidth: dims.maxWidth,
      height: currentDevice === 'desktop' ? 'auto' : dims.height,
      minHeight: dims.minHeight,
      aspectRatio: dims.aspectRatio
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-100 dark:bg-slate-900", className)}>
      {/* Preview Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 bg-background border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview</span>
            <span className="text-xs text-muted-foreground capitalize">({currentDevice})</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Selector */}
            <div className="flex bg-muted rounded-lg p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((deviceType) => (
                <button
                  key={deviceType}
                  onClick={() => handleDeviceChange(deviceType)}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-colors",
                    currentDevice === deviceType
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  )}
                >
                  {getDeviceIcon(deviceType)}
                  <span className="capitalize hidden sm:inline">{deviceType}</span>
                </button>
              ))}
            </div>

            {/* Frame Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeviceFrame(!showDeviceFrame)}
              className="hidden md:flex"
            >
              {showDeviceFrame ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {/* Refresh */}
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* External Link */}
            <Button variant="ghost" size="sm" asChild>
              <a href={`/preview/${app.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <m.div
          key={`${currentDevice}-${refreshKey}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-background shadow-2xl overflow-hidden transition-all duration-300",
            showDeviceFrame && currentDevice === 'mobile' && "rounded-[40px] border-8 border-slate-800",
            showDeviceFrame && currentDevice === 'tablet' && "rounded-2xl border-4 border-slate-600",
            showDeviceFrame && currentDevice === 'desktop' && "rounded-lg"
          )}
          style={getDeviceStyles()}
        >
          {/* Mobile Device Frame Top */}
          {showDeviceFrame && currentDevice === 'mobile' && (
            <div className="h-6 bg-slate-800 flex items-center justify-center">
              <div className="w-20 h-4 bg-slate-700 rounded-full" />
            </div>
          )}

          {/* App Navigation Bar */}
          {pages && pages.length > 0 && (
            <div className="bg-muted/50 border-b p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-foreground">{app.name}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {currentDevice.toUpperCase()}
                </span>
              </div>
              
              {/* Page Navigation */}
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(page.slug)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-lg transition-colors",
                      currentPage === page.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {page.title}
                    {page.is_homepage && <span className="ml-1 text-xs">🏠</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview Content */}
          <div className="relative min-h-full bg-background">
            {elements && elements.length > 0 ? (
              <div className="relative min-h-full">
                {/* Render elements using the actual WidgetRenderer */}
                {elements.map((element: any, index: number) => (
                  <div
                    key={element.id || index}
                    className="absolute"
                    style={{
                      left: element.position?.x || 0,
                      top: element.position?.y || (index * 100),
                      width: element.size?.width || '100%',
                      height: element.size?.height || 'auto',
                      zIndex: element.zIndex || index + 1
                    }}
                  >
                    <WidgetRenderer
                      element={element}
                      isSelected={false}
                      isHovered={false}
                      isPreview={true}
                      onSelect={() => {}}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Monitor className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Empty {activePage ? 'Page' : 'App'}
                  </h3>
                  <p className="text-sm mb-4">
                    {activePage 
                      ? `The page "${activePage.title}" doesn't have any content elements yet.`
                      : "This app doesn't have any elements yet."
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add some widgets to see your app come to life!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Device Frame Bottom */}
          {showDeviceFrame && currentDevice === 'mobile' && (
            <div className="h-8 bg-slate-800 flex items-center justify-center">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          )}
        </m.div>
      </div>

      {/* Preview Stats */}
      {showControls && (
        <div className="px-4 py-2 bg-muted/50 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Elements: {elements.length}</span>
              <span>Pages: {pages.length}</span>
              <span>Type: {app.app_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live Preview</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppPreviewRenderer