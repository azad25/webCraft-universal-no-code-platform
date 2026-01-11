'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Settings,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react'

import { useDataSource, DataSourceProps, DataSourceLoading, DataSourceError } from '@/lib/widget-data-source-integration'
import { TableConfigPanel } from '../table-config-panel'
import { sampleUsers, userColumns, defaultTableActions } from './sample-table-data'
import { cn } from '@/lib/utils'

interface TableColumn {
  id: string
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'link' | 'image' | 'actions'
  sortable: boolean
  filterable: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: string
  visible: boolean
}

interface TableAction {
  id: string
  label: string
  icon: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onClick: string // JavaScript code or API endpoint
  confirmation?: string
  condition?: string // JavaScript condition
}

interface TableRow {
  id: string
  [key: string]: any
}

interface TableWidgetProps extends DataSourceProps {
  title?: string
  description?: string
  columns: TableColumn[]
  data: TableRow[]
  actions?: TableAction[]
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  selectable?: boolean
  exportable?: boolean
  addable?: boolean
  editable?: boolean
  deletable?: boolean
  customActions?: TableAction[]
  theme?: 'default' | 'minimal' | 'modern' | 'dark'
  isEditing?: boolean
  onRowClick?: (row: TableRow) => void
  onRowEdit?: (row: TableRow) => void
  onRowDelete?: (row: TableRow) => void
  onRowAdd?: (row: TableRow) => void
  onAction?: (action: TableAction, row: TableRow) => void
}

const defaultColumns: TableColumn[] = userColumns

const defaultData: TableRow[] = sampleUsers

const defaultActions: TableAction[] = defaultTableActions

