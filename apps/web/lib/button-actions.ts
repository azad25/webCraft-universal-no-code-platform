/**
 * Comprehensive button action system for WebCraft
 * Supports navigation, media, data processing, and custom actions
 */

import { fetchDataSourceData } from './data-source-api'

export interface ButtonAction {
  type: 'navigate' | 'download' | 'email' | 'phone' | 'data-action' | 'media' | 'custom' | 'page' | 'modal'
  target?: string
  
  // Page navigation
  pageId?: string
  pageSlug?: string
  
  // Data source actions
  dataSourceId?: string
  dataEndpointId?: string
  dataAction?: 'create' | 'update' | 'delete' | 'fetch' | 'filter' | 'search' | 'export' | 'import'
  dataPayload?: Record<string, any>
  dataTransform?: string // JavaScript code to transform data
  
  // Media actions
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'file' | 'pdf' | 'csv' | 'json'
  mediaAction?: 'view' | 'download' | 'stream' | 'preview'
  
  // Modal/popup actions
  modalContent?: string
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  // Custom actions
  customScript?: string
  customFunction?: string
  
  // Behavior options
  openInNewTab?: boolean
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
  
  // Conditional execution
  condition?: string // JavaScript expression
  
  // Chaining actions
  onSuccess?: ButtonAction
  onError?: ButtonAction
}

export interface SmartButtonProps {
  text?: string
  actions?: ButtonAction[]
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  
  // Data binding
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  
  // Context data for dynamic actions
  contextData?: Record<string, any>
}

export class ButtonActionExecutor {
  private contextData: Record<string, any> = {}
  
  constructor(contextData?: Record<string, any>) {
    this.contextData = contextData || {}
  }

  async executeAction(action: ButtonAction): Promise<boolean> {
    try {
      // Check condition if specified
      if (action.condition && !this.evaluateCondition(action.condition)) {
        return false
      }

      // Show confirmation if required
      if (action.confirmMessage && !confirm(action.confirmMessage)) {
        return false
      }

      let success = false

      switch (action.type) {
        case 'navigate':
          success = await this.handleNavigation(action)
          break
        case 'page':
          success = await this.handlePageNavigation(action)
          break
        case 'download':
          success = await this.handleDownload(action)
          break
        case 'email':
          success = this.handleEmail(action)
          break
        case 'phone':
          success = this.handlePhone(action)
          break
        case 'data-action':
          success = await this.handleDataAction(action)
          break
        case 'media':
          success = await this.handleMediaAction(action)
          break
        case 'modal':
          success = this.handleModal(action)
          break
        case 'custom':
          success = await this.handleCustomAction(action)
          break
        default:
          console.warn('Unknown action type:', action.type)
          return false
      }

      if (success) {
        if (action.successMessage) {
          this.showMessage(action.successMessage, 'success')
        }
        if (action.onSuccess) {
          await this.executeAction(action.onSuccess)
        }
      } else {
        if (action.errorMessage) {
          this.showMessage(action.errorMessage, 'error')
        }
        if (action.onError) {
          await this.executeAction(action.onError)
        }
      }

      return success
    } catch (error) {
      console.error('Action execution failed:', error)
      if (action.errorMessage) {
        this.showMessage(action.errorMessage, 'error')
      }
      if (action.onError) {
        await this.executeAction(action.onError)
      }
      return false
    }
  }

