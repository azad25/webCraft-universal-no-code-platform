'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Treemap, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { Database, RefreshCw, Loader2, BarChart3, TrendingUp, PieChart as PieIcon, Activity, Target, Layers, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface ChartWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Chart configuration
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'composed' | 'treemap' | 'funnel' | 'donut' | 'stacked-bar' | 'stacked-area' | 'horizontal-bar'
  data?: ChartData[]
  title?: string
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  showLabels?: boolean
  xAxisKey?: string
  yAxisKey?: string
  secondaryYAxisKey?: string
  groupByKey?: string
  
  // Chart styling
  height?: number
  borderRadius?: number
  strokeWidth?: number
  fillOpacity?: number
  
  // Animation
  animationDuration?: number
  animationEasing?: string
  
  // Aggregation
  aggregationType?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultData: ChartData[] = [
  { name: 'Jan', value: 400, secondary: 240, category: 'Q1', growth: 12 },
  { name: 'Feb', value: 300, secondary: 139, category: 'Q1', growth: -5 },
  { name: 'Mar', value: 200, secondary: 980, category: 'Q1', growth: 8 },
  { name: 'Apr', value: 278, secondary: 390, category: 'Q2', growth: 15 },
  { name: 'May', value: 189, secondary: 480, category: 'Q2', growth: -3 },
  { name: 'Jun', value: 239, secondary: 380, category: 'Q2', growth: 22 },
  { name: 'Jul', value: 349, secondary: 430, category: 'Q3', growth: 18 },
  { name: 'Aug', value: 200, secondary: 290, category: 'Q3', growth: -8 },
  { name: 'Sep', value: 278, secondary: 380, category: 'Q3', growth: 25 },
  { name: 'Oct', value: 189, secondary: 480, category: 'Q4', growth: 12 },
  { name: 'Nov', value: 239, secondary: 380, category: 'Q4', growth: 30 },
  { name: 'Dec', value: 349, secondary: 430, category: 'Q4', growth: 35 }
]

const defaultColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#f43f5e'
]

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { value: 'horizontal-bar', label: 'Horizontal Bar', icon: BarChart3, description: 'Horizontal bar comparison' },
  { value: 'stacked-bar', label: 'Stacked Bar', icon: BarChart3, description: 'Stacked bar comparison' },
  { value: 'line', label: 'Line Chart', icon: TrendingUp, description: 'Show trends over time' },
  { value: 'area', label: 'Area Chart', icon: Activity, description: 'Filled area under line' },
  { value: 'stacked-area', label: 'Stacked Area', icon: Activity, description: 'Multiple stacked areas' },
  { value: 'pie', label: 'Pie Chart', icon: PieIcon, description: 'Show proportions of a whole' },
  { value: 'donut', label: 'Donut Chart', icon: PieIcon, description: 'Pie chart with center hole' },
  { value: 'scatter', label: 'Scatter Plot', icon: Target, description: 'Show correlation between variables' },
  { value: 'radar', label: 'Radar Chart', icon: Target, description: 'Multi-dimensional data comparison' },
  { value: 'composed', label: 'Composed Chart', icon: Layers, description: 'Combine multiple chart types' },
  { value: 'treemap', label: 'Treemap', icon: Layers, description: 'Hierarchical data visualization' },
  { value: 'funnel', label: 'Funnel Chart', icon: Target, description: 'Show conversion rates' }
]

