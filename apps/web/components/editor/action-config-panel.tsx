'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import {
  Plus,
  Trash2,
  Settings,
  Zap,
  MousePointer,
  Send,
  Database,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  Eye,
  EyeOff,
  RotateCcw,
  Clock,
  GitBranch,
  Repeat,
  Workflow
} from 'lucide-react'

import { ActionConfig, EventHandler, WidgetAction, getActionService } from '@/lib/action-service'

interface ActionConfigPanelProps {
  appId: string
  widgetId: string
  elementType: string
  isOpen: boolean
  onClose: () => void
  onSave: (actions: WidgetAction[]) => void
}

const EVENT_TYPES = [
  { value: 'click', label: 'Click', icon: MousePointer, description: 'When element is clicked' },
  { value: 'submit', label: 'Submit', icon: Send, description: 'When form is submitted' },
  { value: 'change', label: 'Change', icon: Settings, description: 'When value changes' },
  { value: 'load', label: 'Load', icon: RotateCcw, description: 'When element loads' },
  { value: 'hover', label: 'Hover', icon: Eye, description: 'When element is hovered' },
  { value: 'focus', label: 'Focus', icon: Eye, description: 'When element gains focus' },
  { value: 'blur', label: 'Blur', icon: EyeOff, description: 'When element loses focus' },
  { value: 'timer', label: 'Timer', icon: Clock, description: 'On timer interval' },
  { value: 'custom', label: 'Custom', icon: Zap, description: 'Custom event trigger' }
]

const ACTION_TYPES = [
  { 
    value: 'navigate', 
    label: 'Navigate', 
    icon: ExternalLink, 
    description: 'Navigate to URL or page',
    category: 'Navigation'
  },
  { 
    value: 'create_record', 
    label: 'Create Record', 
    icon: Database, 
    description: 'Create new database record',
    category: 'Data'
  },
  { 
    value: 'update_record', 
    label: 'Update Record', 
    icon: Database, 
    description: 'Update existing record',
    category: 'Data'
  },
  { 
    value: 'delete_record', 
    label: 'Delete Record', 
    icon: Database, 
    description: 'Delete database record',
    category: 'Data'
  },
  { 
    value: 'query_data', 
    label: 'Query Data', 
    icon: Database, 
    description: 'Query database records',
    category: 'Data'
  },
  { 
    value: 'send_email', 
    label: 'Send Email', 
    icon: Mail, 
    description: 'Send email notification',
    category: 'Communication'
  },
  { 
    value: 'send_sms', 
    label: 'Send SMS', 
    icon: Phone, 
    description: 'Send SMS message',
    category: 'Communication'
  },
  { 
    value: 'api_call', 
    label: 'API Call', 
    icon: Zap, 
    description: 'Make HTTP API request',
    category: 'Integration'
  },
  { 
    value: 'show_message', 
    label: 'Show Message', 
    icon: MessageSquare, 
    description: 'Display notification message',
    category: 'UI'
  },
  { 
    value: 'update_element', 
    label: 'Update Element', 
    icon: Settings, 
    description: 'Update another element',
    category: 'UI'
  },
  { 
    value: 'toggle_visibility', 
    label: 'Toggle Visibility', 
    icon: Eye, 
    description: 'Show/hide elements',
    category: 'UI'
  },
  { 
    value: 'open_modal', 
    label: 'Open Modal', 
    icon: ExternalLink, 
    description: 'Open modal dialog',
    category: 'UI'
  },
  { 
    value: 'redirect', 
    label: 'Redirect', 
    icon: ExternalLink, 
    description: 'Redirect to another page',
    category: 'Navigation'
  },
  { 
    value: 'delay', 
    label: 'Delay', 
    icon: Clock, 
    description: 'Wait for specified time',
    category: 'Flow'
  },
  { 
    value: 'condition', 
    label: 'Condition', 
    icon: GitBranch, 
    description: 'Conditional logic',
    category: 'Flow'
  },
  { 
    value: 'loop', 
    label: 'Loop', 
    icon: Repeat, 
    description: 'Repeat actions',
    category: 'Flow'
  },
  { 
    value: 'trigger_automation', 
    label: 'Trigger Automation', 
    icon: Workflow, 
    description: 'Start automation workflow',
    category: 'Automation'
  },
  { 
    value: 'trigger_app_event', 
    label: 'Trigger App Event', 
    icon: Zap, 
    description: 'Trigger event in another app',
    category: 'Cross-App'
  },
  { 
    value: 'send_app_message', 
    label: 'Send App Message', 
    icon: MessageSquare, 
    description: 'Send message to another app',
    category: 'Cross-App'
  },
  { 
    value: 'sync_app_data', 
    label: 'Sync App Data', 
    icon: Database, 
    description: 'Synchronize data between apps',
    category: 'Cross-App'
  },
  { 
    value: 'access_shared_data', 
    label: 'Access Shared Data', 
    icon: Database, 
    description: 'Access data from shared collection',
    category: 'Cross-App'
  }
]

