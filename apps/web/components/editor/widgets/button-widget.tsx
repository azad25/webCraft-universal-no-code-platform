'use client'

import { useRef, useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  ExternalLink, 
  Download, 
  Play, 
  Mail, 
  Phone, 
  FileText,
  Image,
  Video,
  Music,
  Database,
  Code,
  Link,
  Send,
  Save,
  Trash,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Upload,
  Share
} from 'lucide-react'
import { SmartLink } from '@/components/ui/smart-link'
import { getActionService } from '@/lib/action-service'
import { testDataSourceEndpoint } from '@/lib/data-source-api'

interface ButtonAction {
  type: 'navigate' | 'download' | 'email' | 'phone' | 'data-action' | 'media' | 'custom'
  target?: string
  dataSourceId?: string
  dataEndpointId?: string
  dataAction?: 'create' | 'update' | 'delete' | 'fetch' | 'filter' | 'search' | 'export'
  dataPayload?: Record<string, any>
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'file'
  customScript?: string
  openInNewTab?: boolean
  confirmMessage?: string
}

interface ButtonWidgetProps {
  // Basic properties
  text?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  alignment?: 'left' | 'center' | 'right'
  
  // Smart linking
  linkConfig?: {
    type: 'page' | 'section' | 'data' | 'custom' | 'external' | 'action'
    target: string
    label?: string
    openInNewTab?: boolean
    parameters?: Record<string, any>
    conditions?: string[]
    tracking?: {
      event: string
      properties?: Record<string, any>
    }
  }
  
  // Legacy support
  href?: string
  target?: string
  
  // Enhanced linking and actions (deprecated - use linkConfig)
  action?: ButtonAction
  link?: string
  
  // Data source integration for dynamic buttons
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Editor properties
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
}

const ICONS: Record<string, any> = {
  none: null,
  arrow: ArrowRight,
  external: ExternalLink,
  download: Download,
  play: Play,
  mail: Mail,
  phone: Phone,
  file: FileText,
  image: Image,
  video: Video,
  music: Music,
  database: Database,
  code: Code,
  link: Link,
  send: Send,
  save: Save,
  trash: Trash,
  edit: Edit,
  plus: Plus,
  minus: Minus,
  refresh: RefreshCw,
  search: Search,
  filter: Filter,
  upload: Upload,
  share: Share
}

