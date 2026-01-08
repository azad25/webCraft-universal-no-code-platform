'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, Circle, ChevronRight, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface ListItem {
  id: string
  text: string
  checked?: boolean
}

interface ListWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // List configuration
  items?: ListItem[]
  listType?: 'bullet' | 'numbered' | 'check' | 'arrow'
  fontSize?: string
  color?: string
  spacing?: 'tight' | 'normal' | 'relaxed'
  textField?: string // Field name to use for list text
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultItems: ListItem[] = [
  { id: '1', text: 'First item in the list' },
  { id: '2', text: 'Second item in the list' },
  { id: '3', text: 'Third item in the list' }
]

export function ListWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // List props
  items = defaultItems,
  listType = 'bullet',
  fontSize = '16px',
  color = '#333333',
  spacing = 'normal',
  textField = 'text',
  isEditing = false,
  onChange
}: ListWidgetProps) {
  // Data source state
  const [listData, setListData] = useState<ListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeItems = dataSourceId && listData.length > 0 ? listData : items

  // Fetch data from data source
  const fetchListData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to list format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          text: item[textField] || item.name || item.title || item.label || `Item ${index + 1}`,
          checked: item.checked || item.completed || false
        }))
      } else if (transformedData && typeof transformedData === 'object') {
        // Single item
        transformedData = [{
          id: transformedData.id || 'item-1',
          text: transformedData[textField] || transformedData.name || 'Single Item',
          checked: transformedData.checked || false
        }]
      } else {
        transformedData = []
      }
      
      setListData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list data')
      console.error('Failed to fetch list data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchListData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchListData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchListData()
    }
  }
  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-4'
  }

  const renderIcon = (index: number, item: ListItem) => {
    switch (listType) {
      case 'numbered':
        return <span className="font-semibold mr-3">{index + 1}.</span>
      case 'check':
        return <Check className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
      case 'arrow':
        return <ChevronRight className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
      default:
        return <Circle className="w-2 h-2 mr-3 fill-current flex-shrink-0" />
    }
  }

  // Loading state
  if (isLoading && activeItems.length === 0 && !isEditing) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading list...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">Failed to load list</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4">
      {/* Header */}
      {dataSourceId && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {dataSourceType === 'collection' ? 'Collection' : 
               dataSourceType === 'scraper' ? 'Scraper' : 'API'}
            </Badge>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <ul
        className={cn("w-full", spacingClasses[spacing])}
        style={{ fontSize, color }}
      >
        {activeItems.map((item, index) => (
          <li key={item.id} className="flex items-start">
            {renderIcon(index, item)}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      
      {activeItems.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No items available</p>
        </div>
      )}
    </div>
  )
}
