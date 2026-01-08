'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  Settings,
  Save,
  ChevronRight,
  Mail,
  MessageSquare,
  Database,
  Globe,
  Clock,
  GitBranch,
  Repeat,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Copy,
  ArrowRight,
  Webhook,
  ShoppingCart,
  UserPlus,
  MousePointer,
  Package,
  CreditCard,
  Send,
  Slack,
  Timer
} from 'lucide-react'

// Types
interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition'
  actionType?: string
  config: Record<string, any>
  nextSteps: string[]
  position: { x: number; y: number }
}

interface Automation {
  id?: string
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, any>
  workflowSteps: WorkflowStep[]
  isEnabled: boolean
}

// Trigger definitions
const TRIGGERS = [
  { id: 'form_submit', name: 'Form Submitted', icon: Mail, color: 'bg-blue-500', description: 'When a form is submitted' },
  { id: 'order_created', name: 'New Order', icon: ShoppingCart, color: 'bg-green-500', description: 'When an order is placed' },
  { id: 'user_signup', name: 'User Signup', icon: UserPlus, color: 'bg-purple-500', description: 'When a new user registers' },
  { id: 'schedule', name: 'Schedule', icon: Clock, color: 'bg-orange-500', description: 'Run on a schedule' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, color: 'bg-pink-500', description: 'External webhook trigger' },
  { id: 'page_view', name: 'Page View', icon: Globe, color: 'bg-cyan-500', description: 'When a page is viewed' },
  { id: 'button_click', name: 'Button Click', icon: MousePointer, color: 'bg-indigo-500', description: 'When a button is clicked' },
  { id: 'inventory_low', name: 'Low Inventory', icon: Package, color: 'bg-red-500', description: 'When stock is low' },
  { id: 'payment_received', name: 'Payment Received', icon: CreditCard, color: 'bg-emerald-500', description: 'When payment is received' },
]

// Action definitions with enhanced integrations
const ACTIONS = [
  // Communication
  { id: 'send_email', name: 'Send Email', icon: Mail, color: 'bg-blue-500', description: 'Send an email notification', category: 'communication' },
  { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, color: 'bg-green-500', description: 'Send SMS message', category: 'communication' },
  { id: 'slack_message', name: 'Slack Message', icon: Slack, color: 'bg-pink-500', description: 'Send Slack notification', category: 'communication' },
  
  // Data Operations
  { id: 'create_record', name: 'Create Record', icon: Database, color: 'bg-purple-500', description: 'Create a database record', category: 'data' },
  { id: 'update_record', name: 'Update Record', icon: Database, color: 'bg-indigo-500', description: 'Update existing record', category: 'data' },
  { id: 'delete_record', name: 'Delete Record', icon: Database, color: 'bg-red-500', description: 'Delete a record', category: 'data' },
  
  // Popular Integrations (New)
  { id: 'google_sheets', name: 'Google Sheets', icon: Database, color: 'bg-green-600', description: 'Add/update Google Sheets row', category: 'integrations' },
  { id: 'airtable', name: 'Airtable', icon: Database, color: 'bg-orange-600', description: 'Create/update Airtable record', category: 'integrations' },
  { id: 'notion', name: 'Notion', icon: Database, color: 'bg-gray-800', description: 'Create/update Notion page', category: 'integrations' },
  { id: 'discord', name: 'Discord', icon: MessageSquare, color: 'bg-indigo-600', description: 'Send Discord message', category: 'integrations' },
  { id: 'teams', name: 'Microsoft Teams', icon: MessageSquare, color: 'bg-blue-600', description: 'Send Teams message', category: 'integrations' },
  { id: 'trello', name: 'Trello', icon: Database, color: 'bg-blue-500', description: 'Create/update Trello card', category: 'integrations' },
  
  // Flow Control
  { id: 'delay', name: 'Delay', icon: Timer, color: 'bg-gray-500', description: 'Wait before next step', category: 'flow' },
  { id: 'condition', name: 'Condition', icon: GitBranch, color: 'bg-yellow-500', description: 'Add conditional logic', category: 'flow' },
  { id: 'loop', name: 'Loop', icon: Repeat, color: 'bg-cyan-500', description: 'Repeat actions', category: 'flow' },
  { id: 'parallel', name: 'Parallel', icon: GitBranch, color: 'bg-purple-600', description: 'Run actions in parallel', category: 'flow' },
  { id: 'sub_workflow', name: 'Sub-workflow', icon: Zap, color: 'bg-teal-500', description: 'Execute another workflow', category: 'flow' },
  
  // Utilities
  { id: 'http_request', name: 'HTTP Request', icon: Globe, color: 'bg-orange-500', description: 'Make an API call', category: 'utilities' },
  { id: 'set_variable', name: 'Set Variable', icon: Settings, color: 'bg-gray-600', description: 'Store a value', category: 'utilities' },
  { id: 'transform_data', name: 'Transform Data', icon: Settings, color: 'bg-indigo-500', description: 'Transform data format', category: 'utilities' },
  { id: 'error_handler', name: 'Error Handler', icon: AlertCircle, color: 'bg-red-600', description: 'Handle errors gracefully', category: 'utilities' },
]

