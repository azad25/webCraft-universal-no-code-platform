/**
 * Action Service for Widget Events
 * Handles execution of actions triggered by widget events
 */

import { apiClient } from './api-client'

export interface ActionConfig {
  type: 'navigate' | 'create_record' | 'update_record' | 'delete_record' | 'query_data' |
        'send_email' | 'send_sms' | 'api_call' | 'webhook_call' | 'show_message' |
        'update_element' | 'toggle_visibility' | 'open_modal' | 'close_modal' |
        'redirect' | 'delay' | 'condition' | 'loop' | 'trigger_automation' |
        'trigger_app_event' | 'send_app_message' | 'sync_app_data' | 'access_shared_data'
  config: Record<string, any>
  conditions?: Array<{
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
    value: any
  }>
  error_handling?: {
    continue_on_error?: boolean
    retry_count?: number
    fallback_action?: ActionConfig
  }
}

export interface EventHandler {
  event_type: 'click' | 'submit' | 'change' | 'load' | 'scroll' | 'hover' | 'focus' | 'blur' | 'timer' | 'data_change' | 'custom'
  element_selector?: string
  actions: ActionConfig[]
  debounce_ms?: number
  once?: boolean
}

export interface WidgetAction {
  id?: string
  app_id: string
  page_id?: string
  name: string
  description?: string
  event_handlers: EventHandler[]
  is_active: boolean
}

export interface ActionResult {
  success: boolean
  action: string
  error?: string
  data?: any
  [key: string]: any
}

export class ActionService {
  private appId: string
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(appId: string) {
    this.appId = appId
  }

  /**
   * Execute a widget event and trigger associated actions
   */
  async executeWidgetEvent(
    widgetId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    userContext: Record<string, any> = {}
  ): Promise<ActionResult[]> {
    try {
      console.log(`🎯 Executing widget event: ${widgetId} -> ${eventType}`, eventData)

      const response = await apiClient.post(
        `/api/apps/${this.appId}/widgets/${widgetId}/events/${eventType}`,
        eventData
      )

      const results = response.data.results || []
      
      // Process results and handle UI updates
      for (const result of results) {
        await this.handleActionResult(result, widgetId)
      }

      return results
    } catch (error) {
      console.error('Failed to execute widget event:', error)
      return [{
        success: false,
        action: 'widget_event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    }
  }

  /**
   * Handle action result and perform UI updates
   */
  private async handleActionResult(result: ActionResult, widgetId: string): Promise<void> {
    if (!result.success) {
      console.error('Action failed:', result.error)
      return
    }

    switch (result.action) {
      case 'navigate':
        this.handleNavigate(result)
        break
      
      case 'show_message':
        this.handleShowMessage(result)
        break
      
      case 'update_element':
        this.handleUpdateElement(result)
        break
      
      case 'toggle_visibility':
        this.handleToggleVisibility(result)
        break
      
      case 'open_modal':
        this.handleOpenModal(result)
        break
      
      case 'close_modal':
        this.handleCloseModal(result)
        break
      
      case 'redirect':
        this.handleRedirect(result)
        break
      
      default:
        console.log('Action completed:', result.action, result)
    }
  }

  /**
   * Handle navigation action
   */
  private handleNavigate(result: ActionResult): void {
    const url = result.url
    const openInNewTab = result.open_in_new_tab

    if (url) {
      if (openInNewTab) {
        window.open(url, '_blank')
      } else {
        window.location.href = url
      }
    }
  }

  /**
   * Handle show message action
   */
  private handleShowMessage(result: ActionResult): void {
    const message = result.message
    const type = result.type || 'info'
    const duration = result.duration || 5000

    // Create toast notification
    this.showToast(message, type, duration)
  }

  /**
   * Handle update element action
   */
  private handleUpdateElement(result: ActionResult): void {
    const targetElement = result.target_element
    const updates = result.updates

    if (targetElement && updates) {
      const element = document.querySelector(`[data-element-id="${targetElement}"]`)
      if (element) {
        // Apply updates to element
        Object.entries(updates).forEach(([key, value]) => {
          if (key === 'text' || key === 'innerHTML') {
            element.innerHTML = String(value)
          } else if (key === 'style') {
            Object.assign((element as HTMLElement).style, value)
          } else if (key === 'class') {
            element.className = String(value)
          } else {
            element.setAttribute(key, String(value))
          }
        })
      }
    }
  }

  /**
   * Handle toggle visibility action
   */
  private handleToggleVisibility(result: ActionResult): void {
    const targetElement = result.target_element
    const visible = result.visible

    if (targetElement) {
      const element = document.querySelector(`[data-element-id="${targetElement}"]`) as HTMLElement
      if (element) {
        if (visible !== undefined) {
          element.style.display = visible ? '' : 'none'
        } else {
          // Toggle visibility
          element.style.display = element.style.display === 'none' ? '' : 'none'
        }
      }
    }
  }

  /**
   * Handle open modal action
   */
  private handleOpenModal(result: ActionResult): void {
    const modalId = result.modal_id
    const content = result.content

    // Emit event for modal system to handle
    this.emit('modal:open', { modalId, content })
  }

  /**
   * Handle close modal action
   */
  private handleCloseModal(result: ActionResult): void {
    const modalId = result.modal_id

    // Emit event for modal system to handle
    this.emit('modal:close', { modalId })
  }

  /**
   * Handle redirect action
   */
  private handleRedirect(result: ActionResult): void {
    const url = result.url
    const delay = result.delay || 0

    if (url) {
      if (delay > 0) {
        setTimeout(() => {
          window.location.href = url
        }, delay * 1000)
      } else {
        window.location.href = url
      }
    }
  }

  /**
   * Show toast notification
   */
  private showToast(message: string, type: string, duration: number): void {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-blue-500 text-white'
    }`
    toast.innerHTML = `
      <div class="flex items-center justify-between">
        <span>${message}</span>
        <button class="ml-4 text-current opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
    `

    document.body.appendChild(toast)

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove()
      }
    }, duration)
  }

  /**
   * Create action configuration
   */
  async createAction(action: WidgetAction): Promise<string> {
    try {
      const response = await apiClient.post(`/api/apps/${this.appId}/actions`, action)
      return response.data.id
    } catch (error) {
      console.error('Failed to create action:', error)
      throw error
    }
  }

  /**
   * Update action configuration
   */
  async updateAction(actionId: string, updates: Partial<WidgetAction>): Promise<void> {
    try {
      await apiClient.put(`/api/apps/${this.appId}/actions/${actionId}`, updates)
    } catch (error) {
      console.error('Failed to update action:', error)
      throw error
    }
  }

  /**
   * Delete action
   */
  async deleteAction(actionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/apps/${this.appId}/actions/${actionId}`)
    } catch (error) {
      console.error('Failed to delete action:', error)
      throw error
    }
  }

