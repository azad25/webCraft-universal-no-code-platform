'use client'

import { useState, useEffect } from 'react'
import { Plus, Database, Edit, Trash2, Search, Filter, Download, Upload, Eye, Settings, Link, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  created_at: string
  updated_at: string
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

interface CollectionManagerProps {
  appId: string
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Boolean', icon: '✅' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'datetime', label: 'Date & Time', icon: '🕐' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'file', label: 'File', icon: '📎' },
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'relation', label: 'Relation', icon: '🔗' },
  { value: 'formula', label: 'Formula', icon: '🧮' },
  { value: 'rollup', label: 'Rollup', icon: '📊' }
]

const COLLECTION_ICONS = [
  'database', 'table', 'users', 'shopping-cart', 'calendar', 'file-text',
  'image', 'mail', 'phone', 'map-pin', 'star', 'heart', 'bookmark',
  'tag', 'folder', 'archive', 'clipboard', 'credit-card', 'truck'
]

export function CollectionManager({ appId }: CollectionManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // New collection form
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    icon: 'database',
    color: '#6366f1',
    schema: [] as FieldDefinition[]
  })

  // New field form
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({
    name: '',
    type: 'text',
    label: '',
    required: false,
    unique: false,
    options: [],
    relation_multiple: false
  })

  useEffect(() => {
    loadCollections()
  }, [appId])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/apps/${appId}/collections`)
      setCollections(response.data.collections || [])
    } catch (error) {
      console.error('Failed to load collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async () => {
    try {
      const response = await apiClient.post(`/apps/${appId}/collections`, newCollection)
      setCollections([response.data, ...collections])
      setShowCreateDialog(false)
      resetNewCollection()
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const updateCollection = async (collection: Collection) => {
    try {
      await apiClient.put(`/apps/${appId}/collections/${collection.id}`, {
        name: collection.name,
        description: collection.description,
        icon: collection.icon,
        color: collection.color,
        schema: collection.schema
      })
      await loadCollections()
      setEditingCollection(null)
    } catch (error) {
      console.error('Failed to update collection:', error)
    }
  }

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure? This will delete all records in this collection.')) return
    
    try {
      await apiClient.delete(`/apps/${appId}/collections/${collectionId}`)
      setCollections(collections.filter(c => c.id !== collectionId))
    } catch (error) {
      console.error('Failed to delete collection:', error)
    }
  }

  const resetNewCollection = () => {
    setNewCollection({
      name: '',
      description: '',
      icon: 'database',
      color: '#6366f1',
      schema: []
    })
  }

  const addFieldToCollection = () => {
    if (!newField.name || !newField.type) return

    const field: FieldDefinition = {
      name: newField.name,
      type: newField.type,
      label: newField.label || newField.name,
      required: newField.required || false,
      unique: newField.unique || false,
      default: newField.default,
      options: newField.options || [],
      relation_collection_id: newField.relation_collection_id,
      relation_multiple: newField.relation_multiple || false,
      formula: newField.formula,
      validation: newField.validation
    }

    if (editingCollection) {
      setEditingCollection({
        ...editingCollection,
        schema: [...editingCollection.schema, field]
      })
    } else {
      setNewCollection({
        ...newCollection,
        schema: [...newCollection.schema, field]
      })
    }

    setNewField({
      name: '',
      type: 'text',
      label: '',
      required: false,
      unique: false,
      options: [],
      relation_multiple: false
    })
  }

  const removeField = (index: number) => {
    if (editingCollection) {
      setEditingCollection({
        ...editingCollection,
        schema: editingCollection.schema.filter((_, i) => i !== index)
      })
    } else {
      setNewCollection({
        ...newCollection,
        schema: newCollection.schema.filter((_, i) => i !== index)
      })
    }
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderFieldForm = () => (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <h4 className="font-medium">Add Field</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Field Name</Label>
          <Input
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            placeholder="field_name"
          />
        </div>
        <div>
          <Label>Display Label</Label>
          <Input
            value={newField.label}
            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
            placeholder="Field Label"
          />
        </div>
      </div>

      <div>
        <Label>Field Type</Label>
        <Select
          value={newField.type}
          onValueChange={(value) => setNewField({ ...newField, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <span className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  {type.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(newField.type === 'select' || newField.type === 'multiselect') && (
        <div>
          <Label>Options (one per line)</Label>
          <Textarea
            value={newField.options?.join('\n') || ''}
            onChange={(e) => setNewField({ 
              ...newField, 
              options: e.target.value.split('\n').filter(Boolean) 
            })}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={4}
          />
        </div>
      )}

      {newField.type === 'relation' && (
        <div className="space-y-2">
          <div>
            <Label>Related Collection</Label>
            <Select
              value={newField.relation_collection_id}
              onValueChange={(value) => setNewField({ ...newField, relation_collection_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newField.relation_multiple}
              onCheckedChange={(checked) => setNewField({ ...newField, relation_multiple: checked })}
            />
            <Label>Allow multiple relations</Label>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={newField.required}
            onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
          />
          <Label>Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={newField.unique}
            onCheckedChange={(checked) => setNewField({ ...newField, unique: checked })}
          />
          <Label>Unique</Label>
        </div>
      </div>

      <Button onClick={addFieldToCollection} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Field
      </Button>
    </div>
  )

  const renderSchemaPreview = (schema: FieldDefinition[]) => (
    <div className="space-y-2">
      {schema.map((field, index) => (
        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {FIELD_TYPES.find(t => t.value === field.type)?.icon || '📝'}
            </span>
            <div>
              <div className="font-medium">{field.label || field.name}</div>
              <div className="text-sm text-muted-foreground">
                {field.type}
                {field.required && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
                {field.unique && <Badge variant="outline" className="ml-2 text-xs">Unique</Badge>}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeField(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Collections</h2>
          <p className="text-muted-foreground">
            Create and manage custom data collections for your app
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Collections Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: collection.color }}
                    >
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{collection.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {collection.record_count} records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCollection(collection)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCollection(collection.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {collection.description || 'No description'}
                </p>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Fields ({collection.schema.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {collection.schema.slice(0, 4).map((field, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {field.name}
                      </Badge>
                    ))}
                    {collection.schema.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{collection.schema.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View Data
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Collection Name</Label>
                  <Input
                    value={newCollection.name}
                    onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                    placeholder="e.g., Products, Customers, Orders"
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={newCollection.icon}
                    onValueChange={(value) => setNewCollection({ ...newCollection, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLECTION_ICONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  placeholder="Describe what this collection stores..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCollection.color}
                    onChange={(e) => setNewCollection({ ...newCollection, color: e.target.value })}
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={newCollection.color}
                    onChange={(e) => setNewCollection({ ...newCollection, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="schema" className="space-y-4">
              {renderFieldForm()}
              
              {newCollection.schema.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Schema Preview</h4>
                  {renderSchemaPreview(newCollection.schema)}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createCollection} disabled={!newCollection.name}>
              Create Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      {editingCollection && (
        <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Collection: {editingCollection.name}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Collection Name</Label>
                    <Input
                      value={editingCollection.name}
                      onChange={(e) => setEditingCollection({ 
                        ...editingCollection, 
                        name: e.target.value 
                      })}
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Select
                      value={editingCollection.icon}
                      onValueChange={(value) => setEditingCollection({ 
                        ...editingCollection, 
                        icon: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECTION_ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingCollection.description}
                    onChange={(e) => setEditingCollection({ 
                      ...editingCollection, 
                      description: e.target.value 
                    })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCollection.color}
                      onChange={(e) => setEditingCollection({ 
                        ...editingCollection, 
                        color: e.target.value 
                      })}
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={editingCollection.color}
                      onChange={(e) => setEditingCollection({ 
                        ...editingCollection, 
                        color: e.target.value 
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="schema" className="space-y-4">
                {renderFieldForm()}
                
                {editingCollection.schema.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Current Schema</h4>
                    {renderSchemaPreview(editingCollection.schema)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingCollection(null)}>
                Cancel
              </Button>
              <Button onClick={() => updateCollection(editingCollection)}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}