'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, Database, Zap, Link, Code, Eye, Play, Save,
  Plus, Trash2, Edit, Copy, ChevronRight, ChevronDown,
  MousePointer2, FormInput, Mail, MessageSquare, Globe,
  CreditCard, ShoppingCart, Users, Calendar, BarChart,
  Filter, SortAsc, Search, RefreshCw, Bell, Lock,
  Webhook, Key, Palette, Layout, Target, Activity
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

// Widget configuration types
interface WidgetConfig {
  id: string
  type: string
  props: Record<string, any>
  style: Record<string, any>
  dataBinding?: DataBinding
  actions?: ActionConfig[]
  events?: Record<string, EventHandler[]>
  validation?: ValidationRule[]
  permissions?: PermissionRule[]
}

interface DataBinding {
  sourceType: 'collection' | 'api' | 'static'
  sourceId?: string
  endpointId?: string
  fieldMappings: Record<string, string>
  filters?: FilterRule[]
  sorting?: SortRule[]
  pagination?: PaginationConfig
  refreshInterval?: number
  cacheEnabled?: boolean
}

interface ActionConfig {
  id: string
  type: string
  name: string
  config: Record<string, any>
  conditions?: ConditionRule[]
  enabled: boolean
}

interface EventHandler {
  eventType: string
  actions: string[] // Action IDs
  debounce?: number
  once?: boolean
}

interface ValidationRule {
  field: string
  type: 'required' | 'email' | 'number' | 'pattern' | 'length'
  params?: Record<string, any>
  message?: string
}

interface PermissionRule {
  action: string
  roles: string[]
  conditions?: Record<string, any>
}

interface FilterRule {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in'
  value: any
}

interface SortRule {
  field: string
  order: 'asc' | 'desc'
}

interface PaginationConfig {
  enabled: boolean
  pageSize: number
  showControls: boolean
}

interface ConditionRule {
  field: string
  operator: string
  value: any
  logic?: 'and' | 'or'
}

interface WidgetConfigPanelProps {
  widget: WidgetConfig
  appId: string
  onUpdate: (updates: Partial<WidgetConfig>) => void
  onClose: () => void
}

