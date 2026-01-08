'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, Eye, Save, X, Link, Calendar, FileText, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/lib/api-client'

interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  icon: string
  color: string
  schema: FieldDefinition[]
  record_count: number
}

interface FieldDefinition {
  name: string
  type: string
  label?: string
  required: boolean
  unique: boolean
  default?: any
  options?: string[]
  relation_collection_id?: string
  relation_multiple: boolean
  formula?: string
  validation?: Record<string, any>
}

interface Record {
  id: string
  data: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
}

interface RecordManagerProps {
  appId: string
  collection: Collection
  onBack: () => void
}

export function RecordManager({ appId, collection, onBack }: RecordManagerProps) {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize] = useState(50)
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // View states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  useEffect(() => {
    loadRecords()
  }, [currentPage, searchTerm])

  const loadRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await apiClient.get(
        `/apps/${appId}/collections/${collection.id}/records?${params}`
      )
      
      setRecords(response.data.records || [])
      setTotalRecords(response.data.total || 0)
      setTotalPages(response.data.total_pages || 1)
    } catch (error) {
      console.error('Failed to load records:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRecord = async () => {
    try {
      const errors = validateFormData(formData)
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      const response = await apiClient.post(
        `/apps/${appId}/collections/${collection.id}/records`,
        { data: formData }
      )
      
      setRecords([response.data, ...records])
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create record:', error)
    }
  }

  const updateRecord = async () => {
    if (!editingRecord) return
    
    try {
      const errors = validateFormData(formData)
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }

      const response = await apiClient.put(
        `/apps/${appId}/collections/${collection.id}/records/${editingRecord.id}`,
        { data: formData }
      )
      
      setRecords(records.map(r => r.id === editingRecord.id ? response.data : r))
      setEditingRecord(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update record:', error)
    }
  }

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      await apiClient.delete(
        `/apps/${appId}/collections/${collection.id}/records/${recordId}`
      )
      setRecords(records.filter(r => r.id !== recordId))
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const validateFormData = (data: Record<string, any>) => {
    const errors: Record<string, string> = {}
    
    collection.schema.forEach(field => {
      const value = data[field.name]
      
      if (field.required && (!value || value === '')) {
        errors[field.name] = `${field.label || field.name} is required`
      }
      
      if (value && field.type === 'number' && isNaN(Number(value))) {
        errors[field.name] = `${field.label || field.name} must be a number`
      }
    })
    
    return errors
  }

  const resetForm = () => {
    setFormData({})
    setFormErrors({})
  }

  const openCreateDialog = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const openEditDialog = (record: Record) => {
    setFormData(record.data)
    setFormErrors({})
    setEditingRecord(record)
  }

  const renderFieldInput = (field: FieldDefinition) => {
    const value = formData[field.name] || field.default || ''
    const error = formErrors[field.name]
    
    const updateValue = (newValue: any) => {
      setFormData({ ...formData, [field.name]: newValue })
      if (error) {
        setFormErrors({ ...formErrors, [field.name]: '' })
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Input
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={`Enter ${field.label || field.name}`}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'number':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={`Enter ${field.label || field.name}`}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={updateValue}
            />
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'date':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Input
              type="date"
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'datetime':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Input
              type="datetime-local"
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'select':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Select value={value} onValueChange={updateValue}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${field.label || field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      case 'multiselect':
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <div className="space-y-2 border rounded-lg p-3">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    checked={Array.isArray(value) && value.includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (checked) {
                        updateValue([...currentValues, option])
                      } else {
                        updateValue(currentValues.filter(v => v !== option))
                      }
                    }}
                  />
                  <Label>{option}</Label>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
      
      default:
        return (
          <div>
            <Label>{field.label || field.name} {field.required && '*'}</Label>
            <Textarea
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={`Enter ${field.label || field.name}`}
              rows={3}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )
    }
  }

  const renderCellValue = (field: FieldDefinition, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground">—</span>
    }

    switch (field.type) {
      case 'boolean':
        return value ? '✅' : '❌'
      
      case 'date':
        return new Date(value).toLocaleDateString()
      
      case 'datetime':
        return new Date(value).toLocaleString()
      
      case 'multiselect':
        return Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1">
            {value.map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {v}
              </Badge>
            ))}
          </div>
        ) : value
      
      case 'select':
        return (
          <Badge variant="outline" className="text-xs">
            {value}
          </Badge>
        )
      
      default:
        return String(value).length > 50 
          ? String(value).substring(0, 50) + '...'
          : String(value)
    }
  }

  const renderTableView = () => (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedRecords.length === records.length && records.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedRecords(records.map(r => r.id))
                  } else {
                    setSelectedRecords([])
                  }
                }}
              />
            </TableHead>
            {collection.schema.map((field) => (
              <TableHead key={field.name}>
                {field.label || field.name}
              </TableHead>
            ))}
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <Checkbox
                  checked={selectedRecords.includes(record.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRecords([...selectedRecords, record.id])
                    } else {
                      setSelectedRecords(selectedRecords.filter(id => id !== record.id))
                    }
                  }}
                />
              </TableCell>
              {collection.schema.map((field) => (
                <TableCell key={field.name}>
                  {renderCellValue(field, record.data[field.name])}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(record)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecord(record.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record) => (
        <Card key={record.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRecords.includes(record.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRecords([...selectedRecords, record.id])
                    } else {
                      setSelectedRecords(selectedRecords.filter(id => id !== record.id))
                    }
                  }}
                />
                <CardTitle className="text-sm">
                  Record #{record.id.slice(0, 8)}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(record)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecord(record.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {collection.schema.slice(0, 4).map((field) => (
              <div key={field.name} className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">
                  {field.label || field.name}:
                </span>
                <span className="text-sm text-right flex-1 ml-2">
                  {renderCellValue(field, record.data[field.name])}
                </span>
              </div>
            ))}
            {collection.schema.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{collection.schema.length - 4} more fields
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: collection.color }}
              >
                <FileText className="w-4 h-4" />
              </div>
              {collection.name}
            </h2>
            <p className="text-muted-foreground">
              {totalRecords} records • {collection.schema.length} fields
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          {selectedRecords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRecords.length} selected
              </span>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No records yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first record
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Record
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? renderTableView() : renderCardsView()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
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
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingRecord} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setEditingRecord(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Record' : 'Create New Record'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {collection.schema.map((field) => (
              <div key={field.name}>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false)
                setEditingRecord(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingRecord ? updateRecord : createRecord}>
              <Save className="w-4 h-4 mr-2" />
              {editingRecord ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}