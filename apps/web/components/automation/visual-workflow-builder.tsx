'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Plus, Trash2, Settings, ChevronRight, Zap, Clock, Mail,
  MessageSquare, Database, Globe, GitBranch, Repeat, Pause, Code,
  Webhook, Bell, ShoppingCart, Users, FileText, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  actionType?: string
  config: Record<string, any>
  position: { x: number; y: number }
  nextNodes: string[]
}

interface VisualWorkflowBuilderProps {
  nodes: WorkflowNode[]
  onChange: (nodes: WorkflowNode[]) => void
  triggerType: string
  onTriggerTypeChange: (type: string) => void
}

const TRIGGER_TYPES = [
  { id: 'form_submit', name: 'Form Submitted', icon: FileText, color: 'bg-blue-500' },
  { id: 'user_signup', name: 'User Signup', icon: Users, color: 'bg-green-500' },
  { id: 'order_created', name: 'Order Created', icon: ShoppingCart, color: 'bg-purple-500' },
  { id: 'webhook', name: 'Webhook Received', icon: Webhook, color: 'bg-orange-500' },
  { id: 'schedule', name: 'Scheduled', icon: Clock, color: 'bg-cyan-500' },
  { id: 'record_created', name: 'Record Created', icon: Database, color: 'bg-indigo-500' },
  { id: 'page_view', name: 'Page Viewed', icon: Globe, color: 'bg-pink-500' },
]

const ACTION_TYPES = [
  { id: 'send_email', name: 'Send Email', icon: Mail, color: 'bg-blue-500', category: 'communication' },
  { id: 'send_sms', name: 'Send SMS', icon: MessageSquare, color: 'bg-green-500', category: 'communication' },
  { id: 'slack_message', name: 'Slack Message', icon: MessageSquare, color: 'bg-purple-500', category: 'communication' },
  { id: 'create_record', name: 'Create Record', icon: Database, color: 'bg-indigo-500', category: 'data' },
  { id: 'update_record', name: 'Update Record', icon: Database, color: 'bg-cyan-500', category: 'data' },
  { id: 'delete_record', name: 'Delete Record', icon: Database, color: 'bg-red-500', category: 'data' },
  { id: 'http_request', name: 'HTTP Request', icon: Globe, color: 'bg-orange-500', category: 'integration' },
  { id: 'delay', name: 'Delay', icon: Clock, color: 'bg-gray-500', category: 'flow' },
  { id: 'condition', name: 'Condition', icon: GitBranch, color: 'bg-yellow-500', category: 'flow' },
  { id: 'loop', name: 'Loop', icon: Repeat, color: 'bg-pink-500', category: 'flow' },
  { id: 'set_variable', name: 'Set Variable', icon: Code, color: 'bg-teal-500', category: 'data' },
  { id: 'notification', name: 'Push Notification', icon: Bell, color: 'bg-rose-500', category: 'communication' },
]

