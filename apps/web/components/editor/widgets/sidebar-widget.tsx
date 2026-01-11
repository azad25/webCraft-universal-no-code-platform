'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmartButton } from '@/components/ui/smart-button'
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  RefreshCw, 
  Loader2,
  Home,
  Settings,
  User,
  FileText,
  BarChart3,
  Users,
  Mail,
  Calendar,
  Folder,
  Search,
  Bell,
  Heart,
  Star,
  ShoppingCart,
  CreditCard,
  Truck,
  Package,
  Zap,
  Shield,
  Globe,
  Code,
  Layers,
  Grid,
  List,
  Filter,
  Plus,
  Edit,
  Trash,
  Eye,
  Download,
  Upload,
  Share,
  Copy,
  Link,
  ExternalLink
} from 'lucide-react'
import { testDataSourceEndpoint } from '@/lib/data-source-api'
import { ButtonAction } from '@/lib/button-actions'
import { MenuBuilder, MenuItemConfig, createMenuBuilder } from '@/lib/menu-builder'

const SIDEBAR_ICONS: Record<string, any> = {
  home: Home,
  settings: Settings,
  user: User,
  users: Users,
  file: FileText,
  chart: BarChart3,
  mail: Mail,
  calendar: Calendar,
  folder: Folder,
  search: Search,
  bell: Bell,
  heart: Heart,
  star: Star,
  cart: ShoppingCart,
  card: CreditCard,
  truck: Truck,
  package: Package,
  zap: Zap,
  shield: Shield,
  globe: Globe,
  code: Code,
  layers: Layers,
  grid: Grid,
  list: List,
  filter: Filter,
  plus: Plus,
  edit: Edit,
  trash: Trash,
  eye: Eye,
  download: Download,
  upload: Upload,
  share: Share,
  copy: Copy,
  link: Link,
  external: ExternalLink,
  menu: Menu
}

interface SidebarMenuItem extends MenuItemConfig {
  // Additional sidebar-specific properties can be added here
}