export function ChartWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Chart props
  chartType = 'bar',
  data = defaultData,
  title = 'Chart Title',
  colors = defaultColors,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showLabels = false,
  xAxisKey = 'name',
  yAxisKey = 'value',
  secondaryYAxisKey = 'secondary',
  groupByKey,
  
  // Styling
  height = 400,
  borderRadius = 4,
  strokeWidth = 2,
  fillOpacity = 0.8,
  
  // Animation
  animationDuration = 1000,
  animationEasing = 'ease',
  
  // Aggregation
  aggregationType = 'sum',
  
  isEditing = false,
  onChange
}: ChartWidgetProps) {
  // Data source state
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeData = dataSourceId && chartData.length > 0 ? chartData : data

  // Fetch data from data source
  const fetchChartData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId || '', {}, true)
      
      // Transform API response to chart format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any, index: number) => {
          // Try to map common field names to chart format
          const chartItem: ChartData = {
            name: item.name || item.label || item.category || item.date || `Item ${index + 1}`,
            value: parseFloat(item.value || item.amount || item.count || item.total || 0),
            ...item // Include all original fields
          }
          return chartItem
        })
      } else if (transformedData && typeof transformedData === 'object') {
        // Single data point
        const item = transformedData as any
        transformedData = [{
          name: item.name || 'Data Point',
          value: parseFloat(item.value || item.amount || 0),
          ...item
        }]
      } else {
        transformedData = []
      }
      
      setChartData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data')
      console.error('Failed to fetch chart data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchChartData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchChartData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchChartData()
    }
  }

  // Data processing and aggregation
  const processChartData = (rawData: ChartData[]) => {
    if (!groupByKey || !aggregationType) return rawData

    const grouped = rawData.reduce((acc, item) => {
      const key = item[groupByKey]
      if (!acc[key]) {
        acc[key] = { name: key, items: [] }
      }
      acc[key].items.push(item)
      return acc
    }, {} as Record<string, { name: string; items: ChartData[] }>)

    return Object.values(grouped).map(group => {
      const aggregatedValue = aggregateValues(group.items, yAxisKey, aggregationType)
      const aggregatedSecondary = secondaryYAxisKey ? 
        aggregateValues(group.items, secondaryYAxisKey, aggregationType) : undefined

      const result: ChartData = {
        name: group.name,
        value: aggregatedValue,
        count: group.items.length
      }

      // Add other properties from first item, avoiding conflicts
      Object.keys(group.items[0] || {}).forEach(key => {
        if (key !== 'name' && key !== 'value') {
          result[key] = group.items[0][key]
        }
      })

      if (aggregatedSecondary !== undefined) {
        result[secondaryYAxisKey] = aggregatedSecondary
      }

      return result
    })
  }

  const aggregateValues = (items: ChartData[], key: string, type: string): number => {
    const values = items.map(item => parseFloat(item[key]) || 0)
    
    switch (type) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0)
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length
      case 'count':
        return values.length
      case 'min':
        return Math.min(...values)
      case 'max':
        return Math.max(...values)
      default:
        return values.reduce((sum, val) => sum + val, 0)
    }
  }

  // Process the active data
  const processedData = processChartData(activeData)

  // Loading state
  if (isLoading && activeData.length === 0 && !isEditing) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <div className="w-full h-64 flex items-center justify-center border rounded-lg">
        <div className="text-center">
          <Database className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">Failed to load chart data</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }
  const renderChart = () => {
    const chartData = processedData
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke={colors[0]} 
              strokeWidth={strokeWidth}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              animationDuration={animationDuration}
            />
            {(chartData[0] as any)?.[secondaryYAxisKey] && (
              <Line 
                type="monotone" 
                dataKey={secondaryYAxisKey} 
                stroke={colors[1]} 
                strokeWidth={strokeWidth}
                dot={{ fill: colors[1], strokeWidth: 2, r: 4 }}
                animationDuration={animationDuration}
              />
            )}
          </LineChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
              animationDuration={animationDuration}
            />
          </AreaChart>
        )

      case 'stacked-area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={yAxisKey} 
              stackId="1"
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={fillOpacity}
              animationDuration={animationDuration}
            />
            {chartData[0]?.[secondaryYAxisKey] && (
              <Area 
                type="monotone" 
                dataKey={secondaryYAxisKey} 
                stackId="1"
                stroke={colors[1]} 
                fill={colors[1]}
                fillOpacity={fillOpacity}
                animationDuration={animationDuration}
              />
            )}
          </AreaChart>
        )
      
      case 'horizontal-bar':
        return (
          <BarChart {...commonProps} layout="horizontal">
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis type="number" />
            <YAxis dataKey={xAxisKey} type="category" />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar 
              dataKey={yAxisKey} 
              fill={colors[0]} 
              radius={[0, borderRadius, borderRadius, 0]}
              animationDuration={animationDuration}
            >
              {showLabels && <LabelList dataKey={yAxisKey} position="right" />}
            </Bar>
          </BarChart>
        )

      case 'stacked-bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar 
              dataKey={yAxisKey} 
              stackId="a"
              fill={colors[0]} 
              radius={[borderRadius, borderRadius, 0, 0]}
              animationDuration={animationDuration}
            />
            {chartData[0]?.[secondaryYAxisKey] && (
              <Bar 
                dataKey={secondaryYAxisKey} 
                stackId="a"
                fill={colors[1]} 
                radius={[borderRadius, borderRadius, 0, 0]}
                animationDuration={animationDuration}
              />
            )}
          </BarChart>
        )
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey={yAxisKey}
              label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
              animationDuration={animationDuration}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        )

      case 'donut':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey={yAxisKey}
              label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
              animationDuration={animationDuration}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        )
      
      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} type="number" />
            <YAxis dataKey={yAxisKey} type="number" />
            {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {showLegend && <Legend />}
            <Scatter 
              name="Data Points" 
              data={chartData} 
              fill={colors[0]}
              animationDuration={animationDuration}
            />
          </ScatterChart>
        )
      
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xAxisKey} />
            <PolarRadiusAxis />
            <Radar
              name="Values"
              dataKey={yAxisKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
              animationDuration={animationDuration}
            />
            {chartData[0]?.[secondaryYAxisKey] && (
              <Radar
                name="Secondary"
                dataKey={secondaryYAxisKey}
                stroke={colors[1]}
                fill={colors[1]}
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
                animationDuration={animationDuration}
              />
            )}
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </RadarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar 
              dataKey={yAxisKey} 
              fill={colors[0]} 
              radius={[borderRadius, borderRadius, 0, 0]}
              animationDuration={animationDuration}
            />
            {chartData[0]?.[secondaryYAxisKey] && (
              <Line 
                type="monotone" 
                dataKey={secondaryYAxisKey} 
                stroke={colors[1]} 
                strokeWidth={strokeWidth}
                animationDuration={animationDuration}
              />
            )}
          </ComposedChart>
        )

      case 'treemap':
        return (
          <Treemap
            width={400}
            height={300}
            data={chartData}
            dataKey={yAxisKey}
            stroke="#fff"
            fill={colors[0]}
          >
            {showTooltip && <Tooltip />}
          </Treemap>
        )

      case 'funnel':
        return (
          <FunnelChart width={400} height={300}>
            <Funnel
              dataKey={yAxisKey}
              data={chartData}
              isAnimationActive={true}
              animationDuration={animationDuration}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
              {showLabels && <LabelList position="center" fill="#fff" stroke="none" />}
            </Funnel>
            {showTooltip && <Tooltip />}
          </FunnelChart>
        )
      
      default: // bar chart
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar 
              dataKey={yAxisKey} 
              fill={colors[0]} 
              radius={[borderRadius, borderRadius, 0, 0]}
              animationDuration={animationDuration}
            >
              {showLabels && <LabelList dataKey={yAxisKey} position="top" />}
            </Bar>
            {chartData[0]?.[secondaryYAxisKey] && (
              <Bar 
                dataKey={secondaryYAxisKey} 
                fill={colors[1]} 
                radius={[borderRadius, borderRadius, 0, 0]}
                animationDuration={animationDuration}
              />
            )}
          </BarChart>
        )
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  // Editing interface
  if (isEditing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="animation">Animation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <div>
                <Label>Chart Type</Label>
                <Select value={chartType} onValueChange={(value) => handleInputChange('chartType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Chart Title</Label>
                <Input
                  value={title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter chart title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>X-Axis Field</Label>
                  <Input
                    value={xAxisKey}
                    onChange={(e) => handleInputChange('xAxisKey', e.target.value)}
                    placeholder="name"
                  />
                </div>
                <div>
                  <Label>Y-Axis Field</Label>
                  <Input
                    value={yAxisKey}
                    onChange={(e) => handleInputChange('yAxisKey', e.target.value)}
                    placeholder="value"
                  />
                </div>
              </div>

              <div>
                <Label>Secondary Y-Axis Field (Optional)</Label>
                <Input
                  value={secondaryYAxisKey}
                  onChange={(e) => handleInputChange('secondaryYAxisKey', e.target.value)}
                  placeholder="secondary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show Legend</Label>
                  <Switch
                    checked={showLegend}
                    onCheckedChange={(checked) => handleInputChange('showLegend', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Grid</Label>
                  <Switch
                    checked={showGrid}
                    onCheckedChange={(checked) => handleInputChange('showGrid', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Tooltip</Label>
                  <Switch
                    checked={showTooltip}
                    onCheckedChange={(checked) => handleInputChange('showTooltip', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Labels</Label>
                  <Switch
                    checked={showLabels}
                    onCheckedChange={(checked) => handleInputChange('showLabels', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div>
                <Label>Group By Field (Optional)</Label>
                <Input
                  value={groupByKey || ''}
                  onChange={(e) => handleInputChange('groupByKey', e.target.value)}
                  placeholder="category"
                />
              </div>

              <div>
                <Label>Aggregation Type</Label>
                <Select value={aggregationType} onValueChange={(value) => handleInputChange('aggregationType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Auto Refresh</Label>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={(checked) => handleInputChange('autoRefresh', checked)}
                  />
                </div>
                
                {autoRefresh && (
                  <div>
                    <Label>Refresh Interval (seconds)</Label>
                    <Input
                      type="number"
                      value={refreshInterval}
                      onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value))}
                      min="10"
                      max="3600"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div>
                <Label>Chart Height</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                  min="200"
                  max="800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Border Radius</Label>
                  <Input
                    type="number"
                    value={borderRadius}
                    onChange={(e) => handleInputChange('borderRadius', parseInt(e.target.value))}
                    min="0"
                    max="20"
                  />
                </div>
                <div>
                  <Label>Stroke Width</Label>
                  <Input
                    type="number"
                    value={strokeWidth}
                    onChange={(e) => handleInputChange('strokeWidth', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <Label>Fill Opacity</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={fillOpacity}
                  onChange={(e) => handleInputChange('fillOpacity', parseFloat(e.target.value))}
                  min="0"
                  max="1"
                />
              </div>

              <div>
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...colors]
                          newColors[index] = e.target.value
                          handleInputChange('colors', newColors)
                        }}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('colors', [...colors, '#000000'])}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="animation" className="space-y-4">
              <div>
                <Label>Animation Duration (ms)</Label>
                <Input
                  type="number"
                  value={animationDuration}
                  onChange={(e) => handleInputChange('animationDuration', parseInt(e.target.value))}
                  min="0"
                  max="5000"
                />
              </div>

              <div>
                <Label>Animation Easing</Label>
                <Select value={animationEasing} onValueChange={(value) => handleInputChange('animationEasing', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ease">Ease</SelectItem>
                    <SelectItem value="ease-in">Ease In</SelectItem>
                    <SelectItem value="ease-out">Ease Out</SelectItem>
                    <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-full bg-white rounded-lg" style={{ height: `${height}px` }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {dataSourceId && (
            <Badge variant="outline" className="text-xs">
              <Database className="w-3 h-3 mr-1" />
              {dataSourceType === 'collection' ? 'Collection' : 
               dataSourceType === 'scraper' ? 'Scraper' : 'API'}
            </Badge>
          )}
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
          {dataSourceId && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pb-4" style={{ height: `${height - 80}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
        
        {processedData.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
