/**
 * Widget Layers API Client
 * Handles widget decomposition and sub-element management
 */

import { apiClient } from './api-client'

export interface SubElement {
  id: string
  parent_element_id: string
  path: string
  type: string
  name: string
  value: any
  editable: boolean
  visible: boolean
  locked: boolean
  metadata: Record<string, any>
}

export interface WidgetDecomposition {
  element_id: string
  element_type: string
  sub_elements: SubElement[]
  total_sub_elements: number
}

export interface SupportedWidget {
  type: string
  name: string
  sub_element_count: number
  sub_elements: Array<{
    type: string
    name: string
    path: string
    editable: boolean
  }>
}

export interface SupportedWidgetsResponse {
  supported_widgets: SupportedWidget[]
  total_widget_types: number
  total_sub_elements: number
}

export const widgetLayersApi = {
  // Get widget decomposition for a specific element
  async decomposeWidget(appId: string, elementId: string): Promise<WidgetDecomposition> {
    try {
      const response = await apiClient.get(`/apps/${appId}/widget-layers/${elementId}/decompose`)
      return response.data
    } catch (error) {
      console.error('Failed to decompose widget:', error)
      throw error
    }
  },

  // Update a sub-element within a widget
  async updateSubElement(
    appId: string, 
    elementId: string, 
    subElementPath: string, 
    value: any
  ): Promise<{ success: boolean; updated_at: string }> {
    try {
      const response = await apiClient.put(
        `/apps/${appId}/widget-layers/${elementId}/sub-element/${subElementPath}`,
        { value }
      )
      return response.data
    } catch (error) {
      console.error('Failed to update sub-element:', error)
      throw error
    }
  },

  // Get all widget layers for an app or page
  async getAllWidgetLayers(
    appId: string, 
    pageId?: string, 
    widgetType?: string
  ): Promise<WidgetDecomposition[]> {
    try {
      const params: any = {}
      if (pageId) params.page_id = pageId
      if (widgetType) params.widget_type = widgetType

      const response = await apiClient.get(`/apps/${appId}/widget-layers`, { params })
      return response.data
    } catch (error) {
      console.error('Failed to get widget layers:', error)
      throw error
    }
  },

  // Get supported widget types
  async getSupportedWidgets(): Promise<SupportedWidgetsResponse> {
    try {
      const response = await apiClient.get('/api/v1/widget-layers/supported-widgets')
      return response.data
    } catch (error) {
      console.error('Failed to get supported widgets:', error)
      throw error
    }
  }
}