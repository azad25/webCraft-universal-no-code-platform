/**
 * Dynamic Menu Builder for Admin Panels and Navigation
 * Supports data source integration, role-based access, and dynamic routing
 */

import { ButtonAction } from './button-actions'
import { fetchDataSourceData } from './data-source-api'

export interface MenuItemConfig {
  id: string
  label: string
  icon?: string
  href?: string
  badge?: string | number
  children?: MenuItemConfig[]
  
  // Enhanced action configuration
  action?: ButtonAction
  
  // Data source binding
  dataSourceId?: string
  dataEndpointId?: string
  dataTransform?: string
  
  // Dynamic routing
  routeTemplate?: string // e.g., "/users/{{id}}"
  routeParams?: Record<string, string>
  
  // Conditional display
  condition?: string
  roles?: string[]
  permissions?: string[]
  
  // Styling and behavior
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  disabled?: boolean
  hidden?: boolean
  
  // Admin panel specific
  adminOnly?: boolean
  category?: string
  order?: number
  
  // Data binding for dynamic content
  bindToData?: {
    sourceId: string
    endpointId: string
    labelField?: string
    iconField?: string
    hrefField?: string
    childrenField?: string
    filterField?: string
    filterValue?: any
  }
}

export interface MenuBuilderConfig {
  // Data source for menu structure
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  
  // Menu templates
  template?: 'admin' | 'dashboard' | 'ecommerce' | 'cms' | 'custom'
  
  // User context
  userRole?: string
  userPermissions?: string[]
  userId?: string
  
  // Dynamic data context
  contextData?: Record<string, any>
  
  // Customization
  customItems?: MenuItemConfig[]
  excludeItems?: string[]
  
  // Behavior
  autoRefresh?: boolean
  refreshInterval?: number
  cacheTimeout?: number
}

export class MenuBuilder {
  private config: MenuBuilderConfig
  private cache: Map<string, { data: any, timestamp: number }> = new Map()

  constructor(config: MenuBuilderConfig) {
    this.config = config
  }

  async buildMenu(): Promise<MenuItemConfig[]> {
    let menuItems: MenuItemConfig[] = []

    // Load from data source if configured
    if (this.config.dataSourceId && this.config.dataEndpointId) {
      menuItems = await this.loadFromDataSource()
    }

    // Apply template if specified
    if (this.config.template && menuItems.length === 0) {
      menuItems = this.getTemplateMenu(this.config.template)
    }

    // Add custom items
    if (this.config.customItems) {
      menuItems = [...menuItems, ...this.config.customItems]
    }

    // Process dynamic data binding
    menuItems = await this.processDynamicBinding(menuItems)

    // Filter based on user context
    menuItems = this.filterByUserContext(menuItems)

    // Exclude specified items
    if (this.config.excludeItems) {
      menuItems = this.excludeItems(menuItems, this.config.excludeItems)
    }

    // Sort by order
    menuItems = this.sortByOrder(menuItems)

    return menuItems
  }

