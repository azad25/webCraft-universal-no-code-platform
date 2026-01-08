'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Edit2, Check, Database, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface MetricWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Metric configuration
  label?: string
  value?: string
  change?: number
  changeLabel?: string
  prefix?: string
  suffix?: string
  variant?: 'simple' | 'card' | 'compact'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<MetricWidgetProps>) => void
}

export function MetricWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Metric props
  label = 'Total Revenue',
  value = '45,231',
  change = 12.5,
  changeLabel = 'vs last month',
  prefix = '$',
  suffix = '',
  variant = 'card',
  isEditing = false,
  isPreview = false,
  onChange
}: MetricWidgetProps) {
  // Data source state
  const [metricData, setMetricData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeLabel = (dataSourceId && metricData?.label) || label
  const activeValue = (dataSourceId && metricData?.value) || value
  const activeChange = (dataSourceId && metricData?.change !== undefined) ? metricData.change : change
  const activeChangeLabel = (dataSourceId && metricData?.changeLabel) || changeLabel
  const activePrefix = (dataSourceId && metricData?.prefix) || prefix
  const activeSuffix = (dataSourceId && metricData?.suffix) || suffix

  // Fetch data from data source
  const fetchMetricData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to metric format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for metric
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setMetricData({
          label: transformedData.label || transformedData.name || transformedData.title,
          value: transformedData.value || transformedData.amount || transformedData.count,
          change: transformedData.change || transformedData.growth || transformedData.percentage,
          changeLabel: transformedData.changeLabel || transformedData.period,
          prefix: transformedData.prefix || transformedData.currency,
          suffix: transformedData.suffix || transformedData.unit
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metric data')
      console.error('Failed to fetch metric data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchMetricData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchMetricData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchMetricData()
    }
  }

  const [showSettings, setShowSettings] = useState(false)

  const isPositive = activeChange > 0
  const isNeutral = activeChange === 0
  const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown

  const renderMetric = () => {
    const metricContent = (() => {
      switch (variant) {
        case 'simple':
          return (
            <div>
              <p className="text-sm text-muted-foreground">{activeLabel}</p>
              <p className="text-3xl font-bold">
                {activePrefix}{activeValue}{activeSuffix}
              </p>
              {activeChange !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 text-sm mt-1',
                  isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'
                )}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{isPositive ? '+' : ''}{activeChange}%</span>
                  {activeChangeLabel && <span className="text-muted-foreground">{activeChangeLabel}</span>}
                </div>
              )}
            </div>
          )

        case 'card':
          return (
            <div className="p-6 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{activeLabel}</p>
                {dataSourceId && !isEditing && (
                  <div className="flex items-center gap-1">
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
                )}
              </div>
              <p className="text-3xl font-bold mt-2">
                {activePrefix}{activeValue}{activeSuffix}
              </p>
              {activeChange !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 text-sm mt-2',
                  isPositive ? 'text-green-600' : isNeutral ? 'text-gray-500' : 'text-red-600'
                )}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{isPositive ? '+' : ''}{activeChange}%</span>
                  {activeChangeLabel && <span className="text-muted-foreground ml-1">{activeChangeLabel}</span>}
                </div>
              )}
            </div>
          )

        case 'compact':
          return (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div>
                <p className="text-sm text-muted-foreground">{activeLabel}</p>
                <p className="text-2xl font-bold">{activePrefix}{activeValue}{activeSuffix}</p>
              </div>
              <div className="flex items-center gap-2">
                {activeChange !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                    isPositive ? 'bg-green-100 text-green-700' : isNeutral ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                  )}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{isPositive ? '+' : ''}{activeChange}%</span>
                  </div>
                )}
                {dataSourceId && !isEditing && (
                  <Badge variant="outline" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    {dataSourceType === 'collection' ? 'Collection' : 
                     dataSourceType === 'scraper' ? 'Scraper' : 'API'}
                  </Badge>
                )}
              </div>
            </div>
          )

        default:
          return null
      }
    })()

    return metricContent
  }

  if (isEditing && !isPreview) {
    return (
      <div className="p-4 space-y-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <span className="font-medium">Metric Settings</span>
          <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </Button>
        </div>

        {showSettings && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={label} onChange={(e) => onChange?.({ label: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Prefix</Label>
                <Input value={prefix} onChange={(e) => onChange?.({ prefix: e.target.value })} placeholder="$" />
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input value={value} onChange={(e) => onChange?.({ value: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Suffix</Label>
                <Input value={suffix} onChange={(e) => onChange?.({ suffix: e.target.value })} placeholder="%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Change (%)</Label>
                <Input type="number" value={change} onChange={(e) => onChange?.({ change: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Change Label</Label>
                <Input value={changeLabel} onChange={(e) => onChange?.({ changeLabel: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Variant</Label>
              <select
                value={variant}
                onChange={(e) => onChange?.({ variant: e.target.value as any })}
                className="w-full mt-1 text-sm border rounded px-3 py-2"
              >
                <option value="simple">Simple</option>
                <option value="card">Card</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">{renderMetric()}</div>
      </div>
    )
  }

  return renderMetric()
}
