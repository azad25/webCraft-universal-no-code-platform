'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Tablet, Monitor, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'
import { AppPreviewRenderer } from '@/components/preview/app-preview-renderer'

interface EditorPreviewProps {
  app: any
  mode: 'desktop' | 'tablet' | 'mobile'
  onModeChange?: (mode: 'desktop' | 'tablet' | 'mobile') => void
}

export function EditorPreview({ app, mode, onModeChange }: EditorPreviewProps) {
  const { elements, appId } = useEditor()
  const [key, setKey] = useState(0)

  const refresh = () => setKey(prev => prev + 1)

  // Convert editor elements to app format
  const appData = {
    id: appId || app?.id || 'preview',
    name: app?.name || 'Preview',
    slug: app?.slug || 'preview',
    app_type: app?.app_type || 'website',
    config: {
      elements: elements
    },
    theme_config: app?.theme_config || {},
    seo_config: app?.seo_config || {}
  }

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Preview Mode</span>
          <span className="text-xs text-muted-foreground capitalize">({mode})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={`/preview/${appId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1">
        <AppPreviewRenderer
          key={key}
          app={appData}
          device={mode}
          onDeviceChange={onModeChange}
          showControls={false}
          className="h-full"
        />
      </div>
    </div>
  )
}