export function ButtonWidget({
  // Basic props
  text = 'Click Me',
  variant = 'default',
  size = 'default',
  icon = 'none',
  iconPosition = 'right',
  fullWidth = false,
  alignment = 'left',
  
  // Smart linking
  linkConfig,
  
  // Legacy support
  href,
  target,
  action = { type: 'navigate', target: '#' },
  link,
  
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Editor props
  isEditing,
  isPreview,
  isSelected,
  elementId,
  onChange,
  onStyleChange
}: ButtonWidgetProps) {
  // Data source state
  const [buttonData, setButtonData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeText = (dataSourceId && buttonData?.text) || text
  const activeAction = (dataSourceId && buttonData?.action) || action
  const activeIcon = (dataSourceId && buttonData?.icon) || icon

  // Fetch data from data source
  const fetchButtonData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    
    try {
      const response = await testDataSourceEndpoint(dataSourceId, dataEndpointId || '', {})
      
      // Transform API response to button format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for button
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setButtonData({
          text: transformedData.text || transformedData.label || transformedData.title,
          action: transformedData.action || { type: 'navigate', target: transformedData.link || transformedData.url || '#' },
          icon: transformedData.icon || 'none'
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch button data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchButtonData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchButtonData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const textRef = useRef<HTMLSpanElement>(null)
  const [localText, setLocalText] = useState(activeText)
  const [inlineEditing, setInlineEditing] = useState(false)
  
  // Determine the final action (legacy support)
  const finalAction = link ? { type: 'navigate' as const, target: link } : activeAction
  const IconComponent = ICONS[activeIcon] || ICONS[icon]

  // Update local text when prop changes
  useEffect(() => {
    setLocalText(activeText)
  }, [activeText])

  // Handle button action execution
  const executeAction = async (e: React.MouseEvent) => {
    if (inlineEditing || isEditing) {
      e.preventDefault()
      return
    }

    // Show confirmation if required
    if (finalAction.confirmMessage) {
      if (!confirm(finalAction.confirmMessage)) {
        e.preventDefault()
        return
      }
    }

    setIsProcessing(true)

    try {
      switch (finalAction.type) {
        case 'navigate':
          if (finalAction.target) {
            if (finalAction.openInNewTab) {
              window.open(finalAction.target, '_blank')
            } else {
              window.location.href = finalAction.target
            }
          }
          break

        case 'download':
          if (finalAction.target) {
            const link = document.createElement('a')
            link.href = finalAction.target
            link.download = ''
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }
          break

        case 'email':
          if (finalAction.target) {
            window.location.href = `mailto:${finalAction.target}`
          }
          break

        case 'phone':
          if (finalAction.target) {
            window.location.href = `tel:${finalAction.target}`
          }
          break

        case 'data-action':
          if (finalAction.dataSourceId && finalAction.dataEndpointId) {
            await executeDataAction(finalAction)
          }
          break

        case 'media':
          if (finalAction.target) {
            if (finalAction.mediaType === 'image') {
              // Open image in lightbox or new tab
              window.open(finalAction.target, '_blank')
            } else if (finalAction.mediaType === 'video') {
              // Open video player
              window.open(finalAction.target, '_blank')
            } else {
              // Download or open file
              window.open(finalAction.target, '_blank')
            }
          }
          break

        case 'custom':
          if (finalAction.customScript) {
            // Execute custom JavaScript (be careful with security)
            try {
              new Function(finalAction.customScript)()
            } catch (err) {
              console.error('Custom script execution failed:', err)
            }
          }
          break
      }
    } catch (error) {
      console.error('Action execution failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Execute data source actions
  const executeDataAction = async (actionConfig: ButtonAction) => {
    if (!actionConfig.dataSourceId || !actionConfig.dataEndpointId) return

    try {
      const payload = actionConfig.dataPayload || {}
      
      switch (actionConfig.dataAction) {
        case 'create':
          await testDataSourceEndpoint(actionConfig.dataSourceId, actionConfig.dataEndpointId, payload)
          break
        case 'update':
          await testDataSourceEndpoint(actionConfig.dataSourceId, actionConfig.dataEndpointId, payload)
          break
        case 'delete':
          await testDataSourceEndpoint(actionConfig.dataSourceId, actionConfig.dataEndpointId, payload)
          break
        case 'fetch':
          await testDataSourceEndpoint(actionConfig.dataSourceId, actionConfig.dataEndpointId, payload)
          break
        case 'export':
          const data = await testDataSourceEndpoint(actionConfig.dataSourceId, actionConfig.dataEndpointId, payload)
          downloadAsJSON(data, 'export.json')
          break
      }
      
      // Refresh button data if needed
      if (dataSourceId) {
        await fetchButtonData()
      }
    } catch (error) {
      console.error('Data action failed:', error)
    }
  }

  // Helper function to download data as JSON
  const downloadAsJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const newText = e.currentTarget.innerText
    setLocalText(newText)
  }

  const handleBlur = () => {
    if (textRef.current && onChange) {
      const newText = textRef.current.innerText
      onChange({ text: newText })
      setInlineEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      textRef.current?.blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setLocalText(text) // Reset to original
      textRef.current?.blur()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.preventDefault()
      return
    }
    
    // Execute widget actions if available
    if (elementId) {
      const actionService = getActionService()
      if (actionService) {
        actionService.executeWidgetEvent(
          elementId,
          'click',
          {
            buttonText: localText,
            buttonVariant: variant,
            timestamp: Date.now()
          }
        ).catch(error => {
          console.error('Failed to execute button actions:', error)
          // Fallback to legacy action execution
          executeAction(e)
        })
        return
      }
    }
    
    // Fallback to legacy action execution
    executeAction(e)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreview) return
    e.preventDefault()
    e.stopPropagation()
    setInlineEditing(true)
  }

  // Start editing when Enter is pressed on selected element
  useEffect(() => {
    if (isSelected && !isPreview) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !inlineEditing) {
          e.preventDefault()
          setInlineEditing(true)
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelected, isPreview, inlineEditing])

  // Focus text when entering inline editing mode
  useEffect(() => {
    if (inlineEditing && textRef.current) {
      textRef.current.focus()
      // Select all text
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(textRef.current)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [inlineEditing])

  return (
    <div
      className={cn(
        "py-4 px-4",
        alignment === 'center' && "text-center",
        alignment === 'right' && "text-right"
      )}
    >
      {/* Data Source Indicator */}
      {dataSourceId && !isEditing && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            {dataSourceType === 'collection' ? 'Collection' : 
             dataSourceType === 'scraper' ? 'Scraper' : 'API'}
          </Badge>
          {isLoadingData && (
            <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      <m.div
        whileHover={!inlineEditing && !isEditing ? { scale: 1.02 } : undefined}
        whileTap={!inlineEditing && !isEditing ? { scale: 0.98 } : undefined}
        className={cn(fullWidth ? "w-full" : "inline-block")}
      >
        <SmartLink
          linkConfig={linkConfig}
          href={href || link}
          target={target}
          isPreview={isPreview}
          className={cn(fullWidth ? "w-full" : "inline-block")}
          onClick={handleClick}
        >
          <Button
            variant={variant}
            size={size}
            disabled={isProcessing || isLoadingData}
            className={cn(
              "gap-2 relative",
              fullWidth && "w-full",
              (inlineEditing || isEditing) && "cursor-text",
              isSelected && !inlineEditing && "ring-2 ring-primary/50"
            )}
            onDoubleClick={handleDoubleClick}
            asChild={false}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {IconComponent && iconPosition === 'left' && (
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                )}
                {inlineEditing ? (
                  <span
                    ref={textRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="outline-none min-w-[20px]"
                  >
                    {localText}
                  </span>
                ) : (
                  <span>{localText}</span>
                )}
                {IconComponent && iconPosition === 'right' && (
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                )}
              </>
            )}
          </Button>
        </SmartLink>
      </m.div>
      
      {/* Action Type Indicator */}
      {!isEditing && finalAction.type !== 'navigate' && (
        <div className="text-xs text-muted-foreground mt-1 text-center">
          {finalAction.type === 'data-action' && `Data: ${finalAction.dataAction}`}
          {finalAction.type === 'download' && 'Download'}
          {finalAction.type === 'email' && 'Email'}
          {finalAction.type === 'phone' && 'Phone'}
          {finalAction.type === 'media' && `Media: ${finalAction.mediaType}`}
          {finalAction.type === 'custom' && 'Custom Action'}
        </div>
      )}
    </div>
  )
}
