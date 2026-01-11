'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Zap,
  Plus,
  Search,
  Play,
  Pause,
  MoreHorizontal,
  Trash2,
  Copy,
  History,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ShoppingCart,
  UserPlus,
  Webhook,
  Globe,
  MousePointer,
  Package,
  CreditCard
} from 'lucide-react'

interface Automation {
  id: string
  name: string
  description?: string
  triggerType: string
  isEnabled: boolean
  lastExecutedAt?: string
  executionCount: number
  createdAt: string
}

const TRIGGER_ICONS: Record<string, any> = {
  form_submit: Mail,
  order_created: ShoppingCart,
  user_signup: UserPlus,
  schedule: Clock,
  webhook: Webhook,
  page_view: Globe,
  button_click: MousePointer,
  inventory_low: Package,
  payment_received: CreditCard,
}

const TRIGGER_COLORS: Record<string, string> = {
  form_submit: 'bg-blue-500',
  order_created: 'bg-green-500',
  user_signup: 'bg-purple-500',
  schedule: 'bg-orange-500',
  webhook: 'bg-pink-500',
  page_view: 'bg-cyan-500',
  button_click: 'bg-indigo-500',
  inventory_low: 'bg-red-500',
  payment_received: 'bg-emerald-500',
}

interface AutomationListProps {
  appId: string
  automations: Automation[]
  onCreateNew: () => void
  onEdit: (automation: Automation) => void
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onViewLogs: (id: string) => void
}

export function AutomationList({
  appId,
  automations,
  onCreateNew,
  onEdit,
  onToggle,
  onDelete,
  onDuplicate,
  onViewLogs
}: AutomationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')

  const filteredAutomations = automations.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && a.isEnabled) || 
      (filter === 'paused' && !a.isEnabled)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automations</h2>
          <p className="text-muted-foreground">
            Create workflows to automate tasks and processes
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Automation Cards */}
      {filteredAutomations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create your first automation to start automating tasks and workflows
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAutomations.map((automation) => {
              const TriggerIcon = TRIGGER_ICONS[automation.triggerType] || Zap
              const triggerColor = TRIGGER_COLORS[automation.triggerType] || 'bg-gray-500'

              return (
                <m.div
                  key={automation.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      !automation.isEnabled && "opacity-60"
                    )}
                    onClick={() => onEdit(automation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Trigger Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                          triggerColor
                        )}>
                          <TriggerIcon className="w-6 h-6" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{automation.name}</h3>
                            <Badge variant={automation.isEnabled ? 'default' : 'secondary'}>
                              {automation.isEnabled ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {automation.description || `Triggered by ${automation.triggerType.replace('_', ' ')}`}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="text-center">
                            <p className="font-semibold text-foreground">{automation.executionCount}</p>
                            <p className="text-xs">Runs</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-foreground">
                              {automation.lastExecutedAt 
                                ? new Date(automation.lastExecutedAt).toLocaleDateString()
                                : 'Never'}
                            </p>
                            <p className="text-xs">Last Run</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggle(automation.id, !automation.isEnabled)
                            }}
                          >
                            {automation.isEnabled ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEdit(automation)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewLogs(automation.id)}>
                                <History className="w-4 h-4 mr-2" />
                                View Logs
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDuplicate(automation.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDelete(automation.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