interface SidebarWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Sidebar configuration
  title?: string
  logo?: string
  logoText?: string
  items?: SidebarMenuItem[]
  
  // Layout options
  position?: 'left' | 'right'
  width?: 'sm' | 'md' | 'lg' | 'xl'
  collapsible?: boolean
  defaultCollapsed?: boolean
  overlay?: boolean
  
  // Styling
  variant?: 'default' | 'dark' | 'light' | 'glass'
  showBorder?: boolean
  
  // Menu builder configuration
  menuTemplate?: 'admin' | 'dashboard' | 'ecommerce' | 'cms' | 'custom'
  dynamicMenuItems?: boolean
  menuBuilder?: MenuBuilder
  
  // Admin panel mode
  adminMode?: boolean
  userRole?: string
  
  // Context data for dynamic actions
  contextData?: Record<string, any>
  
  // Editor properties
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function SidebarWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Sidebar props
  title = 'Navigation',
  logo,
  logoText = 'Admin Panel',
  items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home',
      action: { type: 'navigate', target: '/dashboard' }
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'users',
      badge: '12',
      children: [
        {
          id: 'all-users',
          label: 'All Users',
          icon: 'list',
          action: { type: 'navigate', target: '/users' }
        },
        {
          id: 'add-user',
          label: 'Add User',
          icon: 'plus',
          action: { type: 'navigate', target: '/users/new' }
        }
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: 'file',
      children: [
        {
          id: 'pages',
          label: 'Pages',
          icon: 'file',
          action: { type: 'navigate', target: '/pages' }
        },
        {
          id: 'media',
          label: 'Media',
          icon: 'folder',
          action: { type: 'navigate', target: '/media' }
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'chart',
      action: { type: 'navigate', target: '/analytics' }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      action: { type: 'navigate', target: '/settings' }
    }
  ],
  
  // Layout props
  position = 'left',
  width = 'md',
  collapsible = true,
  defaultCollapsed = false,
  overlay = false,
  
  // Styling props
  variant = 'default',
  showBorder = true,
  
  // Menu builder props
  menuTemplate = 'custom',
  dynamicMenuItems = false,
  menuBuilder,
  
  // Admin props
  adminMode = false,
  userRole = 'user',
  
  // Context props
  contextData = {},
  
  // Editor props
  isEditing,
  isPreview,
  onChange
}: SidebarWidgetProps) {
  // State management
  const [sidebarData, setSidebarData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isVisible, setIsVisible] = useState(!overlay)
  const [builtMenuItems, setBuiltMenuItems] = useState<SidebarMenuItem[]>([])

  // Create menu builder instance
  const activeMenuBuilder = menuBuilder || createMenuBuilder({
    dataSourceId,
    dataEndpointId,
    dataSourceType,
    template: menuTemplate,
    userRole,
    contextData,
    autoRefresh,
    refreshInterval
  })

  // Use data source data if available, otherwise use static data
  const activeTitle = (dataSourceId && sidebarData?.title) || title
  const activeLogoText = (dataSourceId && sidebarData?.logoText) || logoText
  const activeItems = builtMenuItems.length > 0 ? builtMenuItems : 
                     (dataSourceId && sidebarData?.items) || items

  // Build dynamic menu
  const buildMenu = async () => {
    if (dynamicMenuItems || menuTemplate !== 'custom') {
      try {
        const menuItems = await activeMenuBuilder.buildMenu()
        setBuiltMenuItems(menuItems as SidebarMenuItem[])
      } catch (error) {
        console.error('Failed to build menu:', error)
      }
    }
  }

  // Initial menu build
  useEffect(() => {
    if (!isEditing) {
      buildMenu()
    }
  }, [menuTemplate, dynamicMenuItems, userRole, contextData, isEditing])

  // Fetch data from data source
  const fetchSidebarData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    
    try {
      const response = await testDataSourceEndpoint(dataSourceId, dataEndpointId || '', {})
      
      // Transform API response to sidebar format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for sidebar config
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setSidebarData({
          title: transformedData.title || transformedData.name,
          logoText: transformedData.logoText || transformedData.brand,
          items: transformedData.items || transformedData.menu || transformedData.navigation || []
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch sidebar data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchSidebarData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchSidebarData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchSidebarData()
    }
  }

  // Toggle expanded state for menu items
  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  // Filter items based on user role and conditions
  const filterItems = (items: SidebarMenuItem[]): SidebarMenuItem[] => {
    return items.filter(item => {
      // Check admin only
      if (item.adminOnly && !adminMode) return false
      
      // Check user roles
      if (item.roles && !item.roles.includes(userRole)) return false
      
      // Check conditions
      if (item.condition) {
        try {
          const func = new Function('contextData', 'userRole', `return ${item.condition}`)
          if (!func(contextData, userRole)) return false
        } catch (error) {
          console.error('Condition evaluation failed:', error)
          return false
        }
      }
      
      return true
    }).map(item => ({
      ...item,
      children: item.children ? filterItems(item.children) : undefined
    }))
  }

  const filteredItems = filterItems(activeItems)

  // Render menu item
  const renderMenuItem = (item: SidebarMenuItem, level = 0) => {
    const IconComponent = SIDEBAR_ICONS[item.icon || 'menu']
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const indent = level * 16

    return (
      <div key={item.id} className="w-full">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer group",
            "hover:bg-accent hover:text-accent-foreground",
            item.className
          )}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            }
          }}
        >
          {/* Menu Item Content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {IconComponent && (
              <IconComponent className={cn(
                "flex-shrink-0",
                isCollapsed ? "w-5 h-5" : "w-4 h-4"
              )} />
            )}
            
            {!isCollapsed && (
              <>
                <span className="font-medium truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          {hasChildren && !isCollapsed && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}

          {/* Action Button Overlay */}
          {item.action && !hasChildren && (
            <div className="absolute inset-0">
              <SmartButton
                actions={[item.action]}
                className="w-full h-full justify-start bg-transparent hover:bg-accent border-none shadow-none"
                variant="ghost"
                isPreview={isPreview}
                isEditing={isEditing}
                contextData={contextData}
              >
                <span className="sr-only">{item.label}</span>
              </SmartButton>
            </div>
          )}
        </div>

        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && isExpanded && !isCollapsed && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="py-1">
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Width classes
  const widthClasses = {
    sm: isCollapsed ? 'w-16' : 'w-48',
    md: isCollapsed ? 'w-16' : 'w-64',
    lg: isCollapsed ? 'w-16' : 'w-80',
    xl: isCollapsed ? 'w-16' : 'w-96'
  }

  // Variant classes
  const variantClasses = {
    default: 'bg-background border-border',
    dark: 'bg-gray-900 text-white border-gray-800',
    light: 'bg-white text-gray-900 border-gray-200',
    glass: 'bg-background/80 backdrop-blur-sm border-border/50'
  }

  const sidebarContent = (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300",
        widthClasses[width],
        variantClasses[variant],
        showBorder && "border-r",
        position === 'right' && showBorder && "border-l border-r-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          {logo ? (
            <img src={logo} alt={activeLogoText} className="w-8 h-8 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                {activeLogoText.charAt(0)}
              </span>
            </div>
          )}
          
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold truncate">{activeLogoText}</h2>
              {activeTitle !== activeLogoText && (
                <p className="text-xs text-muted-foreground truncate">{activeTitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Data Source Indicator */}
      {dataSourceId && !isEditing && !isCollapsed && (
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {dataSourceType === 'collection' ? 'Collection' : 
               dataSourceType === 'scraper' ? 'Scraper' : 'API'}
            </Badge>
            {isLoadingData && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
            {lastRefresh && (
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoadingData}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {filteredItems.map(item => renderMenuItem(item))}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && adminMode && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            Role: {userRole}
          </div>
        </div>
      )}
    </div>
  )

  // Overlay sidebar
  if (overlay) {
    return (
      <>
        {/* Overlay Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className={cn(
            "fixed top-4 z-50",
            position === 'left' ? 'left-4' : 'right-4'
          )}
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Overlay Background */}
        <AnimatePresence>
          {isVisible && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsVisible(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {isVisible && (
            <m.div
              initial={{ 
                x: position === 'left' ? '-100%' : '100%',
                opacity: 0 
              }}
              animate={{ 
                x: 0,
                opacity: 1 
              }}
              exit={{ 
                x: position === 'left' ? '-100%' : '100%',
                opacity: 0 
              }}
              className={cn(
                "fixed top-0 h-full z-50",
                position === 'left' ? 'left-0' : 'right-0'
              )}
            >
              {sidebarContent}
            </m.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Static sidebar
  return (
    <div
      className={cn(
        "h-full",
        position === 'left' ? 'order-first' : 'order-last'
      )}
    >
      {sidebarContent}
    </div>
  )
}