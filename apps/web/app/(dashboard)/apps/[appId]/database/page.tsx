'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Database, Plus, Search, Settings, Trash2, Edit, Eye, Download,
  Upload, Filter, SortAsc, MoreHorizontal, Table, Grid3X3, List,
  ChevronRight, Copy, ExternalLink, Code, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface Collection {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  schema: FieldDefinition[]
  record_count: number
  created_at: string
}

interface FieldDefinition {
  name: string
  type: string
  required: boolean
  unique: boolean
  default?: any
  options?: string[]
}

interface Record {
  id: string
  data: any
  created_at: string
  updated_at: string
}

const FIELD_TYPES = [
  { id: 'text', name: 'Text', icon: '📝' },
  { id: 'number', name: 'Number', icon: '🔢' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'url', name: 'URL', icon: '🔗' },
  { id: 'date', name: 'Date', icon: '📅' },
  { id: 'datetime', name: 'Date & Time', icon: '🕐' },
  { id: 'boolean', name: 'Checkbox', icon: '☑️' },
  { id: 'select', name: 'Select', icon: '📋' },
  { id: 'multiselect', name: 'Multi-Select', icon: '📋' },
  { id: 'file', name: 'File', icon: '📎' },
  { id: 'image', name: 'Image', icon: '🖼️' },
  { id: 'richtext', name: 'Rich Text', icon: '📄' },
  { id: 'json', name: 'JSON', icon: '{ }' },
  { id: 'relation', name: 'Relation', icon: '🔗' },
]

const COLLECTION_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
]

