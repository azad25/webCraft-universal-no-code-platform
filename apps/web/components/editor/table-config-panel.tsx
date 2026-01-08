'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Database,
  Settings,
  Eye,
  EyeOff,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Link,
  Image,
  Zap,
  X,
  Check
} from 'lucide-react'

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
  onClick: string
  confirmation?: string
  condition?: string
}

interface TableConfigPanelProps {
  isOpen: boolean
  onClose: () => void
  columns: TableColumn[]
  actions: TableAction[]
  onColumnsChange: (columns: TableColumn[]) => void
  onActionsChange: (actions: TableAction[]) => void
  dataSourceId?: string
  onDataSourceChange?: (sourceId: string, endpointId?: string) => void
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'badge', label: 'Badge', icon: Badge },
  { value: 'link', label: 'Link', icon: Link },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'actions', label: 'Actions', icon: Zap }
]

const ACTION_ICONS = [
  'eye', 'edit', 'trash2', 'copy', 'download', 'external-link', 'settings', 'plus', 'minus'
]

const ACTION_VARIANTS = [
  { value: 'default', label: 'Default' },
  { value: 'destructive', label: 'Destructive' },
  { value: 'outline', label: 'Outline' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'link', label: 'Link' }
]

export function TableConfigPanel({
  isOpen,
  onClose,
  columns,
  actions,
  onColumnsChange,
  onActionsChange,
  dataSourceId,
  onDataSourceChange
}: TableConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'columns' | 'actions' | 'data'>('columns')
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null)
  const [editingAction, setEditingAction] = useState<TableAction | null>(null)
  const [showColumnDialog, setShowColumnDialog] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)

  // Add new column
  const handleAddColumn = useCallback(() => {
    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      key: `column_${columns.length + 1}`,
      label: `Column ${columns.length + 1}`,
      type: 'text',
      sortable: true,
      filterable: true,
      visible: true,
      align: 'left'
    }
    setEditingColumn(newColumn)
    setShowColumnDialog(true)
  }, [columns.length])

  // Edit column
  const handleEditColumn = useCallback((column: TableColumn) => {
    setEditingColumn({ ...column })
    setShowColumnDialog(true)
  }, [])

  // Save column
  const handleSaveColumn = useCallback(() => {
    if (!editingColumn) return

    const updatedColumns = columns.find(col => col.id === editingColumn.id)
      ? columns.map(col => col.id === editingColumn.id ? editingColumn : col)
      : [...columns, editingColumn]

    onColumnsChange(updatedColumns)
    setEditingColumn(null)
    setShowColumnDialog(false)
  }, [editingColumn, columns, onColumnsChange])

  // Delete column
  const handleDeleteColumn = useCallback((columnId: string) => {
    onColumnsChange(columns.filter(col => col.id !== columnId))
  }, [columns, onColumnsChange])

  // Toggle column visibility
  const handleToggleColumnVisibility = useCallback((columnId: string) => {
    onColumnsChange(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ))
  }, [columns, onColumnsChange])

  // Add new action
  const handleAddAction = useCallback(() => {
    const newAction: TableAction = {
      id: `action-${Date.now()}`,
      label: 'New Action',
      icon: 'eye',
      variant: 'ghost',
      onClick: 'console.log("Action clicked", row)'
    }
    setEditingAction(newAction)
    setShowActionDialog(true)
  }, [])

  // Edit action
  const handleEditAction = useCallback((action: TableAction) => {
    setEditingAction({ ...action })
    setShowActionDialog(true)
  }, [])

  // Save action
  const handleSaveAction = useCallback(() => {
    if (!editingAction) return

    const updatedActions = actions.find(act => act.id === editingAction.id)
      ? actions.map(act => act.id === editingAction.id ? editingAction : act)
      : [...actions, editingAction]

    onActionsChange(updatedActions)
    setEditingAction(null)
    setShowActionDialog(false)
  }, [editingAction, actions, onActionsChange])

  // Delete action
  const handleDeleteAction = useCallback((actionId: string) => {
    onActionsChange(actions.filter(act => act.id !== actionId))
  }, [actions, onActionsChange])

  const renderColumnsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Table Columns</h3>
        <Button size="sm" onClick={handleAddColumn}>
          <Plus className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </div>

      <div className="space-y-2">
        {columns.map((column, index) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 border rounded-lg"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{column.label}</span>
                <Badge variant="outline" className="text-xs">
                  {column.type}
                </Badge>
                {!column.visible && (
                  <Badge variant="secondary" className="text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Key: {column.key} • {column.align} aligned
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleColumnVisibility(column.id)}
                className="h-7 w-7 p-0"
              >
                {column.visible ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditColumn(column)}
                className="h-7 w-7 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteColumn(column.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {columns.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No columns configured</p>
          <p className="text-xs mt-1">Add columns to display data</p>
        </div>
      )}
    </div>
  )

  const renderActionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Row Actions</h3>
        <Button size="sm" onClick={handleAddAction}>
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </div>

      <div className="space-y-2">
        {actions.map((action) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{action.label}</span>
                <Badge variant="outline" className="text-xs">
                  {action.variant}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Icon: {action.icon} • Click: {action.onClick.substring(0, 30)}...
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditAction(action)}
                className="h-7 w-7 p-0"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAction(action.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {actions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No actions configured</p>
          <p className="text-xs mt-1">Add actions for row interactions</p>
        </div>
      )}
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Data Source</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Connect your table to external data sources for dynamic content.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Data Source</Label>
          <Select
            value={dataSourceId || 'none'}
            onValueChange={(value) => onDataSourceChange?.(value === 'none' ? '' : value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Static Data</SelectItem>
              <SelectItem value="api-1">User API</SelectItem>
              <SelectItem value="api-2">Products API</SelectItem>
              <SelectItem value="scraper-1">Web Scraper</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dataSourceId && (
          <>
            <div>
              <Label>Endpoint</Label>
              <Select defaultValue="users">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Get Users</SelectItem>
                  <SelectItem value="products">Get Products</SelectItem>
                  <SelectItem value="orders">Get Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="auto-refresh" />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>

            <div>
              <Label>Refresh Interval (seconds)</Label>
              <Input
                type="number"
                defaultValue="30"
                min="10"
                max="3600"
                className="mt-1"
              />
            </div>
          </>
        )}

        <Separator />

        <div>
          <Label>Data Preview</Label>
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <pre className="text-xs text-muted-foreground">
{`{
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "created_at": "2024-01-15"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Table Configuration</DialogTitle>
            <DialogDescription>
              Configure columns, actions, and data sources for your table.
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-[60vh]">
            {/* Sidebar */}
            <div className="w-48 border-r pr-4">
              <div className="space-y-1">
                {[
                  { id: 'columns', label: 'Columns', icon: Database },
                  { id: 'actions', label: 'Actions', icon: Zap },
                  { id: 'data', label: 'Data Source', icon: Settings }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pl-4 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'columns' && renderColumnsTab()}
                  {activeTab === 'actions' && renderActionsTab()}
                  {activeTab === 'data' && renderDataTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Edit Dialog */}
      <Dialog open={showColumnDialog} onOpenChange={setShowColumnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColumn?.id.startsWith('col-') ? 'Add Column' : 'Edit Column'}
            </DialogTitle>
          </DialogHeader>

          {editingColumn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={editingColumn.label}
                    onChange={(e) => setEditingColumn(prev => prev ? {
                      ...prev,
                      label: e.target.value
                    } : null)}
                    placeholder="Column Label"
                  />
                </div>
                <div>
                  <Label>Key</Label>
                  <Input
                    value={editingColumn.key}
                    onChange={(e) => setEditingColumn(prev => prev ? {
                      ...prev,
                      key: e.target.value
                    } : null)}
                    placeholder="column_key"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editingColumn.type}
                    onValueChange={(value: any) => setEditingColumn(prev => prev ? {
                      ...prev,
                      type: value
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={editingColumn.align || 'left'}
                    onValueChange={(value: any) => setEditingColumn(prev => prev ? {
                      ...prev,
                      align: value
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Width (optional)</Label>
                <Input
                  value={editingColumn.width || ''}
                  onChange={(e) => setEditingColumn(prev => prev ? {
                    ...prev,
                    width: e.target.value
                  } : null)}
                  placeholder="e.g., 200px, 20%, auto"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingColumn.visible}
                    onCheckedChange={(checked) => setEditingColumn(prev => prev ? {
                      ...prev,
                      visible: checked
                    } : null)}
                  />
                  <Label>Visible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingColumn.sortable}
                    onCheckedChange={(checked) => setEditingColumn(prev => prev ? {
                      ...prev,
                      sortable: checked
                    } : null)}
                  />
                  <Label>Sortable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingColumn.filterable}
                    onCheckedChange={(checked) => setEditingColumn(prev => prev ? {
                      ...prev,
                      filterable: checked
                    } : null)}
                  />
                  <Label>Filterable</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowColumnDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveColumn}>
              <Check className="w-4 h-4 mr-2" />
              Save Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Edit Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAction?.id.startsWith('action-') ? 'Add Action' : 'Edit Action'}
            </DialogTitle>
          </DialogHeader>

          {editingAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={editingAction.label}
                    onChange={(e) => setEditingAction(prev => prev ? {
                      ...prev,
                      label: e.target.value
                    } : null)}
                    placeholder="Action Label"
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={editingAction.icon}
                    onValueChange={(value) => setEditingAction(prev => prev ? {
                      ...prev,
                      icon: value
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_ICONS.map(icon => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Variant</Label>
                <Select
                  value={editingAction.variant}
                  onValueChange={(value: any) => setEditingAction(prev => prev ? {
                    ...prev,
                    variant: value
                  } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_VARIANTS.map(variant => (
                      <SelectItem key={variant.value} value={variant.value}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Click Handler</Label>
                <Textarea
                  value={editingAction.onClick}
                  onChange={(e) => setEditingAction(prev => prev ? {
                    ...prev,
                    onClick: e.target.value
                  } : null)}
                  placeholder="JavaScript code or API endpoint"
                  rows={3}
                />
              </div>

              <div>
                <Label>Confirmation Message (optional)</Label>
                <Input
                  value={editingAction.confirmation || ''}
                  onChange={(e) => setEditingAction(prev => prev ? {
                    ...prev,
                    confirmation: e.target.value
                  } : null)}
                  placeholder="Are you sure?"
                />
              </div>

              <div>
                <Label>Condition (optional)</Label>
                <Input
                  value={editingAction.condition || ''}
                  onChange={(e) => setEditingAction(prev => prev ? {
                    ...prev,
                    condition: e.target.value
                  } : null)}
                  placeholder="row.status === 'active'"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAction}>
              <Check className="w-4 h-4 mr-2" />
              Save Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}