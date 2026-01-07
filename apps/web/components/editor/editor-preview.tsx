'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Tablet, Monitor, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'
import { WidgetRenderer } from './widget-renderer'

interface EditorPreviewProps {
  app: any
  mode: 'desktop' | 'tablet' | 'mobile'
}

const deviceDimensions = {
  desktop: { width: '100%', maxWidth: '1200px', height: '100%' },
  tablet: { width: '768px', maxWidth: '768px', height: '1024px' },
  mobile: { width: '375px', maxWidth: '375px', height: '812px' }
}

export function EditorPreview({ app, mode }: EditorPreviewProps) {
  const { elements } = useEditor()
  const [key, setKey] = useState(0)

  const refresh = () => setKey(prev => prev + 1)

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
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-white dark:bg-slate-800 shadow-2xl rounded-lg overflow-hidden",
            mode === 'mobile' && "rounded-[40px] border-8 border-slate-800"
          )}
          style={{
            width: deviceDimensions[mode].width,
            maxWidth: deviceDimensions[mode].maxWidth,
            minHeight: mode === 'desktop' ? '800px' : deviceDimensions[mode].height
          }}
        >
          {/* Device Frame for Mobile */}
          {mode === 'mobile' && (
            <div className="h-6 bg-slate-800 flex items-center justify-center">
              <div className="w-20 h-4 bg-slate-700 rounded-full" />
            </div>
          )}

          {/* Preview Content */}
          <div className="relative min-h-full">
            {elements.map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                  zIndex: element.zIndex || 1
                }}
              >
                <WidgetRenderer
                  element={element}
                  isSelected={false}
                  isHovered={false}
                  onSelect={() => {}}
                  onMove={() => {}}
                  onResize={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ))}

            {elements.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                <p>No content to preview</p>
              </div>
            )}
          </div>

          {/* Device Frame Bottom for Mobile */}
          {mode === 'mobile' && (
            <div className="h-8 bg-slate-800 flex items-center justify-center">
              <div className="w-32 h-1 bg-slate-600 rounded-full" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
