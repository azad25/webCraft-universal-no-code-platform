'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  MoreHorizontal,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useGetAppsQuery, useGetAutomationsQuery, useDeleteAutomationMutation, useEnableAutomationMutation, useDisableAutomationMutation } from '@/store/api/apiSlice'

interface Automation {
  id: string
  app_id: string
  name: string
  description?: string
  trigger_type: string
  is_enabled: boolean
  last_executed_at?: string
  execution_count: number
  created_at: string
}

export default function AutomationsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppId, setSelectedAppId] = useState<string>('all')
  
  // Get apps for the dropdown
  const { data: appsData } = useGetAppsQuery({ page: 1, perPage: 100 })
  const apps = appsData?.apps || []
  
  // Get automations for the selected app
  const { data: automationsData, isLoading, error } = useGetAutomationsQuery(
    { appId: selectedAppId },
    { skip: selectedAppId === 'all' }
  )
  const [deleteAutomation] = useDeleteAutomationMutation()
  const [enableAutomation] = useEnableAutomationMutation()
  const [disableAutomation] = useDisableAutomationMutation()

  const automations = automationsData?.automations || []

  const filteredAutomations = automations.filter((automation: Automation) =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    automation.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleAutomation = async (automation: Automation) => {
    try {
      if (automation.is_enabled) {
        await disableAutomation({ appId: automation.app_id, automationId: automation.id }).unwrap()
      } else {
        await enableAutomation({ appId: automation.app_id, automationId: automation.id }).unwrap()
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  const handleDeleteAutomation = async (automation: Automation) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      try {
        await deleteAutomation({ appId: automation.app_id, automationId: automation.id }).unwrap()
      } catch (error) {
        console.error('Failed to delete automation:', error)
      }
    }
  }

  const handleCreateNew = () => {
    if (selectedAppId === 'all') {
      alert('Please select an app first')
      return
    }
    router.push(`/dashboard/apps/${selectedAppId}/automations/new`)
  }

  const handleEditAutomation = (automation: Automation) => {
    router.push(`/dashboard/apps/${automation.app_id}/automations/${automation.id}`)
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'user_signup': return '👤'
      case 'order_created': return '🛒'
      case 'form_submit': return '📝'
      case 'schedule': return '⏰'
      case 'webhook': return '🔗'
      default: return '⚡'
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'user_signup': return 'User Signup'
      case 'order_created': return 'New Order'
      case 'form_submit': return 'Form Submit'
      case 'schedule': return 'Schedule'
      case 'webhook': return 'Webhook'
      default: return triggerType
    }
  }

  const getStatusIcon = (automation: Automation) => {
    if (!automation.is_enabled) {
      return <Pause className="w-4 h-4 text-muted-foreground" />
    }
    if (automation.execution_count > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    return <Clock className="w-4 h-4 text-blue-500" />
  }

  const getAppName = (appId: string) => {
    const app = apps.find(a => a.id === appId)
    return app?.name || 'Unknown App'
  }

  if (selectedAppId !== 'all' && error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to load automations</h3>
            <p className="text-muted-foreground mb-4">
              {(error as any)?.data?.message || 'An error occurred while loading automations'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Automate your workflows with triggers and actions
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* App Selection and Search */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedAppId} onValueChange={setSelectedAppId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an app" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              {apps.map((app: any) => (
                <SelectItem key={app.id} value={app.id}>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {app.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {selectedAppId === 'all' ? (
        // Show app selection prompt
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Select an App</h3>
            <p className="text-muted-foreground mb-4">
              Choose an app from the dropdown above to view and manage its automations
            </p>
            {apps.length === 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any apps yet. Create an app first to start building automations.
                </p>
                <Button onClick={() => router.push('/dashboard/apps/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create App
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{automations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {automations.filter((a: Automation) => a.is_enabled).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {automations.reduce((sum: number, a: Automation) => sum + a.execution_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
              </CardContent>
            </Card>
          </div>

          {/* Automations List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredAutomations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No automations found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : `Create your first automation for ${getAppName(selectedAppId)}`}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreateNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Automation
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredAutomations.map((automation: Automation) => (
                <Card key={automation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getTriggerIcon(automation.trigger_type)}</div>
                        <div>
                          <CardTitle className="text-lg">{automation.name}</CardTitle>
                          <CardDescription>
                            {automation.description}
                            <span className="ml-2 text-xs">
                              • {getAppName(automation.app_id)}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(automation)}
                        <Badge variant={automation.is_enabled ? 'default' : 'secondary'}>
                          {automation.is_enabled ? 'Active' : 'Paused'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAutomation(automation)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAutomation(automation)}>
                              {automation.is_enabled ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteAutomation(automation)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Trigger: {getTriggerLabel(automation.trigger_type)}</span>
                        <span>Executions: {automation.execution_count}</span>
                        {automation.last_executed_at && (
                          <span>
                            Last run: {new Date(automation.last_executed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <span>
                        Created: {new Date(automation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}