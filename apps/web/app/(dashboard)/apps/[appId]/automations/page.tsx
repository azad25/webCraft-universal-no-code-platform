'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AutomationList } from '@/components/automation/automation-list'
import { AutomationBuilder } from '@/components/automation/automation-builder'
import { AutomationLogs } from '@/components/automation/automation-logs'
import { useGetAutomationsQuery, useCreateAutomationMutation, useUpdateAutomationMutation, useDeleteAutomationMutation, useEnableAutomationMutation, useDisableAutomationMutation, useGetAutomationLogsQuery } from '@/store/api/apiSlice'

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
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)

  // RTK Query hooks
  const { data: automationsData, isLoading } = useGetAutomationsQuery({ appId })
  const { data: logsData } = useGetAutomationLogsQuery(
    { appId, automationId: selectedAutomation?.id || '' },
    { skip: !selectedAutomation?.id || view !== 'logs' }
  )
  const [createAutomation] = useCreateAutomationMutation()
  const [updateAutomation] = useUpdateAutomationMutation()
  const [deleteAutomation] = useDeleteAutomationMutation()
  const [enableAutomation] = useEnableAutomationMutation()
  const [disableAutomation] = useDisableAutomationMutation()

  const automations = automationsData?.automations || []
  const logs = logsData?.logs || []

  const handleCreateNew = () => {
    setSelectedAutomation(null)
    setView('builder')
  }

  const handleEdit = (automation: any) => {
    // Convert API format to component format
    const convertedAutomation: Automation = {
      id: automation.id,
      name: automation.name,
      description: automation.description,
      triggerType: automation.trigger_type,
      triggerConfig: automation.trigger_config || {},
      workflowSteps: automation.workflow_steps || [],
      isEnabled: automation.is_enabled,
      lastExecutedAt: automation.last_executed_at,
      executionCount: automation.execution_count,
      createdAt: automation.created_at
    }
    setSelectedAutomation(convertedAutomation)
    setView('builder')
  }

  const handleSave = async (automation: Automation) => {
    try {
      const body = {
        name: automation.name,
        description: automation.description,
        trigger_type: automation.triggerType,
        trigger_config: automation.triggerConfig,
        workflow_steps: automation.workflowSteps,
        is_enabled: automation.isEnabled
      }

      if (automation.id) {
        await updateAutomation({ appId, automationId: automation.id, body }).unwrap()
      } else {
        await createAutomation({ appId, body }).unwrap()
      }
      
      setView('list')
    } catch (error) {
      console.error('Failed to save automation:', error)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      if (enabled) {
        await enableAutomation({ appId, automationId: id }).unwrap()
      } else {
        await disableAutomation({ appId, automationId: id }).unwrap()
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    
    try {
      await deleteAutomation({ appId, automationId: id }).unwrap()
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  }

  const handleDuplicate = async (id: string) => {
    const automation = automations.find((a: any) => a.id === id)
    if (!automation) return

    try {
      const body = {
        name: `${automation.name} (copy)`,
        description: automation.description,
        trigger_type: automation.trigger_type,
        trigger_config: automation.trigger_config || {},
        workflow_steps: automation.workflow_steps || [],
        is_enabled: false
      }
      await createAutomation({ appId, body }).unwrap()
    } catch (error) {
      console.error('Failed to duplicate automation:', error)
    }
  }

  const handleViewLogs = (id: string) => {
    const automation = automations.find((a: any) => a.id === id)
    if (!automation) return
    
    const convertedAutomation: Automation = {
      id: automation.id,
      name: automation.name,
      description: automation.description,
      triggerType: automation.trigger_type,
      triggerConfig: automation.trigger_config || {},
      workflowSteps: automation.workflow_steps || [],
      isEnabled: automation.is_enabled,
      lastExecutedAt: automation.last_executed_at,
      executionCount: automation.execution_count,
      createdAt: automation.created_at
    }
    
    setSelectedAutomation(convertedAutomation)
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
          automation={selectedAutomation}
          onSave={handleSave}
          onClose={() => setView('list')}
        />
      )}

      {view === 'logs' && selectedAutomation && (
        <AutomationLogs
          automationId={selectedAutomation.id}
          automationName={selectedAutomation.name}
          logs={logs}
          onRefresh={() => {
            // Logs will automatically refresh due to RTK Query
          }}
          onClose={() => setView('list')}
        />
      )}
    </div>
  )
}