export default function DatabasePage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Dialogs
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [showCreateRecord, setShowCreateRecord] = useState(false)
  const [showEditRecord, setShowEditRecord] = useState<Record | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  
  // New collection form
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    schema: [{ name: 'title', type: 'text', required: true, unique: false }] as FieldDefinition[]
  })
  
  // New record form
  const [newRecord, setNewRecord] = useState<any>({})

  const fetchCollections = useCallback(async () => {
    try {
      const response = await apiClient.get(`/apps/${appId}/collections`)
      setCollections(response.data.collections || [])
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    }
  }, [appId])

  const fetchRecords = useCallback(async (collectionId: string) => {
    try {
      const response = await apiClient.get(`/apps/${appId}/collections/${collectionId}/records`)
      setRecords(response.data.records || [])
    } catch (error) {
      console.error('Failed to fetch records:', error)
    }
  }, [appId])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchCollections()
      setIsLoading(false)
    }
    loadData()
  }, [fetchCollections])

  useEffect(() => {
    if (selectedCollection) {
      fetchRecords(selectedCollection.id)
    }
  }, [selectedCollection, fetchRecords])

  const handleCreateCollection = async () => {
    try {
      await apiClient.post(`/apps/${appId}/collections`, {
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color,
        schema: newCollection.schema
      })
      
      setShowCreateCollection(false)
      setNewCollection({
        name: '',
        description: '',
        color: '#6366f1',
        schema: [{ name: 'title', type: 'text', required: true, unique: false }]
      })
      await fetchCollections()
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? All records will be lost.')) return
    
    try {
      await apiClient.delete(`/apps/${appId}/collections/${collectionId}`)
      setSelectedCollection(null)
      await fetchCollections()
    } catch (error) {
      console.error('Failed to delete collection:', error)
    }
  }

  const handleCreateRecord = async () => {
    if (!selectedCollection) return
    
    try {
      await apiClient.post(`/apps/${appId}/collections/${selectedCollection.id}/records`, {
        data: newRecord
      })
      
      setShowCreateRecord(false)
      setNewRecord({})
      await fetchRecords(selectedCollection.id)
    } catch (error) {
      console.error('Failed to create record:', error)
    }
  }

  const handleUpdateRecord = async () => {
    if (!selectedCollection || !showEditRecord) return
    
    try {
      await apiClient.put(
        `/apps/${appId}/collections/${selectedCollection.id}/records/${showEditRecord.id}`,
        { data: showEditRecord.data }
      )
      
      setShowEditRecord(null)
      await fetchRecords(selectedCollection.id)
    } catch (error) {
      console.error('Failed to update record:', error)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedCollection) return
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      await apiClient.delete(`/apps/${appId}/collections/${selectedCollection.id}/records/${recordId}`)
      await fetchRecords(selectedCollection.id)
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const addField = () => {
    setNewCollection({
      ...newCollection,
      schema: [...newCollection.schema, { name: '', type: 'text', required: false, unique: false }]
    })
  }

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const schema = [...newCollection.schema]
    schema[index] = { ...schema[index], ...updates }
    setNewCollection({ ...newCollection, schema })
  }

  const removeField = (index: number) => {
    const schema = newCollection.schema.filter((_, i) => i !== index)
    setNewCollection({ ...newCollection, schema })
  }

  const filteredRecords = records.filter(record => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return Object.values(record.data).some(
      value => String(value).toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Collections List */}
      <div className="w-64 border-r bg-slate-50 dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Collections</h2>
          <Button size="sm" onClick={() => setShowCreateCollection(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {collections.map(collection => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                selectedCollection?.id === collection.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: collection.color }}
              >
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{collection.name}</p>
                <p className="text-xs text-muted-foreground">{collection.record_count || 0} records</p>
              </div>
            </button>
          ))}
          
          {collections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No collections yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedCollection ? (
          <>
            {/* Collection Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedCollection.color }}
                  >
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{selectedCollection.name}</h1>
                    <p className="text-sm text-muted-foreground">{selectedCollection.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <Table className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button onClick={() => setShowCreateRecord(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Schema
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Code className="w-4 h-4 mr-2" />
                        API Docs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteCollection(selectedCollection.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Schema badges */}
              <div className="flex gap-2 mt-3">
                {selectedCollection.schema?.map((field, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {field.name}: {field.type}
                    {field.required && ' *'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Records */}
            <div className="flex-1 overflow-auto p-4">
              {viewMode === 'table' ? (
                <UITable>
                  <TableHeader>
                    <TableRow>
                      {selectedCollection.schema?.map((field, i) => (
                        <TableHead key={i}>{field.name}</TableHead>
                      ))}
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map(record => (
                      <TableRow key={record.id}>
                        {selectedCollection.schema?.map((field, i) => (
                          <TableCell key={i}>
                            {renderFieldValue(record.data[field.name], field.type)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowEditRecord(record)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredRecords.map(record => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {selectedCollection.schema?.slice(0, 3).map((field, i) => (
                          <div key={i} className="mb-2">
                            <p className="text-xs text-muted-foreground">{field.name}</p>
                            <p className="font-medium truncate">
                              {renderFieldValue(record.data[field.name], field.type)}
                            </p>
                          </div>
                        ))}
                        <div className="flex gap-1 mt-3 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowEditRecord(record)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteRecord(record.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No records found</p>
                  <Button className="mt-4" onClick={() => setShowCreateRecord(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Select a Collection</h2>
              <p className="mb-4">Choose a collection from the sidebar or create a new one</p>
              <Button onClick={() => setShowCreateCollection(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Define your collection schema to store structured data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Products, Users, Posts"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLLECTION_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        newCollection.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCollection({ ...newCollection, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What will this collection store?"
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fields</Label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {newCollection.schema.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                    <Input
                      placeholder="Field name"
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(index, { type: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.icon} {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Required</Label>
                      <Switch
                        checked={field.required}
                        onCheckedChange={(v) => updateField(index, { required: v })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      disabled={newCollection.schema.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateCollection(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!newCollection.name}>
              Create Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Record Dialog */}
      <Dialog open={showCreateRecord} onOpenChange={setShowCreateRecord}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Record</DialogTitle>
            <DialogDescription>
              Add a new record to {selectedCollection?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCollection?.schema?.map((field, i) => (
              <div key={i} className="space-y-2">
                <Label>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderFieldInput(field, newRecord[field.name], (value) => {
                  setNewRecord({ ...newRecord, [field.name]: value })
                })}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateRecord(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRecord}>
              Add Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={!!showEditRecord} onOpenChange={() => setShowEditRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCollection?.schema?.map((field, i) => (
              <div key={i} className="space-y-2">
                <Label>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderFieldInput(field, showEditRecord?.data?.[field.name], (value) => {
                  if (showEditRecord) {
                    setShowEditRecord({
                      ...showEditRecord,
                      data: { ...showEditRecord.data, [field.name]: value }
                    })
                  }
                })}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditRecord(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRecord}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function renderFieldValue(value: any, type: string): React.ReactNode {
  if (value === undefined || value === null) return '-'
  
  switch (type) {
    case 'boolean':
      return value ? '✓' : '✗'
    case 'date':
    case 'datetime':
      return new Date(value).toLocaleDateString()
    case 'url':
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {value}
        </a>
      )
    case 'email':
      return (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {value}
        </a>
      )
    case 'json':
      return <code className="text-xs">{JSON.stringify(value)}</code>
    default:
      return String(value)
  }
}

function renderFieldInput(
  field: FieldDefinition,
  value: any,
  onChange: (value: any) => void
): React.ReactNode {
  switch (field.type) {
    case 'boolean':
      return (
        <Switch
          checked={!!value}
          onCheckedChange={onChange}
        />
      )
    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      )
    case 'date':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'richtext':
    case 'json':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      )
    default:
      return (
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