  private async loadFromDataSource(): Promise<MenuItemConfig[]> {
    if (!this.config.dataSourceId || !this.config.dataEndpointId) return []

    try {
      const cacheKey = `${this.config.dataSourceId}-${this.config.dataEndpointId}`
      const cached = this.cache.get(cacheKey)
      const cacheTimeout = this.config.cacheTimeout || 300000 // 5 minutes default

      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data
      }

      const response = await fetchDataSourceData(
        this.config.dataSourceId,
        this.config.dataEndpointId,
        {},
        true
      )

      let menuData = response.data
      if (!Array.isArray(menuData)) {
        menuData = [menuData]
      }

      const menuItems = menuData.map((item: any) => this.transformDataToMenuItem(item))

      // Cache the result
      this.cache.set(cacheKey, { data: menuItems, timestamp: Date.now() })

      return menuItems
    } catch (error) {
      console.error('Failed to load menu from data source:', error)
      return []
    }
  }

  private transformDataToMenuItem(data: any): MenuItemConfig {
    return {
      id: data.id || data._id || data.slug || Math.random().toString(36),
      label: data.label || data.title || data.name || 'Menu Item',
      icon: data.icon || 'menu',
      href: data.href || data.url || data.link,
      badge: data.badge || data.count,
      children: data.children ? data.children.map((child: any) => this.transformDataToMenuItem(child)) : undefined,
      action: data.action || (data.href ? { type: 'navigate', target: data.href } : undefined),
      condition: data.condition,
      roles: data.roles,
      permissions: data.permissions,
      adminOnly: data.adminOnly || data.admin_only,
      category: data.category,
      order: data.order || 0,
      disabled: data.disabled,
      hidden: data.hidden
    }
  }

  private async processDynamicBinding(items: MenuItemConfig[]): Promise<MenuItemConfig[]> {
    const processedItems: MenuItemConfig[] = []

    for (const item of items) {
      if (item.bindToData) {
        const dynamicItems = await this.createDynamicMenuItems(item)
        processedItems.push(...dynamicItems)
      } else {
        const processedItem = { ...item }
        if (item.children) {
          processedItem.children = await this.processDynamicBinding(item.children)
        }
        processedItems.push(processedItem)
      }
    }

    return processedItems
  }

  private async createDynamicMenuItems(template: MenuItemConfig): Promise<MenuItemConfig[]> {
    if (!template.bindToData) return [template]

    try {
      const { sourceId, endpointId, labelField, iconField, hrefField, childrenField, filterField, filterValue } = template.bindToData

      let params = {}
      if (filterField && filterValue !== undefined) {
        params = { [filterField]: filterValue }
      }

      const response = await fetchDataSourceData(sourceId, endpointId, params, true)
      let data = response.data

      if (!Array.isArray(data)) {
        data = [data]
      }

      return data.map((item: any, index: number) => ({
        ...template,
        id: `${template.id}-${item.id || index}`,
        label: item[labelField || 'name'] || item.title || item.label || `Item ${index + 1}`,
        icon: item[iconField || 'icon'] || template.icon,
        href: this.interpolateRoute(template.routeTemplate || hrefField ? item[hrefField] : undefined, item),
        badge: item.badge || item.count,
        children: childrenField && item[childrenField] ? 
          item[childrenField].map((child: any, childIndex: number) => ({
            id: `${template.id}-${item.id || index}-${child.id || childIndex}`,
            label: child[labelField || 'name'] || child.title || child.label,
            icon: child[iconField || 'icon'] || 'menu',
            href: this.interpolateRoute(template.routeTemplate, child),
            action: child.action || (child.href ? { type: 'navigate', target: child.href } : undefined)
          })) : undefined,
        action: template.action || {
          type: 'navigate',
          target: this.interpolateRoute(template.routeTemplate || item.href, item)
        },
        bindToData: undefined // Remove binding config from final item
      }))
    } catch (error) {
      console.error('Failed to create dynamic menu items:', error)
      return [template]
    }
  }

  private interpolateRoute(template: string | undefined, data: any): string {
    if (!template) return '#'
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }

  private filterByUserContext(items: MenuItemConfig[]): MenuItemConfig[] {
    return items.filter(item => {
      // Check admin only
      if (item.adminOnly && this.config.userRole !== 'admin') return false
      
      // Check user roles
      if (item.roles && !item.roles.includes(this.config.userRole || 'user')) return false
      
      // Check permissions
      if (item.permissions && this.config.userPermissions) {
        const hasPermission = item.permissions.some(permission => 
          this.config.userPermissions?.includes(permission)
        )
        if (!hasPermission) return false
      }
      
      // Check conditions
      if (item.condition) {
        try {
          const func = new Function(
            'contextData', 
            'userRole', 
            'userPermissions', 
            'userId',
            `return ${item.condition}`
          )
          if (!func(
            this.config.contextData, 
            this.config.userRole, 
            this.config.userPermissions, 
            this.config.userId
          )) return false
        } catch (error) {
          console.error('Condition evaluation failed:', error)
          return false
        }
      }
      
      // Check hidden flag
      if (item.hidden) return false
      
      return true
    }).map(item => ({
      ...item,
      children: item.children ? this.filterByUserContext(item.children) : undefined
    }))
  }

  private excludeItems(items: MenuItemConfig[], excludeIds: string[]): MenuItemConfig[] {
    return items.filter(item => !excludeIds.includes(item.id)).map(item => ({
      ...item,
      children: item.children ? this.excludeItems(item.children, excludeIds) : undefined
    }))
  }

  private sortByOrder(items: MenuItemConfig[]): MenuItemConfig[] {
    return items.sort((a, b) => (a.order || 0) - (b.order || 0)).map(item => ({
      ...item,
      children: item.children ? this.sortByOrder(item.children) : undefined
    }))
  }

  private getTemplateMenu(template: string): MenuItemConfig[] {
    switch (template) {
      case 'admin':
        return ADMIN_TEMPLATE
      case 'dashboard':
        return DASHBOARD_TEMPLATE
      case 'ecommerce':
        return ECOMMERCE_TEMPLATE
      case 'cms':
        return CMS_TEMPLATE
      default:
        return []
    }
  }
}

