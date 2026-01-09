'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AutomationBuilder } from '@/components/automation/automation-builder'
import { useGetAutomationQuery, useUpdateAutomationMutation } from '@/store/api/apiSlice'

interface Automation {
  id?: string
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, any>
  workflowSteps: any[]
  isEnabled: boolean
}

export default function EditAutomationPage() {
  const router = useRouter()
  const params = useParams()
  const automationId = params.id as string
  
  // Get current app ID - for now using a default, should come from context/params
  const currentAppId = 'current-app-id' // TODO: Get from context or URL params
  
  const { data: automationData, isLoading, error } = useGetAutomationQuery({ 
    appId: currentAppId, 
    automationId 
  })
  const [updateAutomation, { isLoading: isUpdating }] = useUpdateAutomationMutation()

  const handleSave = async (updatedAutomation: Automation) => {
    try {
      const body = {
        name: updatedAutomation.name,
        description: updatedAutomation.description,
        trigger_config: updatedAutomation.triggerConfig,
        workflow_steps: updatedAutomation.workflowSteps,
        is_enabled: updatedAutomation.isEnabled
      }
      
      await updateAutomation({ 
        appId: currentAppId, 
        automationId, 
        body 
      }).unwrap()
      
      // Redirect to automations list
      router.push('/dashboard/automations')
    } catch (error) {
      console.error('Failed to update automation:', error)
      // Handle error (show toast, etc.)
    }
  }

  const handleClose = () => {
    router.push('/dashboard/automations')
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !automationData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Automation not found</h2>
          <p className="text-muted-foreground mb-4">
            {(error as any)?.data?.message || "The automation you're looking for doesn't exist."}
          </p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Back to Automations
          </button>
        </div>
      </div>
    )
  }

  // Convert API response to component format
  const automation: Automation = {
    id: automationData.id,
    name: automationData.name,
    description: automationData.description,
    triggerType: automationData.trigger_type,
    triggerConfig: automationData.trigger_config || {},
    workflowSteps: automationData.workflow_steps || [],
    isEnabled: automationData.is_enabled
  }

  return (
    <div className="h-screen">
      <AutomationBuilder
        appId={currentAppId}
        automation={automation}
        onSave={handleSave}
        onClose={handleClose}
        isLoading={isUpdating}
      />
    </div>
  )
}