  /**
   * Get actions for a widget
   */
  async getWidgetActions(widgetId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/api/apps/${this.appId}/widgets/${widgetId}/actions`)
      return response.data.actions || []
    } catch (error) {
      console.error('Failed to get widget actions:', error)
      return []
    }
  }

  /**
   * Get action templates
   */
  async getActionTemplates(category?: string): Promise<Record<string, any>> {
    try {
      const response = await apiClient.get('/api/action-templates', {
        params: category ? { category } : {}
      })
      return response.data.templates || {}
    } catch (error) {
      console.error('Failed to get action templates:', error)
      return {}
    }
  }

  /**
   * Create action from template
   */
  async createActionFromTemplate(
    templateId: string,
    pageId?: string,
    customizations: Record<string, any> = {}
  ): Promise<string> {
    try {
      const response = await apiClient.post(
        `/api/apps/${this.appId}/actions/from-template`,
        customizations,
        {
          params: {
            template_id: templateId,
            page_id: pageId
          }
        }
      )
      return response.data.id
    } catch (error) {
      console.error('Failed to create action from template:', error)
      throw error
    }
  }

  /**
   * Event system for internal communication
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
}

// Global action service instance
let globalActionService: ActionService | null = null

export function getActionService(appId?: string): ActionService {
  if (!globalActionService && appId) {
    globalActionService = new ActionService(appId)
  }
  return globalActionService!
}

export function setActionService(service: ActionService): void {
  globalActionService = service
}

// Helper functions for common actions
export const ActionHelpers = {
  /**
   * Create a simple navigation action
   */
  createNavigationAction(url: string, openInNewTab = false): ActionConfig {
    return {
      type: 'navigate',
      config: {
        url,
        open_in_new_tab: openInNewTab
      }
    }
  },

  /**
   * Create a record creation action
   */
  createRecordAction(collectionId: string, data: Record<string, any>): ActionConfig {
    return {
      type: 'create_record',
      config: {
        collection_id: collectionId,
        data
      }
    }
  },

  /**
   * Create an email sending action
   */
  createEmailAction(to: string, subject: string, body: string): ActionConfig {
    return {
      type: 'send_email',
      config: {
        to,
        subject,
        body
      }
    }
  },

  /**
   * Create a message display action
   */
  createMessageAction(message: string, type = 'info', duration = 5000): ActionConfig {
    return {
      type: 'show_message',
      config: {
        message,
        type,
        duration
      }
    }
  },

  /**
   * Create an API call action
   */
  createApiCallAction(
    url: string,
    method = 'POST',
    headers: Record<string, string> = {},
    body: Record<string, any> = {}
  ): ActionConfig {
    return {
      type: 'api_call',
      config: {
        url,
        method,
        headers,
        body
      }
    }
  },

  /**
   * Create a cross-app event trigger action
   */
  createTriggerAppEventAction(
    targetAppId: string,
    eventType: string,
    eventData: Record<string, any> = {}
  ): ActionConfig {
    return {
      type: 'trigger_app_event',
      config: {
        target_app_id: targetAppId,
        event_type: eventType,
        event_data: eventData
      }
    }
  },

  /**
   * Create a cross-app message action
   */
  createSendAppMessageAction(
    toAppId: string,
    messageType: string,
    subject: string,
    payload: Record<string, any> = {}
  ): ActionConfig {
    return {
      type: 'send_app_message',
      config: {
        to_app_id: toAppId,
        message_type: messageType,
        subject,
        payload
      }
    }
  },

  /**
   * Create a data sync action
   */
  createSyncAppDataAction(syncJobId: string): ActionConfig {
    return {
      type: 'sync_app_data',
      config: {
        sync_job_id: syncJobId
      }
    }
  },

  /**
   * Create an access shared data action
   */
  createAccessSharedDataAction(
    collectionId: string,
    filters: Record<string, any> = {},
    limit = 50
  ): ActionConfig {
    return {
      type: 'access_shared_data',
      config: {
        collection_id: collectionId,
        filters,
        limit
      }
    }
  }
}