  private async handleNavigation(action: ButtonAction): Promise<boolean> {
    if (!action.target) return false
    
    const url = this.interpolateString(action.target)
    
    if (action.openInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
    return true
  }

  private async handlePageNavigation(action: ButtonAction): Promise<boolean> {
    const pageUrl = action.pageSlug ? `/page/${action.pageSlug}` : 
                   action.pageId ? `/page/${action.pageId}` : 
                   action.target
    
    if (!pageUrl) return false
    
    if (action.openInNewTab) {
      window.open(pageUrl, '_blank')
    } else {
      window.location.href = pageUrl
    }
    return true
  }

  private async handleDownload(action: ButtonAction): Promise<boolean> {
    if (!action.target) return false
    
    const url = this.interpolateString(action.target)
    const link = document.createElement('a')
    link.href = url
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }

  private handleEmail(action: ButtonAction): boolean {
    if (!action.target) return false
    
    const email = this.interpolateString(action.target)
    window.location.href = `mailto:${email}`
    return true
  }

  private handlePhone(action: ButtonAction): boolean {
    if (!action.target) return false
    
    const phone = this.interpolateString(action.target)
    window.location.href = `tel:${phone}`
    return true
  }

  private async handleDataAction(action: ButtonAction): Promise<boolean> {
    if (!action.dataSourceId || !action.dataEndpointId) return false

    try {
      let payload = action.dataPayload || {}
      
      // Merge context data
      payload = { ...payload, ...this.contextData }
      
      // Transform payload if specified
      if (action.dataTransform) {
        payload = this.transformData(payload, action.dataTransform)
      }

      let result
      switch (action.dataAction) {
        case 'create':
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, false, 'POST')
          break
        case 'update':
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, false, 'PUT')
          break
        case 'delete':
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, false, 'DELETE')
          break
        case 'fetch':
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, true)
          break
        case 'export':
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, true)
          this.downloadAsFile(result, 'export.json', 'application/json')
          break
        case 'import':
          // Handle file import (would need file picker integration)
          console.log('Import action - requires file picker integration')
          break
        default:
          result = await fetchDataSourceData(action.dataSourceId, action.dataEndpointId, payload, true)
      }

      return true
    } catch (error) {
      console.error('Data action failed:', error)
      return false
    }
  }

  private async handleMediaAction(action: ButtonAction): Promise<boolean> {
    if (!action.target) return false
    
    const url = this.interpolateString(action.target)
    
    switch (action.mediaAction) {
      case 'view':
      case 'preview':
        if (action.mediaType === 'image') {
          this.openImageLightbox(url)
        } else if (action.mediaType === 'video') {
          this.openVideoPlayer(url)
        } else {
          window.open(url, '_blank')
        }
        break
      case 'download':
        await this.handleDownload({ ...action, target: url })
        break
      case 'stream':
        window.open(url, '_blank')
        break
      default:
        window.open(url, '_blank')
    }
    
    return true
  }

  private handleModal(action: ButtonAction): boolean {
    if (!action.modalContent) return false
    
    // This would integrate with your modal system
    console.log('Modal action:', action.modalContent, action.modalSize)
    // Example: showModal(action.modalContent, action.modalSize)
    
    return true
  }

  private async handleCustomAction(action: ButtonAction): Promise<boolean> {
    try {
      if (action.customScript) {
        // Create a safe execution context
        const context = {
          contextData: this.contextData,
          console,
          fetch,
          // Add other safe globals as needed
        }
        
        const func = new Function('context', action.customScript)
        await func(context)
        return true
      }
      
      if (action.customFunction && typeof window[action.customFunction as keyof Window] === 'function') {
        await (window[action.customFunction as keyof Window] as Function)(this.contextData)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Custom action failed:', error)
      return false
    }
  }

  private evaluateCondition(condition: string): boolean {
    try {
      const func = new Function('contextData', `return ${condition}`)
      return func(this.contextData)
    } catch (error) {
      console.error('Condition evaluation failed:', error)
      return false
    }
  }

  private interpolateString(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.contextData[key] || match
    })
  }

  private transformData(data: any, transformScript: string): any {
    try {
      const func = new Function('data', 'contextData', `return ${transformScript}`)
      return func(data, this.contextData)
    } catch (error) {
      console.error('Data transformation failed:', error)
      return data
    }
  }

  private downloadAsFile(data: any, filename: string, mimeType: string) {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private openImageLightbox(url: string) {
    // This would integrate with your lightbox component
    console.log('Open image lightbox:', url)
  }

  private openVideoPlayer(url: string) {
    // This would integrate with your video player component
    console.log('Open video player:', url)
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info') {
    // This would integrate with your notification system
    console.log(`${type.toUpperCase()}: ${message}`)
  }
}

// Utility function to create smart buttons
export function createSmartButton(props: SmartButtonProps) {
  return {
    ...props,
    executor: new ButtonActionExecutor(props.contextData)
  }
}

// Predefined action templates
export const ACTION_TEMPLATES = {
  // Navigation actions
  NAVIGATE_TO_PAGE: (pageSlug: string): ButtonAction => ({
    type: 'page',
    pageSlug,
  }),
  
  NAVIGATE_TO_URL: (url: string, newTab = false): ButtonAction => ({
    type: 'navigate',
    target: url,
    openInNewTab: newTab,
  }),
  
  // Data actions
  CREATE_RECORD: (dataSourceId: string, dataEndpointId: string, payload: Record<string, any>): ButtonAction => ({
    type: 'data-action',
    dataSourceId,
    dataEndpointId,
    dataAction: 'create',
    dataPayload: payload,
    successMessage: 'Record created successfully!',
    errorMessage: 'Failed to create record.',
  }),
  
  UPDATE_RECORD: (dataSourceId: string, dataEndpointId: string, payload: Record<string, any>): ButtonAction => ({
    type: 'data-action',
    dataSourceId,
    dataEndpointId,
    dataAction: 'update',
    dataPayload: payload,
    successMessage: 'Record updated successfully!',
    errorMessage: 'Failed to update record.',
  }),
  
  DELETE_RECORD: (dataSourceId: string, dataEndpointId: string, payload: Record<string, any>): ButtonAction => ({
    type: 'data-action',
    dataSourceId,
    dataEndpointId,
    dataAction: 'delete',
    dataPayload: payload,
    confirmMessage: 'Are you sure you want to delete this record?',
    successMessage: 'Record deleted successfully!',
    errorMessage: 'Failed to delete record.',
  }),
  
  EXPORT_DATA: (dataSourceId: string, dataEndpointId: string): ButtonAction => ({
    type: 'data-action',
    dataSourceId,
    dataEndpointId,
    dataAction: 'export',
    successMessage: 'Data exported successfully!',
    errorMessage: 'Failed to export data.',
  }),
  
  // Media actions
  DOWNLOAD_FILE: (url: string): ButtonAction => ({
    type: 'download',
    target: url,
  }),
  
  VIEW_IMAGE: (url: string): ButtonAction => ({
    type: 'media',
    target: url,
    mediaType: 'image',
    mediaAction: 'view',
  }),
  
  PLAY_VIDEO: (url: string): ButtonAction => ({
    type: 'media',
    target: url,
    mediaType: 'video',
    mediaAction: 'stream',
  }),
  
  // Communication actions
  SEND_EMAIL: (email: string): ButtonAction => ({
    type: 'email',
    target: email,
  }),
  
  CALL_PHONE: (phone: string): ButtonAction => ({
    type: 'phone',
    target: phone,
  }),
}