export function VisualWorkflowBuilder({
  nodes,
  onChange,
  triggerType,
  onTriggerTypeChange
}: VisualWorkflowBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showActionPicker, setShowActionPicker] = useState(false)
  const [addAfterNode, setAddAfterNode] = useState<string | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [showNodeConfig, setShowNodeConfig] = useState(false)

  // Initialize with trigger node if empty
  useEffect(() => {
    if (nodes.length === 0) {
      const triggerNode: WorkflowNode = {
        id: 'trigger-1',
        type: 'trigger',
        config: {},
        position: { x: 400, y: 50 },
        nextNodes: []
      }
      onChange([triggerNode])
    }
  }, [])

  const addNode = useCallback((afterNodeId: string, actionType: string) => {
    const actionInfo = ACTION_TYPES.find(a => a.id === actionType)
    const afterNode = nodes.find(n => n.id === afterNodeId)
    
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: actionType === 'condition' ? 'condition' : actionType === 'delay' ? 'delay' : 'action',
      actionType,
      config: {},
      position: {
        x: afterNode ? afterNode.position.x : 400,
        y: afterNode ? afterNode.position.y + 120 : 170
      },
      nextNodes: []
    }

    const updatedNodes = nodes.map(node => {
      if (node.id === afterNodeId) {
        return { ...node, nextNodes: [...node.nextNodes, newNode.id] }
      }
      return node
    })

    onChange([...updatedNodes, newNode])
    setShowActionPicker(false)
    setAddAfterNode(null)
  }, [nodes, onChange])

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId.startsWith('trigger')) return // Can't delete trigger
    
    const nodeToDelete = nodes.find(n => n.id === nodeId)
    if (!nodeToDelete) return

    // Remove node and update connections
    const updatedNodes = nodes
      .filter(n => n.id !== nodeId)
      .map(node => ({
        ...node,
        nextNodes: node.nextNodes.filter(id => id !== nodeId)
      }))

    onChange(updatedNodes)
    setSelectedNode(null)
  }, [nodes, onChange])

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, config: { ...node.config, ...config } }
      }
      return node
    })
    onChange(updatedNodes)
  }, [nodes, onChange])

  const getNodeIcon = (node: WorkflowNode) => {
    if (node.type === 'trigger') {
      const trigger = TRIGGER_TYPES.find(t => t.id === triggerType)
      return trigger?.icon || Zap
    }
    const action = ACTION_TYPES.find(a => a.id === node.actionType)
    return action?.icon || Zap
  }

  const getNodeColor = (node: WorkflowNode) => {
    if (node.type === 'trigger') {
      const trigger = TRIGGER_TYPES.find(t => t.id === triggerType)
      return trigger?.color || 'bg-blue-500'
    }
    const action = ACTION_TYPES.find(a => a.id === node.actionType)
    return action?.color || 'bg-gray-500'
  }

  const getNodeName = (node: WorkflowNode) => {
    if (node.type === 'trigger') {
      const trigger = TRIGGER_TYPES.find(t => t.id === triggerType)
      return trigger?.name || 'Trigger'
    }
    const action = ACTION_TYPES.find(a => a.id === node.actionType)
    return action?.name || 'Action'
  }

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-auto"
        style={{ minHeight: '600px' }}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connection lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {nodes.map(node => 
            node.nextNodes.map(nextId => {
              const nextNode = nodes.find(n => n.id === nextId)
              if (!nextNode) return null
              
              const startX = node.position.x + 100
              const startY = node.position.y + 40
              const endX = nextNode.position.x + 100
              const endY = nextNode.position.y

              return (
                <g key={`${node.id}-${nextId}`}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray={node.type === 'condition' ? '5,5' : undefined}
                  />
                  <circle cx={endX} cy={endY} r="4" fill="#94a3b8" />
                </g>
              )
            })
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const Icon = getNodeIcon(node)
          const color = getNodeColor(node)
          const name = getNodeName(node)

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "absolute w-[200px] cursor-pointer",
                selectedNode === node.id && "ring-2 ring-primary ring-offset-2"
              )}
              style={{ left: node.position.x, top: node.position.y }}
              onClick={() => setSelectedNode(node.id)}
            >
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                    </div>
                  </div>
                  
                  {/* Config preview */}
                  {Object.keys(node.config).length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                      {node.config.to && <p>To: {node.config.to}</p>}
                      {node.config.subject && <p>Subject: {node.config.subject}</p>}
                      {node.config.url && <p>URL: {node.config.url}</p>}
                      {node.config.seconds && <p>Delay: {node.config.seconds}s</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add button */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAddAfterNode(node.id)
                    setShowActionPicker(true)
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Right Panel - Node Configuration */}
      <div className="w-80 border-l bg-white dark:bg-slate-800 p-4 overflow-y-auto">
        {selectedNodeData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{getNodeName(selectedNodeData)}</h3>
              {selectedNodeData.type !== 'trigger' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => deleteNode(selectedNodeData.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Trigger configuration */}
            {selectedNodeData.type === 'trigger' && (
              <div className="space-y-3">
                <Label>Trigger Type</Label>
                <Select value={triggerType} onValueChange={onTriggerTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        <div className="flex items-center gap-2">
                          <trigger.icon className="w-4 h-4" />
                          {trigger.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {triggerType === 'schedule' && (
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input
                      placeholder="0 9 * * *"
                      value={selectedNodeData.config.cron || ''}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, { cron: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">e.g., "0 9 * * *" for daily at 9am</p>
                  </div>
                )}

                {triggerType === 'webhook' && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      readOnly
                      value={`/api/v1/webhooks/app_id/${selectedNodeData.config.hook_id || 'hook_id'}`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Email action configuration */}
            {selectedNodeData.actionType === 'send_email' && (
              <div className="space-y-3">
                <div>
                  <Label>To</Label>
                  <Input
                    placeholder="{{user.email}}"
                    value={selectedNodeData.config.to || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { to: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject"
                    value={selectedNodeData.config.subject || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea
                    placeholder="Email body..."
                    value={selectedNodeData.config.body || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { body: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* HTTP Request configuration */}
            {selectedNodeData.actionType === 'http_request' && (
              <div className="space-y-3">
                <div>
                  <Label>Method</Label>
                  <Select
                    value={selectedNodeData.config.method || 'GET'}
                    onValueChange={(v) => updateNodeConfig(selectedNodeData.id, { method: v })}
                  >
                    <SelectTrigger>
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
                  <Label>URL</Label>
                  <Input
                    placeholder="https://api.example.com/endpoint"
                    value={selectedNodeData.config.url || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Body (JSON)</Label>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={selectedNodeData.config.body || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { body: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Delay configuration */}
            {selectedNodeData.actionType === 'delay' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      min="0"
                      value={selectedNodeData.config.minutes || 0}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, { minutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Seconds</Label>
                    <Input
                      type="number"
                      min="0"
                      value={selectedNodeData.config.seconds || 0}
                      onChange={(e) => updateNodeConfig(selectedNodeData.id, { seconds: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Condition configuration */}
            {selectedNodeData.actionType === 'condition' && (
              <div className="space-y-3">
                <div>
                  <Label>Field</Label>
                  <Input
                    placeholder="user.email"
                    value={selectedNodeData.config.field || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { field: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Operator</Label>
                  <Select
                    value={selectedNodeData.config.operator || 'equals'}
                    onValueChange={(v) => updateNodeConfig(selectedNodeData.id, { operator: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    placeholder="value"
                    value={selectedNodeData.config.value || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { value: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Create/Update Record configuration */}
            {(selectedNodeData.actionType === 'create_record' || selectedNodeData.actionType === 'update_record') && (
              <div className="space-y-3">
                <div>
                  <Label>Collection ID</Label>
                  <Input
                    placeholder="collection-uuid"
                    value={selectedNodeData.config.collection_id || ''}
                    onChange={(e) => updateNodeConfig(selectedNodeData.id, { collection_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data (JSON)</Label>
                  <Textarea
                    placeholder='{"field": "{{trigger.value}}"}'
                    value={selectedNodeData.config.data ? JSON.stringify(selectedNodeData.config.data) : ''}
                    onChange={(e) => {
                      try {
                        const data = JSON.parse(e.target.value)
                        updateNodeConfig(selectedNodeData.id, { data })
                      } catch {}
                    }}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Variable hints */}
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">{'{{trigger.data}}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{{user.email}}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{{user.name}}'}</Badge>
                <Badge variant="secondary" className="text-xs">{'{{now}}'}</Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a node to configure</p>
          </div>
        )}
      </div>

      {/* Action Picker Dialog */}
      <Dialog open={showActionPicker} onOpenChange={setShowActionPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Action</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {ACTION_TYPES.map(action => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto py-3 justify-start"
                onClick={() => addAfterNode && addNode(addAfterNode, action.id)}
              >
                <div className={cn("w-8 h-8 rounded flex items-center justify-center text-white mr-3", action.color)}>
                  <action.icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{action.category}</p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