export function WidgetConfigPanel({ 
  widget, 
  appId, 
  onUpdate, 
  onClose 
}: WidgetConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('properties')
  const [dataSources, setDataSources] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [actions, setActions] = useState<ActionConfig[]>(widget.actions || [])
  const [dataBinding, setDataBinding] = useState<DataBinding | undefined>(widget.dataBinding)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDataSources()
  }, [appId])

  const loadDataSources = async () => {
    setLoading(true)
    try {
      const [sourcesRes, collectionsRes] = await Promise.all([
        apiClient.get(`/data-sources?app_id=${appId}`).catch(() => ({ data: { data_sources: [] } })),
        apiClient.get(`/apps/${appId}/collections`).catch(() => ({ data: { collections: [] } }))
      ])
      
      setDataSources(sourcesRes.data.data_sources || [])
      setCollections(collectionsRes.data.collections || [])
    } catch (error) {
      console.error('Failed to load data sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(() => {
    onUpdate({
      actions,
      dataBinding,
      // Include other updated properties
    })
  }, [actions, dataBinding, onUpdate])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configure {widget.type}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="flex-1 overflow-y-auto">
            <PropertiesPanel widget={widget} onUpdate={onUpdate} />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="flex-1 overflow-y-auto">
            <DataBindingPanel 
              widget={widget}
              dataBinding={dataBinding}
              dataSources={dataSources}
              collections={collections}
              onUpdate={setDataBinding}
            />
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="flex-1 overflow-y-auto">
            <ActionsPanel 
              widget={widget}
              actions={actions}
              onUpdate={setActions}
              appId={appId}
            />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="flex-1 overflow-y-auto">
            <EventsPanel 
              widget={widget}
              events={widget.events || {}}
              actions={actions}
              onUpdate={(events) => onUpdate({ events })}
            />
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="flex-1 overflow-y-auto">
            <StylePanel 
              widget={widget}
              onUpdate={(style) => onUpdate({ style })}
            />
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="flex-1 overflow-y-auto">
            <AdvancedPanel 
              widget={widget}
              onUpdate={onUpdate}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Properties Panel Component
function PropertiesPanel({ 
  widget, 
  onUpdate 
}: { 
  widget: WidgetConfig
  onUpdate: (updates: Partial<WidgetConfig>) => void 
}) {
  const [props, setProps] = useState(widget.props || {})

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...props, [key]: value }
    setProps(newProps)
    onUpdate({ props: newProps })
  }

  const getPropertyFields = () => {
    switch (widget.type) {
      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={props.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                placeholder="Click me"
              />
            </div>
            <div>
              <Label htmlFor="variant">Variant</Label>
              <Select value={props.variant || 'default'} onValueChange={(v) => handlePropChange('variant', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="destructive">Destructive</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Select value={props.size || 'default'} onValueChange={(v) => handlePropChange('size', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="disabled"
                checked={props.disabled || false}
                onCheckedChange={(checked) => handlePropChange('disabled', checked)}
              />
              <Label htmlFor="disabled">Disabled</Label>
            </div>
          </div>
        )

      case 'form':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={props.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Contact Form"
              />
            </div>
            <div>
              <Label htmlFor="method">Method</Label>
              <Select value={props.method || 'POST'} onValueChange={(v) => handlePropChange('method', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="submitText">Submit Button Text</Label>
              <Input
                id="submitText"
                value={props.submitText || ''}
                onChange={(e) => handlePropChange('submitText', e.target.value)}
                placeholder="Submit"
              />
            </div>
          </div>
        )

      case 'data-table':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Table Title</Label>
              <Input
                id="title"
                value={props.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Data Table"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="searchable"
                checked={props.searchable || false}
                onCheckedChange={(checked) => handlePropChange('searchable', checked)}
              />
              <Label htmlFor="searchable">Enable Search</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sortable"
                checked={props.sortable || false}
                onCheckedChange={(checked) => handlePropChange('sortable', checked)}
              />
              <Label htmlFor="sortable">Enable Sorting</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="filterable"
                checked={props.filterable || false}
                onCheckedChange={(checked) => handlePropChange('filterable', checked)}
              />
              <Label htmlFor="filterable">Enable Filtering</Label>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={props.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Widget Title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={props.description || ''}
                onChange={(e) => handlePropChange('description', e.target.value)}
                placeholder="Widget description"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Widget Properties</h3>
          {getPropertyFields()}
        </div>
      </div>
    </ScrollArea>
  )
}

// Data Binding Panel Component
function DataBindingPanel({ 
  widget,
  dataBinding,
  dataSources,
  collections,
  onUpdate
}: {
  widget: WidgetConfig
  dataBinding?: DataBinding
  dataSources: any[]
  collections: any[]
  onUpdate: (binding?: DataBinding) => void
}) {
  const [binding, setBinding] = useState<DataBinding | undefined>(dataBinding)

  const handleBindingChange = (updates: Partial<DataBinding>) => {
    const newBinding = binding ? { ...binding, ...updates } : {
      sourceType: 'collection' as const,
      fieldMappings: {},
      ...updates
    }
    setBinding(newBinding)
    onUpdate(newBinding)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Data Binding</h3>
          
          {/* Data Source Selection */}
          <div className="space-y-4">
            <div>
              <Label>Data Source Type</Label>
              <Select 
                value={binding?.sourceType || 'static'} 
                onValueChange={(value: 'collection' | 'api' | 'static') => 
                  handleBindingChange({ sourceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static Data</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="api">API Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {binding?.sourceType === 'collection' && (
              <div>
                <Label>Collection</Label>
                <Select 
                  value={binding.sourceId || ''} 
                  onValueChange={(value) => handleBindingChange({ sourceId: value })}
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
            )}

            {binding?.sourceType === 'api' && (
              <div className="space-y-4">
                <div>
                  <Label>Data Source</Label>
                  <Select 
                    value={binding.sourceId || ''} 
                    onValueChange={(value) => handleBindingChange({ sourceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {binding.sourceId && (
                  <div>
                    <Label>Endpoint</Label>
                    <Select 
                      value={binding.endpointId || ''} 
                      onValueChange={(value) => handleBindingChange({ endpointId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* This would be populated based on selected data source */}
                        <SelectItem value="endpoint1">GET /users</SelectItem>
                        <SelectItem value="endpoint2">GET /products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Field Mappings */}
          {binding && binding.sourceType !== 'static' && (
            <div className="space-y-4">
              <Separator />
              <div>
                <Label className="text-base font-medium">Field Mappings</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Map data fields to widget properties
                </p>
                
                <div className="space-y-2">
                  {Object.entries(binding.fieldMappings || {}).map(([widgetField, dataField], index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Widget field"
                        value={widgetField}
                        onChange={(e) => {
                          const newMappings = { ...binding.fieldMappings }
                          delete newMappings[widgetField]
                          newMappings[e.target.value] = dataField
                          handleBindingChange({ fieldMappings: newMappings })
                        }}
                      />
                      <span>→</span>
                      <Input
                        placeholder="Data field"
                        value={dataField}
                        onChange={(e) => {
                          const newMappings = { ...binding.fieldMappings }
                          newMappings[widgetField] = e.target.value
                          handleBindingChange({ fieldMappings: newMappings })
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMappings = { ...binding.fieldMappings }
                          delete newMappings[widgetField]
                          handleBindingChange({ fieldMappings: newMappings })
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMappings = { ...binding.fieldMappings, '': '' }
                      handleBindingChange({ fieldMappings: newMappings })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Mapping
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          {binding && binding.sourceType !== 'static' && (
            <div className="space-y-4">
              <Separator />
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger>Advanced Options</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <Label>Refresh Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={binding.refreshInterval || 0}
                        onChange={(e) => handleBindingChange({ refreshInterval: parseInt(e.target.value) })}
                        placeholder="0 = No auto-refresh"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={binding.cacheEnabled || false}
                        onCheckedChange={(checked) => handleBindingChange({ cacheEnabled: checked })}
                      />
                      <Label>Enable Caching</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

// Actions Panel Component
function ActionsPanel({ 
  widget,
  actions,
  onUpdate,
  appId
}: {
  widget: WidgetConfig
  actions: ActionConfig[]
  onUpdate: (actions: ActionConfig[]) => void
  appId: string
}) {
  const [showActionBuilder, setShowActionBuilder] = useState(false)
  const [editingAction, setEditingAction] = useState<ActionConfig | null>(null)

  const addAction = (action: ActionConfig) => {
    onUpdate([...actions, action])
  }

  const updateAction = (index: number, updates: Partial<ActionConfig>) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], ...updates }
    onUpdate(newActions)
  }

  const removeAction = (index: number) => {
    onUpdate(actions.filter((_, i) => i !== index))
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Actions</h3>
          <Button size="sm" onClick={() => setShowActionBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Action
          </Button>
        </div>

        {actions.length === 0 ? (
          <Card className="p-6 border-dashed">
            <div className="text-center text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No actions configured</p>
              <p className="text-xs">Add actions to make your widget interactive</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <Card key={action.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={action.enabled}
                      onCheckedChange={(checked) => updateAction(index, { enabled: checked })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAction(action)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Action Builder Dialog */}
        {showActionBuilder && (
          <ActionBuilderDialog
            onSave={addAction}
            onClose={() => setShowActionBuilder(false)}
            appId={appId}
          />
        )}

        {/* Edit Action Dialog */}
        {editingAction && (
          <ActionBuilderDialog
            action={editingAction}
            onSave={(action) => {
              const index = actions.findIndex(a => a.id === editingAction.id)
              if (index >= 0) {
                updateAction(index, action)
              }
              setEditingAction(null)
            }}
            onClose={() => setEditingAction(null)}
            appId={appId}
          />
        )}
      </div>
    </ScrollArea>
  )
}

// Events Panel Component
function EventsPanel({ 
  widget,
  events,
  actions,
  onUpdate
}: {
  widget: WidgetConfig
  events: Record<string, EventHandler[]>
  actions: ActionConfig[]
  onUpdate: (events: Record<string, EventHandler[]>) => void
}) {
  const eventTypes = [
    { id: 'click', name: 'Click', icon: MousePointer2 },
    { id: 'submit', name: 'Submit', icon: FormInput },
    { id: 'change', name: 'Change', icon: Edit },
    { id: 'focus', name: 'Focus', icon: Target },
    { id: 'blur', name: 'Blur', icon: Eye },
    { id: 'hover', name: 'Hover', icon: MousePointer2 },
  ]

  const addEventHandler = (eventType: string) => {
    const newEvents = { ...events }
    if (!newEvents[eventType]) {
      newEvents[eventType] = []
    }
    newEvents[eventType].push({
      eventType,
      actions: [],
      debounce: 0,
      once: false
    })
    onUpdate(newEvents)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Event Handlers</h3>
        </div>

        <div className="space-y-4">
          {eventTypes.map((eventType) => {
            const handlers = events[eventType.id] || []
            const IconComponent = eventType.icon

            return (
              <Card key={eventType.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{eventType.name}</span>
                    <Badge variant="secondary">{handlers.length}</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addEventHandler(eventType.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {handlers.length > 0 && (
                  <div className="space-y-2">
                    {handlers.map((handler, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {handler.actions.length} action(s)
                            </p>
                            {handler.debounce > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Debounce: {handler.debounce}ms
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newEvents = { ...events }
                              newEvents[eventType.id] = handlers.filter((_, i) => i !== index)
                              onUpdate(newEvents)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

// Style Panel Component
function StylePanel({ 
  widget,
  onUpdate
}: {
  widget: WidgetConfig
  onUpdate: (style: Record<string, any>) => void
}) {
  const [style, setStyle] = useState(widget.style || {})

  const handleStyleChange = (key: string, value: any) => {
    const newStyle = { ...style, [key]: value }
    setStyle(newStyle)
    onUpdate(newStyle)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Styling</h3>
          
          <Accordion type="multiple" defaultValue={['layout', 'appearance']}>
            <AccordionItem value="layout">
              <AccordionTrigger>Layout</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Width</Label>
                    <Input
                      value={style.width || ''}
                      onChange={(e) => handleStyleChange('width', e.target.value)}
                      placeholder="auto"
                    />
                  </div>
                  <div>
                    <Label>Height</Label>
                    <Input
                      value={style.height || ''}
                      onChange={(e) => handleStyleChange('height', e.target.value)}
                      placeholder="auto"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label>Margin</Label>
                    <Input
                      value={style.margin || ''}
                      onChange={(e) => handleStyleChange('margin', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Padding</Label>
                    <Input
                      value={style.padding || ''}
                      onChange={(e) => handleStyleChange('padding', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="appearance">
              <AccordionTrigger>Appearance</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={style.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={style.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Border Radius</Label>
                  <Slider
                    value={[parseInt(style.borderRadius) || 0]}
                    onValueChange={([value]) => handleStyleChange('borderRadius', `${value}px`)}
                    max={50}
                    step={1}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="typography">
              <AccordionTrigger>Typography</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <Label>Font Size</Label>
                  <Select 
                    value={style.fontSize || 'inherit'} 
                    onValueChange={(value) => handleStyleChange('fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">Inherit</SelectItem>
                      <SelectItem value="12px">12px</SelectItem>
                      <SelectItem value="14px">14px</SelectItem>
                      <SelectItem value="16px">16px</SelectItem>
                      <SelectItem value="18px">18px</SelectItem>
                      <SelectItem value="20px">20px</SelectItem>
                      <SelectItem value="24px">24px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Font Weight</Label>
                  <Select 
                    value={style.fontWeight || 'normal'} 
                    onValueChange={(value) => handleStyleChange('fontWeight', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="lighter">Lighter</SelectItem>
                      <SelectItem value="bolder">Bolder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </ScrollArea>
  )
}

// Advanced Panel Component
function AdvancedPanel({ 
  widget,
  onUpdate
}: {
  widget: WidgetConfig
  onUpdate: (updates: Partial<WidgetConfig>) => void
}) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Advanced Settings</h3>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="permissions">
              <AccordionTrigger>Permissions & Security</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure who can interact with this widget
                </p>
                {/* Permission configuration would go here */}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="validation">
              <AccordionTrigger>Validation Rules</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up data validation for form inputs
                </p>
                {/* Validation rules would go here */}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="custom">
              <AccordionTrigger>Custom Code</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Label>Custom CSS</Label>
                    <Textarea
                      placeholder="/* Custom CSS styles */"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                  
                  <div>
                    <Label>Custom JavaScript</Label>
                    <Textarea
                      placeholder="// Custom JavaScript code"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </ScrollArea>
  )
}

// Action Builder Dialog Component
function ActionBuilderDialog({ 
  action,
  onSave,
  onClose,
  appId
}: {
  action?: ActionConfig
  onSave: (action: ActionConfig) => void
  onClose: () => void
  appId: string
}) {
  const [actionConfig, setActionConfig] = useState<ActionConfig>(
    action || {
      id: `action_${Date.now()}`,
      type: 'send_email',
      name: 'New Action',
      config: {},
      enabled: true
    }
  )

  const actionTypes = [
    { id: 'send_email', name: 'Send Email', icon: Mail },
    { id: 'create_record', name: 'Create Record', icon: Database },
    { id: 'api_call', name: 'API Call', icon: Globe },
    { id: 'redirect', name: 'Redirect', icon: ExternalLink },
    { id: 'show_message', name: 'Show Message', icon: MessageSquare },
  ]

  const handleSave = () => {
    onSave(actionConfig)
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {action ? 'Edit Action' : 'Create Action'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Action Name</Label>
            <Input
              value={actionConfig.name}
              onChange={(e) => setActionConfig({ ...actionConfig, name: e.target.value })}
              placeholder="Action name"
            />
          </div>

          <div>
            <Label>Action Type</Label>
            <Select 
              value={actionConfig.type} 
              onValueChange={(value) => setActionConfig({ ...actionConfig, type: value, config: {} })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action-specific configuration */}
          {actionConfig.type === 'send_email' && (
            <div className="space-y-4">
              <div>
                <Label>To Email</Label>
                <Input
                  value={actionConfig.config.to || ''}
                  onChange={(e) => setActionConfig({
                    ...actionConfig,
                    config: { ...actionConfig.config, to: e.target.value }
                  })}
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={actionConfig.config.subject || ''}
                  onChange={(e) => setActionConfig({
                    ...actionConfig,
                    config: { ...actionConfig.config, subject: e.target.value }
                  })}
                  placeholder="Email subject"
                />
              </div>
            </div>
          )}

          {actionConfig.type === 'create_record' && (
            <div className="space-y-4">
              <div>
                <Label>Collection</Label>
                <Select 
                  value={actionConfig.config.collection_id || ''} 
                  onValueChange={(value) => setActionConfig({
                    ...actionConfig,
                    config: { ...actionConfig.config, collection_id: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would be populated with actual collections */}
                    <SelectItem value="collection1">Users</SelectItem>
                    <SelectItem value="collection2">Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}