export function TableWidget({
  title = 'Data Table',
  description,
  columns = defaultColumns,
  data: staticData = defaultData,
  actions = defaultActions,
  searchable = true,
  filterable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  striped = true,
  bordered = false,
  compact = false,
  selectable = false,
  exportable = true,
  addable = true,
  editable = true,
  deletable = true,
  customActions = [],
  theme = 'default',
  isEditing = false,
  onRowClick,
  onRowEdit,
  onRowDelete,
  onRowAdd,
  onAction,
  ...dataSourceProps
}: TableWidgetProps) {
  // Data source integration
  const { data: sourceData, isLoading, error, refresh } = useDataSource(
    dataSourceProps,
    (apiData) => {
      if (Array.isArray(apiData)) {
        return apiData.map((item, index) => ({
          id: item.id || `row-${index}`,
          ...item
        }))
      }
      return []
    },
    staticData,
    isEditing
  )

  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [editingRow, setEditingRow] = useState<TableRow | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newRowData, setNewRowData] = useState<Record<string, any>>({})
  const [showConfigPanel, setShowConfigPanel] = useState(false)

  // Get visible columns
  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  )

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = sourceData

    // Apply search
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(row =>
        visibleColumns.some(col => {
          const value = row[col.key]
          return value?.toString().toLowerCase().includes(query)
        })
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => {
          const value = row[columnKey]
          return value?.toString().toLowerCase().includes(filterValue.toLowerCase())
        })
      }
    })

    return filtered
  }, [sourceData, searchQuery, columnFilters, visibleColumns, searchable])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]
      
      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection, sortable])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData
    
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, paginated])

  // Pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, sortedData.length)

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection, sortable])

  // Handle row selection
  const handleRowSelect = useCallback((rowId: string) => {
    if (!selectable) return
    
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    )
  }, [selectable])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!selectable) return
    
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedData.map(row => row.id))
    }
  }, [selectable, selectedRows, paginatedData])

  // Handle action execution
  const executeAction = useCallback(async (action: TableAction, row: TableRow) => {
    try {
      // Check condition if provided
      if (action.condition) {
        const conditionResult = new Function('row', `return ${action.condition}`)(row)
        if (!conditionResult) return
      }

      // Show confirmation if required
      if (action.confirmation) {
        if (!confirm(action.confirmation)) return
      }

      // Execute action
      if (action.onClick.startsWith('http')) {
        // API call
        const response = await fetch(action.onClick, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row)
        })
        if (response.ok) {
          refresh()
        }
      } else {
        // JavaScript execution
        new Function('row', 'refresh', action.onClick)(row, refresh)
      }

      // Call custom handler
      onAction?.(action, row)
    } catch (error) {
      console.error('Action execution failed:', error)
    }
  }, [onAction, refresh])

  // Handle row editing
  const handleEditRow = useCallback((row: TableRow) => {
    setEditingRow({ ...row })
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingRow) return
    
    // Update the row data
    onRowEdit?.(editingRow)
    setEditingRow(null)
  }, [editingRow, onRowEdit])

  // Handle adding new row
  const handleAddRow = useCallback(() => {
    const newRow: TableRow = {
      id: `new-${Date.now()}`,
      ...newRowData
    }
    
    onRowAdd?.(newRow)
    setNewRowData({})
    setShowAddDialog(false)
  }, [newRowData, onRowAdd])

  // Export data
  const handleExport = useCallback(() => {
    const csv = [
      visibleColumns.map(col => col.label).join(','),
      ...sortedData.map(row => 
        visibleColumns.map(col => row[col.key] || '').join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [visibleColumns, sortedData, title])

  // Render cell content
  const renderCellContent = useCallback((column: TableColumn, row: TableRow) => {
    const value = row[column.key]
    
    switch (column.type) {
      case 'badge':
        return (
          <Badge variant={value === 'active' ? 'default' : value === 'inactive' ? 'secondary' : 'outline'}>
            {value}
          </Badge>
        )
      case 'boolean':
        return value ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-'
      case 'link':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
            {value}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : '-'
      case 'image':
        return value ? (
          <img src={value} alt="" className="w-8 h-8 rounded object-cover" />
        ) : '-'
      case 'actions':
        return (
          <div className="flex items-center gap-1">
            {[...actions, ...customActions].map(action => {
              const IconComponent = {
                eye: Eye,
                edit: Edit,
                trash2: Trash2,
                copy: Copy,
                download: Download,
                externalLink: ExternalLink
              }[action.icon] || MoreHorizontal

              return (
                <Button
                  key={action.id}
                  variant={action.variant as any}
                  size="sm"
                  onClick={() => executeAction(action, row)}
                  className="h-7 w-7 p-0"
                >
                  <IconComponent className="w-3 h-3" />
                </Button>
              )
            })}
          </div>
        )
      default:
        return value?.toString() || '-'
    }
  }, [actions, customActions, executeAction])

  if (error) {
    return <DataSourceError error={error} onRetry={refresh} />
  }

  return (
    <div className={cn(
      "w-full space-y-4",
      theme === 'minimal' && "bg-transparent",
      theme === 'modern' && "bg-gradient-to-br from-background to-muted/20 rounded-lg p-6",
      theme === 'dark' && "bg-gray-900 text-white rounded-lg p-6"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {dataSourceProps.dataSourceId && (
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          )}
          
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          
          {addable && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Row
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Row</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new row.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {visibleColumns.filter(col => col.type !== 'actions').map(column => (
                    <div key={column.id}>
                      <Label htmlFor={column.key}>{column.label}</Label>
                      <Input
                        id={column.key}
                        value={newRowData[column.key] || ''}
                        onChange={(e) => setNewRowData(prev => ({
                          ...prev,
                          [column.key]: e.target.value
                        }))}
                        placeholder={`Enter ${column.label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRow}>
                    Add Row
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Table Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowConfigPanel(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configure Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowColumnSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Column Settings
              </DropdownMenuItem>
              {selectable && selectedRows.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedRows([])}>
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedRows.length})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {filterable && (
          <div className="flex items-center gap-2">
            {visibleColumns.filter(col => col.filterable).map(column => (
              <div key={column.id} className="relative">
                <Input
                  placeholder={`Filter ${column.label}`}
                  value={columnFilters[column.key] || ''}
                  onChange={(e) => setColumnFilters(prev => ({
                    ...prev,
                    [column.key]: e.target.value
                  }))}
                  className="w-32"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <DataSourceLoading message="Loading table data..." />}

      {/* Table */}
      {!isLoading && (
        <div className={cn(
          "rounded-md border",
          bordered && "border-2"
        )}>
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                )}
                {visibleColumns.map(column => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "cursor-pointer select-none",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right",
                      column.width && `w-[${column.width}]`
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {sortable && column.sortable && (
                        <div className="flex flex-col">
                          <SortAsc className={cn(
                            "w-3 h-3",
                            sortColumn === column.key && sortDirection === 'asc' 
                              ? "text-primary" 
                              : "text-muted-foreground"
                          )} />
                          <SortDesc className={cn(
                            "w-3 h-3 -mt-1",
                            sortColumn === column.key && sortDirection === 'desc' 
                              ? "text-primary" 
                              : "text-muted-foreground"
                          )} />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      striped && index % 2 === 0 && "bg-muted/20",
                      compact && "h-10",
                      selectedRows.includes(row.id) && "bg-primary/10"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map(column => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.align === 'center' && "text-center",
                          column.align === 'right' && "text-right",
                          compact && "py-2"
                        )}
                      >
                        {renderCellContent(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {sortedData.length} entries
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Column Settings Dialog */}
      <Dialog open={showColumnSettings} onOpenChange={setShowColumnSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Column Settings</DialogTitle>
            <DialogDescription>
              Configure which columns to show and their properties.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {columns.map(column => (
              <div key={column.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={column.visible}
                    onCheckedChange={(checked) => {
                      // Update column visibility
                      console.log(`Toggle column ${column.key}: ${checked}`)
                    }}
                  />
                  <div>
                    <div className="font-medium">{column.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {column.key} • {column.type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {column.type}
                  </Badge>
                  {column.sortable && (
                    <Badge variant="secondary" className="text-xs">
                      Sortable
                    </Badge>
                  )}
                  {column.filterable && (
                    <Badge variant="secondary" className="text-xs">
                      Filterable
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowColumnSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>
              Update the row data.
            </DialogDescription>
          </DialogHeader>
          {editingRow && (
            <div className="space-y-4">
              {visibleColumns.filter(col => col.type !== 'actions').map(column => (
                <div key={column.id}>
                  <Label htmlFor={`edit-${column.key}`}>{column.label}</Label>
                  <Input
                    id={`edit-${column.key}`}
                    value={editingRow[column.key] || ''}
                    onChange={(e) => setEditingRow(prev => prev ? ({
                      ...prev,
                      [column.key]: e.target.value
                    }) : null)}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Configuration Panel */}
      <TableConfigPanel
        isOpen={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
        columns={columns}
        actions={[...actions, ...customActions]}
        onColumnsChange={(newColumns) => {
          // Update columns through props change
          console.log('Columns updated:', newColumns)
        }}
        onActionsChange={(newActions) => {
          // Update actions through props change
          console.log('Actions updated:', newActions)
        }}
        dataSourceId={dataSourceProps.dataSourceId}
        onDataSourceChange={(sourceId, endpointId) => {
          // Update data source
          console.log('Data source changed:', sourceId, endpointId)
        }}
      />
    </div>
  )
}