'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AutomationBuilder } from '@/components/automation/automation-builder'
import { useCreateAutomationMutation } from '@/store/api/apiSlice'

interface Automation {
  id?: string
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, any>
  workflowSteps: any[]
  isEnabled: boolean
}

export default function NewAutomationPage() {
  const router = useRouter()
  const [createAutomation, { isLoading }] = useCreateAutomationMutation()
  
  // Get current app ID - for now using a default, should come from context/params
  const currentAppId = 'current-app-id' // TODO: Get from context or URL params

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
      
      await createAutomation({ appId: currentAppId, body }).unwrap()
      
      // Redirect to automations list
      router.push('/dashboard/automations')
    } catch (error) {
      console.error('Failed to save automation:', error)
      // Handle error (show toast, etc.)
    }
  }

  const handleClose = () => {
    router.push('/dashboard/automations')
  }

  return (
    <div className="h-screen">
      <AutomationBuilder
        appId={currentAppId}
        onSave={handleSave}
        onClose={handleClose}
        isLoading={isLoading}
      />
    </div>
  )
}