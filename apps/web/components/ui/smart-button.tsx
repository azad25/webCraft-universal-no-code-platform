'use client'

import { useState, useEffect } from 'react'
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
  Share,
  Eye,
  Copy,
  Heart,
  Star,
  MessageCircle,
  Bell,
  Settings,
  User,
  Home,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Zap,
  Shield,
  Lock,
  Unlock,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle
} from 'lucide-react'
import { ButtonAction, ButtonActionExecutor, SmartButtonProps } from '@/lib/button-actions'
import { testDataSourceEndpoint } from '@/lib/data-source-api'

const ICONS: Record<string, any> = {
  // Basic icons
  none: null,
  arrow: ArrowRight,
  external: ExternalLink,
  download: Download,
  play: Play,
  mail: Mail,
  phone: Phone,
  
  // File and media icons
  file: FileText,
  image: Image,
  video: Video,
  music: Music,
  
  // Action icons
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
  share: Share,
  eye: Eye,
  copy: Copy,
  
  // Social and interaction icons
  heart: Heart,
  star: Star,
  message: MessageCircle,
  bell: Bell,
  
  // Navigation and UI icons
  settings: Settings,
  user: User,
  home: Home,
  calendar: Calendar,
  clock: Clock,
  map: MapPin,
  globe: Globe,
  
  // Status and utility icons
  zap: Zap,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
  check: Check,
  x: X,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle
}

interface SmartButtonComponentProps extends SmartButtonProps {
  // Additional component-specific props
  className?: string
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  
  // Editor props
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  
  // Style props
  alignment?: 'left' | 'center' | 'right'
  
  // Animation props
  animate?: boolean
  
  // Legacy support
  action?: ButtonAction
  link?: string
}