interface AutomationBuilderProps {
  appId: string
  automation?: Automation
  onSave: (automation: Automation) => Promise<void>
  onClose: () => void
}

export function AutomationBuilder({ appId, automation, onSave, onClose }: AutomationBuilderProps) {
  const [name, setName] = useState(automation?.name || 'New Automation')
  const [description, setDescription] = useState(automation?.description || '')
  const [triggerType, setTriggerType] = useState(automation?.triggerType || '')
  const [triggerConfig, setTriggerConfig] = useState(automation?.triggerConfig || {})
  const [steps, setSteps] = useState<WorkflowStep[]>(automation?.workflowSteps || [])
  const [isEnabled, setIsEnabled] = useState(automation?.isEnabled ?? true)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [showAddAction, setShowAddAction] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter actions by category
  const filteredActions = selectedCategory === 'all' 
    ? ACTIONS 
    : ACTIONS.filter(action => action.category === selectedCategory)

  // Add a new step
  const addStep = useCallback((actionType: string) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: 'action',
      actionType,
      config: {},
      nextSteps: [],
      position: { x: 0, y: steps.length * 100 }
    }
    setSteps([...steps, newStep])
    setShowAddAction(false)
    setSelectedStep(newStep.id)
  }, [steps])

  // Remove a step
  const removeStep = useCallback((stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId))
    if (selectedStep === stepId) setSelectedStep(null)
  }, [steps, selectedStep])

  // Update step config
  const updateStepConfig = useCallback((stepId: string, config: Record<string, any>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, config: { ...s.config, ...config } } : s))
  }, [steps])

  // Save automation
  const handleSave = async () => {
    if (!triggerType) return
    
    setIsSaving(true)
    try {
      await onSave({
        id: automation?.id,
        name,
        description,
        triggerType,
        triggerConfig,
        workflowSteps: steps,
        isEnabled
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedTrigger = TRIGGERS.find(t => t.id === triggerType)
  const selectedStepData = steps.find(s => s.id === selectedStep)
  const selectedAction = selectedStepData ? ACTIONS.find(a => a.id === selectedStepData.actionType) : null

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ← Back
          </Button>
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="Automation name"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm text-muted-foreground border-0 p-0 h-auto focus-visible:ring-0 mt-1"
              placeholder="Add description..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            {isEnabled ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {isEnabled ? 'Active' : 'Paused'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !triggerType}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workflow Canvas */}
        <div className="flex-1 p-8 overflow-auto bg-muted/30">
          <div className="max-w-xl mx-auto space-y-4">
            {/* Trigger Node */}
            <motion.div
              layout
              className={cn(
                "p-4 rounded-xl border-2 bg-card cursor-pointer transition-all",
                triggerType ? "border-primary" : "border-dashed border-muted-foreground/30"
              )}
              onClick={() => setSelectedStep(null)}
            >
              {triggerType && selectedTrigger ? (
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", selectedTrigger.color)}>
                    <selectedTrigger.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedTrigger.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTrigger.description}</p>
                  </div>
                  <Badge variant="secondary">Trigger</Badge>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium">Select a Trigger</p>
                  <p className="text-sm text-muted-foreground">Choose what starts this automation</p>
                </div>
              )}
            </motion.div>

            {/* Connection Line */}
            {triggerType && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-border" />
              </div>
            )}

            {/* Action Steps */}
            <AnimatePresence>
              {steps.map((step, index) => {
                const action = ACTIONS.find(a => a.id === step.actionType)
                if (!action) return null

                return (
                  <motion.div
                    key={step.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {/* Connection */}
                    {index > 0 && (
                      <div className="flex justify-center mb-4">
                        <div className="w-0.5 h-8 bg-border" />
                      </div>
                    )}

                    {/* Step Node */}
                    <div
                      className={cn(
                        "p-4 rounded-xl border-2 bg-card cursor-pointer transition-all",
                        selectedStep === step.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedStep(step.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", action.color)}>
                          <action.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{action.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {Object.keys(step.config).length > 0 
                              ? `Configured` 
                              : 'Click to configure'}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => removeStep(step.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Connection to next */}
                    <div className="flex justify-center mt-4">
                      <div className="w-0.5 h-8 bg-border" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Add Action Button */}
            {triggerType && (
              <motion.div layout>
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowAddAction(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - Configuration */}
        <div className="w-80 border-l bg-card">
          <ScrollArea className="h-full">
            <div className="p-4">
              {!triggerType ? (
                // Trigger Selection
                <div>
                  <h3 className="font-semibold mb-4">Select Trigger</h3>
                  <div className="space-y-2">
                    {TRIGGERS.map((trigger) => (
                      <button
                        key={trigger.id}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all hover:border-primary",
                          triggerType === trigger.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setTriggerType(trigger.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", trigger.color)}>
                            <trigger.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{trigger.name}</p>
                            <p className="text-xs text-muted-foreground">{trigger.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedStep && selectedStepData && selectedAction ? (
                // Step Configuration
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", selectedAction.color)}>
                      <selectedAction.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold">{selectedAction.name}</h3>
                  </div>
                  
                  <StepConfigForm
                    actionType={selectedStepData.actionType!}
                    config={selectedStepData.config}
                    onChange={(config) => updateStepConfig(selectedStep, config)}
                  />
                </div>
              ) : (
                // Trigger Configuration
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {selectedTrigger && (
                      <>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", selectedTrigger.color)}>
                          <selectedTrigger.icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold">{selectedTrigger.name}</h3>
                      </>
                    )}
                  </div>
                  
                  <TriggerConfigForm
                    triggerType={triggerType}
                    config={triggerConfig}
                    onChange={setTriggerConfig}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setTriggerType('')}
                  >
                    Change Trigger
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Add Action Dialog */}
      <Dialog open={showAddAction} onOpenChange={setShowAddAction}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Action</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Category Tabs */}
            <div className="mb-4">
              <div className="flex gap-2 mb-4">
                {['all', 'communication', 'data', 'integrations', 'flow', 'utilities'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category === 'all' ? 'All Actions' : category}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredActions.map((action) => (
                <button
                  key={action.id}
                  className="p-3 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5"
                  onClick={() => addStep(action.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", action.color)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{action.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                      {action.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {action.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Trigger Configuration Form
function TriggerConfigForm({ 
  triggerType, 
  config, 
  onChange 
}: { 
  triggerType: string
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void 
}) {
  switch (triggerType) {
    case 'schedule':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Frequency</label>
            <Select
              value={config.frequency || 'daily'}
              onValueChange={(v) => onChange({ ...config, frequency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Time</label>
            <Input
              type="time"
              value={config.time || '09:00'}
              onChange={(e) => onChange({ ...config, time: e.target.value })}
            />
          </div>
        </div>
      )
    
    case 'webhook':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Webhook URL</label>
            <div className="flex gap-2">
              <Input
                value={`/api/webhooks/${config.hookId || 'your-hook-id'}`}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Hook ID</label>
            <Input
              value={config.hookId || ''}
              onChange={(e) => onChange({ ...config, hookId: e.target.value })}
              placeholder="my-webhook"
            />
          </div>
        </div>
      )

    case 'form_submit':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Form</label>
            <Select
              value={config.formId || ''}
              onValueChange={(v) => onChange({ ...config, formId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact Form</SelectItem>
                <SelectItem value="newsletter">Newsletter Signup</SelectItem>
                <SelectItem value="feedback">Feedback Form</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    default:
      return (
        <p className="text-sm text-muted-foreground">
          This trigger will fire automatically when the event occurs.
        </p>
      )
  }
}

// Step Configuration Form
function StepConfigForm({ 
  actionType, 
  config, 
  onChange 
}: { 
  actionType: string
  config: Record<string, any>
  onChange: (config: Record<string, any>) => void 
}) {
  switch (actionType) {
    case 'send_email':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Input
              value={config.to || ''}
              onChange={(e) => onChange({ ...config, to: e.target.value })}
              placeholder="{{user.email}}"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              value={config.subject || ''}
              onChange={(e) => onChange({ ...config, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Template</label>
            <Select
              value={config.template || ''}
              onValueChange={(v) => onChange({ ...config, template: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="order_confirm">Order Confirmation</SelectItem>
                <SelectItem value="followup">Follow Up</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'google_sheets':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Spreadsheet ID</label>
            <Input
              value={config.spreadsheet_id || ''}
              onChange={(e) => onChange({ ...config, spreadsheet_id: e.target.value })}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Sheet Name</label>
            <Input
              value={config.sheet_name || ''}
              onChange={(e) => onChange({ ...config, sheet_name: e.target.value })}
              placeholder="Sheet1"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Values</label>
            <Input
              value={config.values || ''}
              onChange={(e) => onChange({ ...config, values: e.target.value })}
              placeholder="{{name}}, {{email}}, {{date}}"
            />
          </div>
        </div>
      )

    case 'airtable':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Base ID</label>
            <Input
              value={config.base_id || ''}
              onChange={(e) => onChange({ ...config, base_id: e.target.value })}
              placeholder="appXXXXXXXXXXXXXX"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Table Name</label>
            <Input
              value={config.table_name || ''}
              onChange={(e) => onChange({ ...config, table_name: e.target.value })}
              placeholder="Contacts"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fields (JSON)</label>
            <Input
              value={config.fields || ''}
              onChange={(e) => onChange({ ...config, fields: e.target.value })}
              placeholder='{"Name": "{{name}}", "Email": "{{email}}"}'
            />
          </div>
        </div>
      )

    case 'notion':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Database ID</label>
            <Input
              value={config.database_id || ''}
              onChange={(e) => onChange({ ...config, database_id: e.target.value })}
              placeholder="32-character database ID"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Page Title</label>
            <Input
              value={config.title || ''}
              onChange={(e) => onChange({ ...config, title: e.target.value })}
              placeholder="{{name}} - {{date}}"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Properties (JSON)</label>
            <Input
              value={config.properties || ''}
              onChange={(e) => onChange({ ...config, properties: e.target.value })}
              placeholder='{"Status": "New", "Email": "{{email}}"}'
            />
          </div>
        </div>
      )

    case 'discord':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Webhook URL</label>
            <Input
              value={config.webhook_url || ''}
              onChange={(e) => onChange({ ...config, webhook_url: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Input
              value={config.message || ''}
              onChange={(e) => onChange({ ...config, message: e.target.value })}
              placeholder="New notification: {{message}}"
            />
          </div>
        </div>
      )

    case 'parallel':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Parallel Branches</label>
            <p className="text-sm text-muted-foreground mb-2">
              This action will execute multiple branches simultaneously
            </p>
            <div className="space-y-2">
              <Input
                value={config.branch_1 || ''}
                onChange={(e) => onChange({ ...config, branch_1: e.target.value })}
                placeholder="Branch 1 actions"
              />
              <Input
                value={config.branch_2 || ''}
                onChange={(e) => onChange({ ...config, branch_2: e.target.value })}
                placeholder="Branch 2 actions"
              />
            </div>
          </div>
        </div>
      )

    case 'error_handler':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Error Action</label>
            <Select
              value={config.error_action || 'retry'}
              onValueChange={(v) => onChange({ ...config, error_action: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retry">Retry</SelectItem>
                <SelectItem value="skip">Skip</SelectItem>
                <SelectItem value="stop">Stop Workflow</SelectItem>
                <SelectItem value="notify">Send Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Max Retries</label>
            <Input
              type="number"
              value={config.max_retries || 3}
              onChange={(e) => onChange({ ...config, max_retries: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>
        </div>
      )

    case 'delay':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Wait for</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={config.value || 5}
                onChange={(e) => onChange({ ...config, value: parseInt(e.target.value) })}
                className="w-20"
              />
              <Select
                value={config.unit || 'minutes'}
                onValueChange={(v) => onChange({ ...config, unit: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )

    case 'http_request':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Method</label>
            <Select
              value={config.method || 'POST'}
              onValueChange={(v) => onChange({ ...config, method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">URL</label>
            <Input
              value={config.url || ''}
              onChange={(e) => onChange({ ...config, url: e.target.value })}
              placeholder="https://api.example.com/webhook"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Headers (JSON)</label>
            <Input
              value={config.headers || ''}
              onChange={(e) => onChange({ ...config, headers: e.target.value })}
              placeholder='{"Authorization": "Bearer {{token}}"}'
            />
          </div>
        </div>
      )

    case 'slack_message':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Channel</label>
            <Input
              value={config.channel || ''}
              onChange={(e) => onChange({ ...config, channel: e.target.value })}
              placeholder="#general"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Input
              value={config.message || ''}
              onChange={(e) => onChange({ ...config, message: e.target.value })}
              placeholder="New order received!"
            />
          </div>
        </div>
      )

    case 'create_record':
    case 'update_record':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Collection</label>
            <Select
              value={config.collection || ''}
              onValueChange={(v) => onChange({ ...config, collection: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Data (JSON)</label>
            <Input
              value={config.data || ''}
              onChange={(e) => onChange({ ...config, data: e.target.value })}
              placeholder='{"name": "{{name}}", "email": "{{email}}"}'
            />
          </div>
        </div>
      )

    default:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure this action's settings.
          </p>
          <div>
            <label className="text-sm font-medium mb-2 block">Configuration (JSON)</label>
            <Input
              value={config.custom_config || ''}
              onChange={(e) => onChange({ ...config, custom_config: e.target.value })}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
      )
  }
}