// Predefined menu templates
const ADMIN_TEMPLATE: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    action: { type: 'navigate', target: '/admin/dashboard' },
    order: 1
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    order: 2,
    children: [
      {
        id: 'all-users',
        label: 'All Users',
        icon: 'list',
        action: { type: 'navigate', target: '/admin/users' }
      },
      {
        id: 'add-user',
        label: 'Add User',
        icon: 'plus',
        action: { type: 'navigate', target: '/admin/users/new' }
      },
      {
        id: 'user-roles',
        label: 'Roles & Permissions',
        icon: 'shield',
        action: { type: 'navigate', target: '/admin/users/roles' },
        adminOnly: true
      }
    ]
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'file',
    order: 3,
    children: [
      {
        id: 'pages',
        label: 'Pages',
        icon: 'file',
        action: { type: 'navigate', target: '/admin/pages' }
      },
      {
        id: 'media',
        label: 'Media Library',
        icon: 'folder',
        action: { type: 'navigate', target: '/admin/media' }
      },
      {
        id: 'menus',
        label: 'Menus',
        icon: 'menu',
        action: { type: 'navigate', target: '/admin/menus' }
      }
    ]
  },
  {
    id: 'data',
    label: 'Data Sources',
    icon: 'database',
    order: 4,
    children: [
      {
        id: 'collections',
        label: 'Collections',
        icon: 'layers',
        action: { type: 'navigate', target: '/admin/collections' }
      },
      {
        id: 'apis',
        label: 'API Endpoints',
        icon: 'globe',
        action: { type: 'navigate', target: '/admin/apis' }
      },
      {
        id: 'scrapers',
        label: 'Web Scrapers',
        icon: 'search',
        action: { type: 'navigate', target: '/admin/scrapers' }
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'chart',
    action: { type: 'navigate', target: '/admin/analytics' },
    order: 5
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    action: { type: 'navigate', target: '/admin/settings' },
    order: 6,
    adminOnly: true
  }
]

const DASHBOARD_TEMPLATE: MenuItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'home',
    action: { type: 'navigate', target: '/dashboard' },
    order: 1
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'folder',
    action: { type: 'navigate', target: '/dashboard/projects' },
    order: 2
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: 'list',
    action: { type: 'navigate', target: '/dashboard/tasks' },
    order: 3
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: 'calendar',
    action: { type: 'navigate', target: '/dashboard/calendar' },
    order: 4
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'chart',
    action: { type: 'navigate', target: '/dashboard/reports' },
    order: 5
  }
]

const ECOMMERCE_TEMPLATE: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    action: { type: 'navigate', target: '/admin/dashboard' },
    order: 1
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'package',
    order: 2,
    children: [
      {
        id: 'all-products',
        label: 'All Products',
        icon: 'list',
        action: { type: 'navigate', target: '/admin/products' }
      },
      {
        id: 'add-product',
        label: 'Add Product',
        icon: 'plus',
        action: { type: 'navigate', target: '/admin/products/new' }
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: 'grid',
        action: { type: 'navigate', target: '/admin/categories' }
      }
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'cart',
    action: { type: 'navigate', target: '/admin/orders' },
    order: 3
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'users',
    action: { type: 'navigate', target: '/admin/customers' },
    order: 4
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'package',
    action: { type: 'navigate', target: '/admin/inventory' },
    order: 5
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'chart',
    action: { type: 'navigate', target: '/admin/analytics' },
    order: 6
  }
]

const CMS_TEMPLATE: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    action: { type: 'navigate', target: '/admin/dashboard' },
    order: 1
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'file',
    order: 2,
    children: [
      {
        id: 'posts',
        label: 'Posts',
        icon: 'file',
        action: { type: 'navigate', target: '/admin/posts' }
      },
      {
        id: 'pages',
        label: 'Pages',
        icon: 'file',
        action: { type: 'navigate', target: '/admin/pages' }
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: 'grid',
        action: { type: 'navigate', target: '/admin/categories' }
      },
      {
        id: 'tags',
        label: 'Tags',
        icon: 'tag',
        action: { type: 'navigate', target: '/admin/tags' }
      }
    ]
  },
  {
    id: 'media',
    label: 'Media',
    icon: 'folder',
    action: { type: 'navigate', target: '/admin/media' },
    order: 3
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    action: { type: 'navigate', target: '/admin/users' },
    order: 4
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: 'message',
    action: { type: 'navigate', target: '/admin/comments' },
    order: 5
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    action: { type: 'navigate', target: '/admin/settings' },
    order: 6
  }
]

// Utility functions
export function createMenuBuilder(config: MenuBuilderConfig): MenuBuilder {
  return new MenuBuilder(config)
}

export function createDynamicMenuItem(
  template: Omit<MenuItemConfig, 'id'>,
  dataSourceId: string,
  dataEndpointId: string,
  options?: {
    labelField?: string
    iconField?: string
    hrefField?: string
    routeTemplate?: string
  }
): MenuItemConfig {
  return {
    ...template,
    id: `dynamic-${Math.random().toString(36)}`,
    bindToData: {
      sourceId: dataSourceId,
      endpointId: dataEndpointId,
      labelField: options?.labelField,
      iconField: options?.iconField,
      hrefField: options?.hrefField
    },
    routeTemplate: options?.routeTemplate
  }
}