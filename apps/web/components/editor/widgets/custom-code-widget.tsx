'use client'

import { useState, useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import { Code, Eye, EyeOff, AlertTriangle, ExternalLink, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CustomCodeWidgetProps {
  id: string
  props: {
    assetId?: string
    assetType: 'html' | 'css' | 'js'
    content?: string
    url?: string
    name?: string
    executeJs?: boolean
    injectCss?: boolean
  }
  style?: any
  isSelected?: boolean
  isPreview?: boolean
  onUpdate?: (updates: any) => void
  onSelect?: () => void
}

export function CustomCodeWidget({
  id,
  props,
  style,
  isSelected,
  isPreview,
  onUpdate,
  onSelect
}: CustomCodeWidgetProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExecuted, setIsExecuted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  const { assetType, content, name, executeJs = true, injectCss = true } = props

  // Execute JavaScript or inject CSS when component mounts or content changes
  useEffect(() => {
    if (!content || !isPreview) return

    setError(null)

    try {
      if (assetType === 'js' && executeJs && !isExecuted) {
        // Create a safe execution context
        const executeScript = () => {
          try {
            // Create a function to execute the code in a controlled environment
            const func = new Function('element', 'document', 'window', content)
            func(containerRef.current, document, window)
            setIsExecuted(true)
          } catch (jsError: any) {
            console.error('JavaScript execution error:', jsError)
            setError(`JavaScript Error: ${jsError.message}`)
          }
        }

        // Execute after a small delay to ensure DOM is ready
        setTimeout(executeScript, 100)
      }

      if (assetType === 'css' && injectCss) {
        // Inject CSS into the document head
        if (styleRef.current) {
          document.head.removeChild(styleRef.current)
        }

        const styleElement = document.createElement('style')
        styleElement.textContent = content
        styleElement.setAttribute('data-custom-asset-id', id)
        document.head.appendChild(styleElement)
        styleRef.current = styleElement
      }
    } catch (error: any) {
      console.error('Custom code execution error:', error)
      setError(`Execution Error: ${error.message}`)
    }

    // Cleanup function
    return () => {
      if (assetType === 'css' && styleRef.current) {
        try {
          document.head.removeChild(styleRef.current)
          styleRef.current = null
        } catch (e) {
          // Style element might have been removed already
        }
      }
    }
  }, [content, assetType, executeJs, injectCss, isPreview, id, isExecuted])

  const getIcon = () => {
    switch (assetType) {
      case 'html': return '🏗️'
      case 'css': return '🎨'
      case 'js': return '⚡'
      default: return '📄'
    }
  }

  const getTypeColor = () => {
    switch (assetType) {
      case 'html': return 'bg-orange-500'
      case 'css': return 'bg-blue-500'
      case 'js': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  // Editor mode (when not in preview)
  if (!isPreview) {
    return (
      <m.div
        ref={containerRef}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 min-h-[100px] transition-all",
          isSelected ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
          "cursor-pointer"
        )}
        onClick={onSelect}
        whileHover={{ scale: 1.01 }}
        style={style}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white text-xs", getTypeColor())}>
              <Code className="w-3 h-3" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{name || `Custom ${assetType.toUpperCase()}`}</h4>
              <Badge variant="outline" className="text-xs">
                {assetType.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(!showPreview)
              }}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Content Preview */}
        {showPreview && content && (
          <div className="space-y-2">
            {assetType === 'html' && (
              <div 
                className="border rounded p-2 bg-white min-h-[60px]"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
            
            {assetType === 'css' && (
              <div className="bg-muted rounded p-2">
                <code className="text-xs text-muted-foreground line-clamp-3">
                  {content.substring(0, 150)}...
                </code>
              </div>
            )}
            
            {assetType === 'js' && (
              <div className="bg-muted rounded p-2">
                <code className="text-xs text-muted-foreground line-clamp-3">
                  {content.substring(0, 150)}...
                </code>
                {isExecuted && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Script executed
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-700 font-medium">Execution Error</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Placeholder when no content */}
        {!content && (
          <div className="text-center py-4 text-muted-foreground">
            <div className="text-2xl mb-2">{getIcon()}</div>
            <p className="text-sm">Custom {assetType.toUpperCase()} Element</p>
            <p className="text-xs">Click to edit content</p>
          </div>
        )}
      </m.div>
    )
  }

  // Preview mode (live rendering)
  return (
    <div
      ref={containerRef}
      className="relative"
      style={style}
      data-element-id={id}
    >
      {assetType === 'html' && content && (
        <div dangerouslySetInnerHTML={{ __html: content }} />
      )}
      
      {assetType === 'css' && (
        <div className="p-4 border rounded bg-muted/50 text-center">
          <div className="text-2xl mb-2">🎨</div>
          <p className="text-sm text-muted-foreground">CSS styles applied globally</p>
        </div>
      )}
      
      {assetType === 'js' && (
        <div className="p-4 border rounded bg-muted/50 text-center">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-sm text-muted-foreground">
            JavaScript {isExecuted ? 'executed' : 'ready'}
          </p>
        </div>
      )}

      {error && (
        <div className="absolute top-2 right-2 p-2 bg-red-100 border border-red-300 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-red-700">Error</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Custom Code Widget with more features
export function EnhancedCustomCodeWidget({
  id,
  props,
  style,
  isSelected,
  isPreview,
  onUpdate,
  onSelect
}: CustomCodeWidgetProps) {
  const [settings, setSettings] = useState({
    executeJs: props.executeJs ?? true,
    injectCss: props.injectCss ?? true,
    showInEditor: true,
    sandbox: true
  })

  const handleSettingsUpdate = (newSettings: any) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    onUpdate?.({ ...props, ...newSettings })
  }

  return (
    <div className="relative">
      <CustomCodeWidget
        id={id}
        props={{ ...props, ...settings }}
        style={style}
        isSelected={isSelected}
        isPreview={isPreview}
        onUpdate={onUpdate}
        onSelect={onSelect}
      />

      {/* Settings Panel (when selected in editor) */}
      {isSelected && !isPreview && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-10 shadow-lg">
          <CardContent className="p-3">
            <h5 className="font-medium text-sm mb-2">Custom Code Settings</h5>
            <div className="space-y-2">
              {props.assetType === 'js' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.executeJs}
                    onChange={(e) => handleSettingsUpdate({ executeJs: e.target.checked })}
                  />
                  Execute JavaScript
                </label>
              )}
              
              {props.assetType === 'css' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.injectCss}
                    onChange={(e) => handleSettingsUpdate({ injectCss: e.target.checked })}
                  />
                  Inject CSS globally
                </label>
              )}
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showInEditor}
                  onChange={(e) => handleSettingsUpdate({ showInEditor: e.target.checked })}
                />
                Show in editor
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}