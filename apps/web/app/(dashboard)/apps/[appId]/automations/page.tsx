'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AutomationList } from '@/components/automation/automation-list'
import { AutomationBuilder } from '@/components/automation/automation-builder'
import { AutomationLogs } from '@/components/automation/automation-logs'

interface Automation {
  id: string
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, any>
  workflowSteps: any[]
  isEnabled: boolean
  lastExecutedAt?: string
  executionCount: number
  createdAt: string
}

type View = 'list' | 'builder' | 'logs'

export default function AutomationsPage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [view, setView] = useState<View>('list')
  const [automations, setAutomations] = useState<Automation[]>([])
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch automations
  useEffect(() => {
    fetchAutomations()
  }, [appId])

  const fetchAutomations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/apps/${appId}/automations`)
      const data = await response.json()
      setAutomations(data.automations || [])
    } catch (error) {
      console.error('Failed to fetch automations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLogs = async (automationId: string) => {
    try {
      const response = await fetch(`/api/v1/apps/${appId}/automations/${automationId}/logs`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const handleCreateNew = () => {
    setSelectedAutomation(null)
    setView('builder')
  }

  const handleEdit = (automation: Automation) => {
    setSelectedAutomation(automation)
    setView('builder')
  }

  const handleSave = async (automation: any) => {
    try {
      const url = automation.id 
        ? `/api/v1/apps/${appId}/automations/${automation.id}`
        : `/api/v1/apps/${appId}/automations`
      
      const response = await fetch(url, {
        method: automation.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: automation.name,
          description: automation.description,
          trigger_type: automation.triggerType,
          trigger_config: automation.triggerConfig,
          workflow_steps: automation.workflowSteps,
          is_enabled: automation.isEnabled
        })
      })

      if (response.ok) {
        await fetchAutomations()
        setView('list')
      }
    } catch (error) {
      console.error('Failed to save automation:', error)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'enable' : 'disable'
      await fetch(`/api/v1/apps/${appId}/automations/${id}/${endpoint}`, {
        method: 'POST'
      })
      await fetchAutomations()
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    
    try {
      await fetch(`/api/v1/apps/${appId}/automations/${id}`, {
        method: 'DELETE'
      })
      await fetchAutomations()
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  }

  const handleDuplicate = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (!automation) return

    try {
      await fetch(`/api/v1/apps/${appId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${automation.name} (copy)`,
          description: automation.description,
          trigger_type: automation.triggerType,
          trigger_config: automation.triggerConfig,
          workflow_steps: automation.workflowSteps,
          is_enabled: false
        })
      })
      await fetchAutomations()
    } catch (error) {
      console.error('Failed to duplicate automation:', error)
    }
  }

  const handleViewLogs = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (!automation) return
    
    setSelectedAutomation(automation)
    await fetchLogs(id)
    setView('logs')
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading automations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {view === 'list' && (
        <div className="p-6">
          <AutomationList
            appId={appId}
            automations={automations}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onViewLogs={handleViewLogs}
          />
        </div>
      )}

      {view === 'builder' && (
        <AutomationBuilder
          appId={appId}
          automation={selectedAutomation ? {
            id: selectedAutomation.id,
            name: selectedAutomation.name,
            description: selectedAutomation.description,
            triggerType: selectedAutomation.triggerType,
            triggerConfig: selectedAutomation.triggerConfig,
            workflowSteps: selectedAutomation.workflowSteps,
            isEnabled: selectedAutomation.isEnabled
          } : undefined}
          onSave={handleSave}
          onClose={() => setView('list')}
        />
      )}

      {view === 'logs' && selectedAutomation && (
        <AutomationLogs
          automationId={selectedAutomation.id}
          automationName={selectedAutomation.name}
          logs={logs}
          onRefresh={() => fetchLogs(selectedAutomation.id)}
          onClose={() => setView('list')}
        />
      )}
    </div>
  )
}