export function SmartButton({
  text = 'Click Me',
  actions = [],
  variant = 'default',
  size = 'default',
  icon = 'none',
  iconPosition = 'right',
  fullWidth = false,
  disabled = false,
  loading = false,
  
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  
  // Context data
  contextData = {},
  
  // Component props
  className,
  children,
  onClick,
  
  // Editor props
  isEditing = false,
  isPreview = false,
  isSelected = false,
  
  // Style props
  alignment = 'left',
  
  // Animation props
  animate = true,
  
  // Legacy support
  action,
  link
}: SmartButtonComponentProps) {
  // State management
  const [buttonData, setButtonData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Create action executor
  const executor = new ButtonActionExecutor(contextData)

  // Use data source data if available, otherwise use static data
  const activeText = (dataSourceId && buttonData?.text) || text
  const activeIcon = (dataSourceId && buttonData?.icon) || icon
  const activeActions = (dataSourceId && buttonData?.actions) || actions

  // Legacy support - convert old action/link format to new actions array
  const finalActions = (() => {
    if (activeActions.length > 0) return activeActions
    if (action) return [action]
    if (link) return [{ type: 'navigate' as const, target: link }]
    return []
  })()

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
          icon: transformedData.icon || 'none',
          actions: transformedData.actions || (transformedData.action ? [transformedData.action] : [])
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

  // Handle button click
  const handleClick = async (e: React.MouseEvent) => {
    // Call custom onClick handler if provided
    if (onClick) {
      onClick(e)
    }

    // Don't execute actions in editing mode
    if (isEditing || !isPreview) {
      e.preventDefault()
      return
    }

    // Don't execute if disabled or loading
    if (disabled || loading || isProcessing) {
      e.preventDefault()
      return
    }

    // Execute all actions
    if (finalActions.length > 0) {
      e.preventDefault()
      setIsProcessing(true)
      
      try {
        for (const actionItem of finalActions) {
          await executor.executeAction(actionItem)
        }
      } catch (error) {
        console.error('Action execution failed:', error)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const IconComponent = ICONS[activeIcon] || ICONS[icon]
  const isLoading = loading || isLoadingData || isProcessing

  const buttonContent = (
    <>
      {isLoading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          {isProcessing ? 'Processing...' : 'Loading...'}
        </>
      ) : (
        <>
          {IconComponent && iconPosition === 'left' && (
            <IconComponent className="w-4 h-4 flex-shrink-0" />
          )}
          {children || <span>{activeText}</span>}
          {IconComponent && iconPosition === 'right' && (
            <IconComponent className="w-4 h-4 flex-shrink-0" />
          )}
        </>
      )}
    </>
  )

  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={cn(
        "gap-2 relative",
        fullWidth && "w-full",
        isSelected && "ring-2 ring-primary/50",
        className
      )}
      onClick={handleClick}
    >
      {buttonContent}
    </Button>
  )

  return (
    <div
      className={cn(
        "py-2",
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
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {animate && !isEditing ? (
        <m.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(fullWidth ? "w-full" : "inline-block")}
        >
          {buttonElement}
        </m.div>
      ) : (
        <div className={cn(fullWidth ? "w-full" : "inline-block")}>
          {buttonElement}
        </div>
      )}
      
      {/* Action Type Indicators */}
      {!isEditing && finalActions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-1">
          {finalActions.map((actionItem, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {actionItem.type === 'data-action' && `Data: ${actionItem.dataAction}`}
              {actionItem.type === 'navigate' && 'Navigate'}
              {actionItem.type === 'page' && 'Page'}
              {actionItem.type === 'download' && 'Download'}
              {actionItem.type === 'email' && 'Email'}
              {actionItem.type === 'phone' && 'Phone'}
              {actionItem.type === 'media' && `Media: ${actionItem.mediaType}`}
              {actionItem.type === 'modal' && 'Modal'}
              {actionItem.type === 'custom' && 'Custom'}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// Convenience components for common button types
export function NavigateButton({ to, children, ...props }: { to: string, children: React.ReactNode } & Omit<SmartButtonComponentProps, 'actions'>) {
  return (
    <SmartButton
      {...props}
      actions={[{ type: 'navigate', target: to }]}
      icon={props.icon || 'arrow'}
    >
      {children}
    </SmartButton>
  )
}

export function DownloadButton({ url, children, ...props }: { url: string, children: React.ReactNode } & Omit<SmartButtonComponentProps, 'actions'>) {
  return (
    <SmartButton
      {...props}
      actions={[{ type: 'download', target: url }]}
      icon={props.icon || 'download'}
    >
      {children}
    </SmartButton>
  )
}

export function DataActionButton({ 
  dataSourceId, 
  dataEndpointId, 
  action, 
  payload, 
  children, 
  ...props 
}: { 
  dataSourceId: string
  dataEndpointId: string
  action: 'create' | 'update' | 'delete' | 'fetch' | 'export'
  payload?: Record<string, any>
  children: React.ReactNode 
} & Omit<SmartButtonComponentProps, 'actions'>) {
  return (
    <SmartButton
      {...props}
      actions={[{ 
        type: 'data-action', 
        dataSourceId, 
        dataEndpointId, 
        dataAction: action,
        dataPayload: payload 
      }]}
      icon={props.icon || 'database'}
    >
      {children}
    </SmartButton>
  )
}

export function EmailButton({ email, children, ...props }: { email: string, children: React.ReactNode } & Omit<SmartButtonComponentProps, 'actions'>) {
  return (
    <SmartButton
      {...props}
      actions={[{ type: 'email', target: email }]}
      icon={props.icon || 'mail'}
    >
      {children}
    </SmartButton>
  )
}

export function PhoneButton({ phone, children, ...props }: { phone: string, children: React.ReactNode } & Omit<SmartButtonComponentProps, 'actions'>) {
  return (
    <SmartButton
      {...props}
      actions={[{ type: 'phone', target: phone }]}
      icon={props.icon || 'phone'}
    >
      {children}
    </SmartButton>
  )
}