export function ActionConfigPanel({
  appId,
  widgetId,
  elementType,
  isOpen,
  onClose,
  onSave
}: ActionConfigPanelProps) {
  const [actions, setActions] = useState<WidgetAction[]>([])
  const [selectedAction, setSelectedAction] = useState<WidgetAction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<Record<string, any>>({})

  const actionService = getActionService(appId)

  // Load existing actions
  useEffect(() => {
    if (isOpen && widgetId) {
      loadWidgetActions()
      loadActionTemplates()
    }
  }, [isOpen, widgetId])

  const loadWidgetActions = async () => {
    setIsLoading(true)
    try {
      const widgetActions = await actionService.getWidgetActions(widgetId)
      // Convert to full action format (simplified for now)
      setActions([])
    } catch (error) {
      console.error('Failed to load widget actions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActionTemplates = async () => {
    try {
      const actionTemplates = await actionService.getActionTemplates()
      setTemplates(actionTemplates)
    } catch (error) {
      console.error('Failed to load action templates:', error)
    }
  }

  const createNewAction = () => {
    const newAction: WidgetAction = {
      app_id: appId,
      name: `${elementType} Action`,
      description: `Action for ${elementType} widget`,
      event_handlers: [{
        event_type: 'click',
        element_selector: `#${widgetId}`,
        actions: []
      }],
      is_active: true
    }
    setActions([...actions, newAction])
    setSelectedAction(newAction)
  }

  const updateAction = (index: number, updates: Partial<WidgetAction>) => {
    const updatedActions = [...actions]
    updatedActions[index] = { ...updatedActions[index], ...updates }
    setActions(updatedActions)
    
    if (selectedAction === actions[index]) {
      setSelectedAction(updatedActions[index])
    }
  }

  const deleteAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index)
    setActions(updatedActions)
    
    if (selectedAction === actions[index]) {
      setSelectedAction(null)
    }
  }

  const addEventHandler = (actionIndex: number) => {
    const newHandler: EventHandler = {
      event_type: 'click',
      element_selector: `#${widgetId}`,
      actions: []
    }
    
    const updatedActions = [...actions]
    updatedActions[actionIndex].event_handlers.push(newHandler)
    setActions(updatedActions)
  }

  const updateEventHandler = (actionIndex: number, handlerIndex: number, updates: Partial<EventHandler>) => {
    const updatedActions = [...actions]
    updatedActions[actionIndex].event_handlers[handlerIndex] = {
      ...updatedActions[actionIndex].event_handlers[handlerIndex],
      ...updates
    }
    setActions(updatedActions)
  }

  const addActionToHandler = (actionIndex: number, handlerIndex: number) => {
    const newActionConfig: ActionConfig = {
      type: 'show_message',
      config: {
        message: 'Action executed!',
        type: 'success'
      }
    }
    
    const updatedActions = [...actions]
    updatedActions[actionIndex].event_handlers[handlerIndex].actions.push(newActionConfig)
    setActions(updatedActions)
  }

  const updateActionConfig = (
    actionIndex: number, 
    handlerIndex: number, 
    configIndex: number, 
    updates: Partial<ActionConfig>
  ) => {
    const updatedActions = [...actions]
    updatedActions[actionIndex].event_handlers[handlerIndex].actions[configIndex] = {
      ...updatedActions[actionIndex].event_handlers[handlerIndex].actions[configIndex],
      ...updates
    }
    setActions(updatedActions)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save actions via API
      for (const action of actions) {
        if (action.id) {
          await actionService.updateAction(action.id, action)
        } else {
          const actionId = await actionService.createAction(action)
          action.id = actionId
        }
      }
      
      onSave(actions)
      onClose()
    } catch (error) {
      console.error('Failed to save actions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderActionConfig = (actionConfig: ActionConfig, actionIndex: number, handlerIndex: number, configIndex: number) => {
    const actionType = ACTION_TYPES.find(t => t.value === actionConfig.type)
    
    return (
      <Card key={configIndex} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {actionType?.icon && <actionType.icon className="w-4 h-4" />}
              <CardTitle className="text-sm">{actionType?.label || actionConfig.type}</CardTitle>
              <Badge variant="outline" className="text-xs">{actionType?.category}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const updatedActions = [...actions]
                updatedActions[actionIndex].event_handlers[handlerIndex].actions.splice(configIndex, 1)
                setActions(updatedActions)
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">{actionType?.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Action Type</Label>
            <Select
              value={actionConfig.type}
              onValueChange={(value) => updateActionConfig(actionIndex, handlerIndex, configIndex, { 
                type: value as any,
                config: {} // Reset config when type changes
              })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  ACTION_TYPES.reduce((acc, action) => {
                    if (!acc[action.category]) acc[action.category] = []
                    acc[action.category].push(action)
                    return acc
                  }, {} as Record<string, typeof ACTION_TYPES>)
                ).map(([category, categoryActions]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{category}</div>
                    {categoryActions.map(action => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="flex items-center gap-2">
                          <action.icon className="w-3 h-3" />
                          {action.label}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action-specific configuration */}
          {actionConfig.type === 'navigate' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">URL</Label>
                <Input
                  placeholder="https://example.com or /page"
                  value={actionConfig.config.url || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, url: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={actionConfig.config.open_in_new_tab || false}
                  onCheckedChange={(checked) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, open_in_new_tab: checked }
                  })}
                />
                <Label className="text-xs">Open in new tab</Label>
              </div>
            </div>
          )}

          {actionConfig.type === 'show_message' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Message</Label>
                <Input
                  placeholder="Enter message text"
                  value={actionConfig.config.message || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, message: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={actionConfig.config.type || 'info'}
                  onValueChange={(value) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, type: value }
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {actionConfig.type === 'send_email' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">To Email</Label>
                <Input
                  placeholder="recipient@example.com or {email}"
                  value={actionConfig.config.to || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, to: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={actionConfig.config.subject || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, subject: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Body</Label>
                <Textarea
                  placeholder="Email body content"
                  value={actionConfig.config.body || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, body: e.target.value }
                  })}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          )}

          {actionConfig.type === 'api_call' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">URL</Label>
                <Input
                  placeholder="https://api.example.com/endpoint"
                  value={actionConfig.config.url || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, url: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select
                  value={actionConfig.config.method || 'POST'}
                  onValueChange={(value) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, method: value }
                  })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Request Body (JSON)</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={JSON.stringify(actionConfig.config.body || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const body = JSON.parse(e.target.value)
                      updateActionConfig(actionIndex, handlerIndex, configIndex, {
                        config: { ...actionConfig.config, body }
                      })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="min-h-[60px] font-mono text-xs"
                />
              </div>
            </div>
          )}

          {(actionConfig.type === 'create_record' || actionConfig.type === 'update_record') && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Collection ID</Label>
                <Input
                  placeholder="Collection UUID"
                  value={actionConfig.config.collection_id || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, collection_id: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Data (JSON)</Label>
                <Textarea
                  placeholder='{"field": "value", "email": "{email}"}'
                  value={JSON.stringify(actionConfig.config.data || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value)
                      updateActionConfig(actionIndex, handlerIndex, configIndex, {
                        config: { ...actionConfig.config, data }
                      })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="min-h-[60px] font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Cross-App Actions */}
          {actionConfig.type === 'trigger_app_event' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Target App ID</Label>
                <Input
                  placeholder="App UUID to trigger event in"
                  value={actionConfig.config.target_app_id || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, target_app_id: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Event Type</Label>
                <Input
                  placeholder="e.g., user_created, order_completed"
                  value={actionConfig.config.event_type || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, event_type: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Event Data (JSON)</Label>
                <Textarea
                  placeholder='{"user_id": "{user_id}", "source": "website"}'
                  value={JSON.stringify(actionConfig.config.event_data || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const event_data = JSON.parse(e.target.value)
                      updateActionConfig(actionIndex, handlerIndex, configIndex, {
                        config: { ...actionConfig.config, event_data }
                      })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="min-h-[60px] font-mono text-xs"
                />
              </div>
            </div>
          )}

          {actionConfig.type === 'send_app_message' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">To App ID</Label>
                <Input
                  placeholder="App UUID to send message to"
                  value={actionConfig.config.to_app_id || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, to_app_id: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Message Type</Label>
                <Input
                  placeholder="e.g., notification, alert, data_update"
                  value={actionConfig.config.message_type || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, message_type: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Subject</Label>
                <Input
                  placeholder="Message subject"
                  value={actionConfig.config.subject || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, subject: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Payload (JSON)</Label>
                <Textarea
                  placeholder='{"data": "{form_data}", "priority": "high"}'
                  value={JSON.stringify(actionConfig.config.payload || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const payload = JSON.parse(e.target.value)
                      updateActionConfig(actionIndex, handlerIndex, configIndex, {
                        config: { ...actionConfig.config, payload }
                      })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="min-h-[60px] font-mono text-xs"
                />
              </div>
            </div>
          )}

          {actionConfig.type === 'sync_app_data' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Sync Job ID</Label>
                <Input
                  placeholder="Data sync job UUID"
                  value={actionConfig.config.sync_job_id || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, sync_job_id: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
            </div>
          )}

          {actionConfig.type === 'access_shared_data' && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Collection ID</Label>
                <Input
                  placeholder="Shared collection UUID"
                  value={actionConfig.config.collection_id || ''}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, collection_id: e.target.value }
                  })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Filters (JSON)</Label>
                <Textarea
                  placeholder='{"status": "active", "category": "{category}"}'
                  value={JSON.stringify(actionConfig.config.filters || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const filters = JSON.parse(e.target.value)
                      updateActionConfig(actionIndex, handlerIndex, configIndex, {
                        config: { ...actionConfig.config, filters }
                      })
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="min-h-[60px] font-mono text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Limit</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={actionConfig.config.limit || 50}
                  onChange={(e) => updateActionConfig(actionIndex, handlerIndex, configIndex, {
                    config: { ...actionConfig.config, limit: parseInt(e.target.value) || 50 }
                  })}
                  className="h-8"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!isOpen) return null

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Configure Actions</h2>
            <p className="text-sm text-muted-foreground">
              Set up actions for {elementType} widget events
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Actions List */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Actions</h3>
              <Button size="sm" onClick={createNewAction}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {actions.map((action, index) => (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedAction === action && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedAction(action)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{action.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {action.event_handlers.length} event{action.event_handlers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAction(index)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {actions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No actions configured</p>
                  <p className="text-xs">Click "Add" to create your first action</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Configuration */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedAction ? (
              <div className="space-y-6">
                <div>
                  <Label>Action Name</Label>
                  <Input
                    value={selectedAction.name}
                    onChange={(e) => {
                      const index = actions.indexOf(selectedAction)
                      updateAction(index, { name: e.target.value })
                    }}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedAction.description || ''}
                    onChange={(e) => {
                      const index = actions.indexOf(selectedAction)
                      updateAction(index, { description: e.target.value })
                    }}
                    placeholder="Describe what this action does"
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Event Handlers</h4>
                    <Button
                      size="sm"
                      onClick={() => addEventHandler(actions.indexOf(selectedAction))}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Event
                    </Button>
                  </div>

                  {selectedAction.event_handlers.map((handler, handlerIndex) => (
                    <Card key={handlerIndex} className="mb-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Event Handler {handlerIndex + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const actionIndex = actions.indexOf(selectedAction)
                              const updatedActions = [...actions]
                              updatedActions[actionIndex].event_handlers.splice(handlerIndex, 1)
                              setActions(updatedActions)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs">Event Type</Label>
                          <Select
                            value={handler.event_type}
                            onValueChange={(value) => updateEventHandler(
                              actions.indexOf(selectedAction),
                              handlerIndex,
                              { event_type: value as any }
                            )}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_TYPES.map(event => (
                                <SelectItem key={event.value} value={event.value}>
                                  <div className="flex items-center gap-2">
                                    <event.icon className="w-3 h-3" />
                                    <div>
                                      <div className="font-medium">{event.label}</div>
                                      <div className="text-xs text-muted-foreground">{event.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Element Selector</Label>
                          <Input
                            placeholder="#element-id or .class-name"
                            value={handler.element_selector || ''}
                            onChange={(e) => updateEventHandler(
                              actions.indexOf(selectedAction),
                              handlerIndex,
                              { element_selector: e.target.value }
                            )}
                            className="h-8"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs">Actions</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addActionToHandler(actions.indexOf(selectedAction), handlerIndex)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Action
                            </Button>
                          </div>

                          {handler.actions.map((actionConfig, configIndex) => 
                            renderActionConfig(
                              actionConfig,
                              actions.indexOf(selectedAction),
                              handlerIndex,
                              configIndex
                            )
                          )}

                          {handler.actions.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
                              <p className="text-sm">No actions configured</p>
                              <p className="text-xs">Click "Add Action" to get started</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an action to configure</p>
                  <p className="text-sm">Or create a new action to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {actions.length} action{actions.length !== 1 ? 's' : ''} configured
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Actions'}
            </Button>
          </div>
        </div>
      </m.div>
    </m.div>
  )
}