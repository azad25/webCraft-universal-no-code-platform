/**
 * Widget Data Source Integration Utility
 * Provides common data source functionality for all widgets
 */

import { useState, useEffect } from 'react'
import { fetchDataSourceData } from './data-source-api'
import { Loader2, Database, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface DataSourceProps {
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface DataSourceState<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  lastRefresh: Date | null
  refresh: () => void
}

/**
 * Hook for data source integration in widgets
 */
export function useDataSource<T>(
  props: DataSourceProps,
  transformFn: (apiData: any) => T[],
  staticData: T[],
  isEditing: boolean = false
): DataSourceState<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const { dataSourceId, dataEndpointId, dataSourceType, autoRefresh, refreshInterval } = props

  // Use data source data if available, otherwise use static data
  const activeData = dataSourceId && data.length > 0 ? data : staticData

  // Fetch data from data source
  const fetchData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      const transformedData = transformFn(response.data)
      setData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  return {
    data: activeData,
    isLoading,
    error,
    lastRefresh,
    refresh: fetchData
  }
}

/**
 * Common data transformers for different widget types
 */
export const dataTransformers = {
  // FAQ items
  faq: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any) => ({
        question: item.question || item.title || item.q || item.name,
        answer: item.answer || item.content || item.a || item.description || item.response
      }))
    }
    return []
  },

  // Pricing plans
  pricing: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any) => ({
        name: item.name || item.title || item.plan_name,
        price: parseFloat(item.price || item.cost || item.amount || 0),
        currency: item.currency || '$',
        period: item.period || item.billing_period || 'month',
        features: item.features || [],
        popular: item.popular || item.recommended || false,
        buttonText: item.button_text || 'Get Started',
        buttonUrl: item.button_url || item.link || '#'
      }))
    }
    return []
  },

  // Features list
  features: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any) => ({
        title: item.title || item.name || item.feature,
        description: item.description || item.details || item.content,
        icon: item.icon || 'star',
        image: item.image || item.thumbnail
      }))
    }
    return []
  },

  // Timeline events
  timeline: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any) => ({
        title: item.title || item.name || item.event,
        description: item.description || item.details || item.content,
        date: item.date || item.timestamp || item.created_at,
        status: item.status || 'completed'
      }))
    }
    return []
  },

  // Generic list items
  list: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any, index: number) => ({
        id: item.id || `item-${index}`,
        text: item.text || item.name || item.title || item.label || `Item ${index + 1}`,
        checked: item.checked || item.completed || false
      }))
    }
    return []
  },

  // Contact information
  contact: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData[0] || {}
    }
    return apiData || {}
  },

  // Social links
  social: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any) => ({
        platform: item.platform || item.name,
        url: item.url || item.link || item.href,
        username: item.username || item.handle
      }))
    }
    return []
  },

  // Table data - generic transformer for table rows
  table: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any, index: number) => ({
        id: item.id || `row-${index}`,
        ...item
      }))
    }
    return []
  },

  // Users data
  users: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any, index: number) => ({
        id: item.id || `user-${index}`,
        name: item.name || item.full_name || item.username || `User ${index + 1}`,
        email: item.email || item.email_address,
        status: item.status || item.active ? 'active' : 'inactive',
        role: item.role || item.user_role || 'user',
        created_at: item.created_at || item.date_joined || item.signup_date,
        avatar: item.avatar || item.profile_picture || item.image
      }))
    }
    return []
  },

  // Products data
  products: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any, index: number) => ({
        id: item.id || `product-${index}`,
        name: item.name || item.title || item.product_name,
        price: parseFloat(item.price || item.cost || item.amount || 0),
        currency: item.currency || '$',
        category: item.category || item.product_category,
        status: item.status || item.availability || 'available',
        stock: parseInt(item.stock || item.inventory || item.quantity || 0),
        image: item.image || item.thumbnail || item.photo,
        description: item.description || item.details
      }))
    }
    return []
  },

  // Orders data
  orders: (apiData: any) => {
    if (Array.isArray(apiData)) {
      return apiData.map((item: any, index: number) => ({
        id: item.id || item.order_id || `order-${index}`,
        customer: item.customer || item.customer_name || item.user_name,
        total: parseFloat(item.total || item.amount || item.order_total || 0),
        currency: item.currency || '$',
        status: item.status || item.order_status || 'pending',
        date: item.date || item.created_at || item.order_date,
        items: parseInt(item.items || item.item_count || 1)
      }))
    }
    return []
  }
}

/**
 * Common loading component
 */
export function DataSourceLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="w-full py-12 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

/**
 * Common error component
 */
export function DataSourceError({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry: () => void 
}) {
  return (
    <div className="w-full py-12 flex items-center justify-center">
      <div className="text-center">
        <Database className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 mb-2">Failed to load data</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

/**
 * Data source indicator badge
 */
export function DataSourceIndicator({ 
  dataSourceType, 
  isLoading, 
  lastRefresh, 
  onRefresh 
}: {
  dataSourceType?: 'api' | 'scraper' | 'collection'
  isLoading?: boolean
  lastRefresh?: Date | null
  onRefresh?: () => void
}) {
  if (!dataSourceType) return null

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        <Database className="w-3 h-3 mr-1" />
        {dataSourceType === 'collection' ? 'Collection' : 
         dataSourceType === 'scraper' ? 'Scraper' : 'API'}
      </Badge>
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      )}
      {lastRefresh && (
        <span className="text-xs text-muted-foreground">
          {lastRefresh.toLocaleTimeString()}
        </span>
      )}
      {onRefresh && (
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}