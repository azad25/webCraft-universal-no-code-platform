'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  Filter, 
  Search,
  Download,
  Eye,
  Database,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface TableColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'image' | 'link'
  width?: string
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
}

interface TableRow {
  id: string
  [key: string]: any
}

interface TableWidgetProps {
  title?: string
  columns?: TableColumn[]
  data?: TableRow[]
  
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper'
  autoRefresh?: boolean
  refreshInterval?: number
  
  showHeader?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showPagination?: boolean
  showActions?: boolean
  showAddRow?: boolean
  showExport?: boolean
  pageSize?: number
  sortable?: boolean
  selectable?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  responsive?: boolean
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultColumns: TableColumn[] = [
  { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true, visible: true },
  { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true, visible: true },
  { key: 'status', label: 'Status', type: 'badge', sortable: true, filterable: true, visible: true },
  { key: 'date', label: 'Date', type: 'date', sortable: true, filterable: false, visible: true }
]

const defaultData: TableRow[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active', date: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive', date: '2024-01-14' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'Pending', date: '2024-01-13' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', status: 'Active', date: '2024-01-12' },
  { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Active', date: '2024-01-11' }
]

export function TableWidget({
  title = 'Data Table',
  columns = defaultColumns,
  data = defaultData,
  
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  showHeader = true,
  showSearch = true,
  showFilters = false,
  showPagination = true,
  showActions = true,
  showAddRow = false,
  showExport = false,
  pageSize = 10,
  sortable = true,
  selectable = false,
  striped = true,
  bordered = true,
  compact = false,
  responsive = true,
  isEditing = false,
  onChange
}: TableWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  
  // Data source state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dynamicData, setDynamicData] = useState<TableRow[]>([])

  // Use dynamic data if available, otherwise use static data
  const activeData = dataSourceId && dynamicData.length > 0 ? dynamicData : data

  // Fetch data from data source
  useEffect(() => {
    const fetchData = async () => {
      if (!dataSourceId || !dataEndpointId || dataSourceType !== 'api') return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetchDataSourceData(dataSourceId, dataEndpointId)
        const fetchedData = Array.isArray(response.data) ? response.data : [response.data]
        
        // Transform data to include IDs if missing
        const transformedData = fetchedData.map((item, index) => ({
          id: item.id || `row-${index}`,
          ...item
        }))
        
        setDynamicData(transformedData)
        setLastUpdated(new Date())
        
        // Auto-generate columns if not provided and we have data
        if (transformedData.length > 0 && columns === defaultColumns) {
          const firstRow = transformedData[0]
          const autoColumns: TableColumn[] = Object.keys(firstRow)
            .filter(key => key !== 'id')
            .map(key => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              type: typeof firstRow[key] === 'number' ? 'number' : 
                    typeof firstRow[key] === 'boolean' ? 'boolean' :
                    key.toLowerCase().includes('date') ? 'date' :
                    key.toLowerCase().includes('status') ? 'badge' : 'text',
              sortable: true,
              filterable: true,
              visible: true
            }))
          
          if (onChange) {
            onChange({ columns: autoColumns })
          }
        }
      } catch (err) {
        setError('Failed to fetch data')
        console.error('Table data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Auto refresh
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [dataSourceId, dataEndpointId, dataSourceType, autoRefresh, refreshInterval, onChange, columns])

  const handleRefresh = async () => {
    if (!dataSourceId || !dataEndpointId) return
    
    setLoading(true)
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, false) // Force fresh data
      const fetchedData = Array.isArray(response.data) ? response.data : [response.data]
      
      const transformedData = fetchedData.map((item, index) => ({
        id: item.id || `row-${index}`,
        ...item
      }))
      
      setDynamicData(transformedData)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to refresh data')
      console.error('Table refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  const handleSort = (columnKey: string) => {
    if (!sortable) return
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleRowSelect = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      setSelectedRows(selectedRows.filter(id => id !== rowId))
    } else {
      setSelectedRows([...selectedRows, rowId])
    }
  }

  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredData.map(row => row.id))
    }
  }

  // Filter and search data
  const filteredData = activeData.filter(row => {
    // Search filter
    if (searchTerm) {
      const searchMatch = Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (!searchMatch) return false
    }

    // Column filters
    for (const [key, filterValue] of Object.entries(filters)) {
      if (filterValue && String(row[key]).toLowerCase() !== filterValue.toLowerCase()) {
        return false
      }
    }

    return true
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const visibleColumns = columns.filter(col => col.visible !== false)

  const renderCellContent = (row: TableRow, column: TableColumn) => {
    const value = row[column.key]
    
    switch (column.type) {
      case 'badge':
        const badgeVariant = value === 'Active' ? 'default' : 
                           value === 'Inactive' ? 'secondary' : 
                           value === 'Pending' ? 'outline' : 'default'
        return <Badge variant={badgeVariant}>{value}</Badge>
      
      case 'boolean':
        return value ? '✓' : '✗'
      
      case 'date':
        return new Date(value).toLocaleDateString()
      
      case 'link':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {value}
          </a>
        )
      
      case 'image':
        return (
          <img src={value} alt="" className="w-8 h-8 rounded object-cover" />
        )
      
      default:
        return value
    }
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Table className="w-5 h-5" />
          Edit Table
        </h3>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Table Title</Label>
            <Input
              value={title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Table title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Page Size</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => handleInputChange('pageSize', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {dataSourceId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Database className="w-4 h-4" />
                <span>Connected to data source</span>
                {lastUpdated && (
                  <span className="text-xs">
                    (Updated: {lastUpdated.toLocaleTimeString()})
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={showHeader ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showHeader', !showHeader)}
              >
                Show Header
              </Button>
              <Button
                variant={showSearch ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showSearch', !showSearch)}
              >
                Show Search
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showFilters', !showFilters)}
              >
                Show Filters
              </Button>
              <Button
                variant={showPagination ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showPagination', !showPagination)}
              >
                Show Pagination
              </Button>
              <Button
                variant={showActions ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showActions', !showActions)}
              >
                Show Actions
              </Button>
              <Button
                variant={selectable ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('selectable', !selectable)}
              >
                Selectable Rows
              </Button>
              <Button
                variant={sortable ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('sortable', !sortable)}
              >
                Sortable Columns
              </Button>
              <Button
                variant={striped ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('striped', !striped)}
              >
                Striped Rows
              </Button>
            </div>
          </div>
          
          {!dataSourceId && (
            <div>
              <Label>Sample Data (JSON)</Label>
              <Textarea
                value={JSON.stringify(data, null, 2)}
                onChange={(e) => {
                  try {
                    const newData = JSON.parse(e.target.value)
                    handleInputChange('data', newData)
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Table className="w-5 h-5" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {dataSourceId && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              )}
              {showExport && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              {showAddRow && (
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Row
                </Button>
              )}
            </div>
          </div>
          
          {(showSearch || showFilters) && (
            <div className="flex items-center gap-4 mt-4">
              {showSearch && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              
              {showFilters && (
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              )}
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading && activeData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : activeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Table className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className={cn("overflow-x-auto", responsive && "max-w-full")}>
            <table className={cn(
              "w-full text-sm",
              bordered && "border-collapse",
              compact ? "text-xs" : "text-sm"
            )}>
              <thead>
                <tr className={cn(bordered && "border-b")}>
                  {selectable && (
                    <th className="w-12 p-3 text-left">
                      <Checkbox
                        checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "p-3 text-left font-medium",
                        bordered && "border-r last:border-r-0",
                        column.sortable && sortable && "cursor-pointer hover:bg-muted/50"
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortable && (
                          <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                  {showActions && (
                    <th className="w-20 p-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-muted/50",
                      striped && index % 2 === 1 && "bg-muted/25",
                      bordered && "border-b",
                      selectedRows.includes(row.id) && "bg-primary/10"
                    )}
                  >
                    {selectable && (
                      <td className="p-3">
                        <Checkbox
                          checked={selectedRows.includes(row.id)}
                          onCheckedChange={() => handleRowSelect(row.id)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "p-3",
                          bordered && "border-r last:border-r-0",
                          compact ? "py-2" : "py-3"
                        )}
                      >
                        {renderCellContent(row, column)}
                      </td>
                    ))}
                    {showActions && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}