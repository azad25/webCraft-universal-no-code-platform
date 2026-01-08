/**
 * Data Source API Client
 * Handles fetching data from connected data sources
 */

import { apiClient } from './api-client'

export interface DataSourceResponse {
  data: any[]
  cached: boolean
  cache_hit_count?: number
}

export interface DataSource {
  id: string
  name: string
  description: string
  base_url: string
  auth_type: string
  is_connected: boolean
  last_tested: string | null
  last_error: string | null
  endpoint_count: number
  created_at: string
}

export interface DataSourceEndpoint {
  id: string
  name: string
  path: string
  method: string
  query_params: Record<string, any>
  response_mapping: Record<string, string> | null
}

/**
 * Fetch data from a data source endpoint
 */
export async function fetchDataSourceData(
  sourceId: string,
  endpointId: string,
  params: Record<string, any> = {},
  useCache: boolean = true
): Promise<DataSourceResponse> {
  try {
    const response = await apiClient.post(
      `/data-sources/${sourceId}/endpoints/${endpointId}/fetch`,
      params,
      {
        params: { use_cache: useCache }
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to fetch data source data:', error)
    throw error
  }
}

/**
 * Get all data sources for an app
 */
export async function getDataSources(appId: string): Promise<DataSource[]> {
  try {
    const response = await apiClient.get(`/data-sources?app_id=${appId}`)
    return response.data.data_sources || []
  } catch (error) {
    console.error('Failed to fetch data sources:', error)
    return []
  }
}

/**
 * Get endpoints for a data source
 */
export async function getDataSourceEndpoints(sourceId: string): Promise<DataSourceEndpoint[]> {
  try {
    const response = await apiClient.get(`/data-sources/${sourceId}/endpoints`)
    return response.data.endpoints || []
  } catch (error) {
    console.error('Failed to fetch data source endpoints:', error)
    return []
  }
}

/**
 * Preview data from an endpoint
 */
export async function previewEndpointData(
  sourceId: string,
  endpointId: string
): Promise<{ sample_data: any; structure: any[]; total_items: number }> {
  try {
    const response = await apiClient.get(`/data-sources/${sourceId}/endpoints/${endpointId}/preview`)
    return response.data
  } catch (error) {
    console.error('Failed to preview endpoint data:', error)
    throw error
  }
}

/**
 * Create or update widget data binding
 */
export async function createWidgetBinding(
  widgetId: string,
  sourceId: string,
  endpointId?: string,
  scraperId?: string,
  fieldMappings: Record<string, string> = {},
  refreshInterval: number = 0
): Promise<{ success: boolean; binding_id: string }> {
  try {
    const response = await apiClient.post('/data-sources/bindings', {
      app_widget_id: widgetId,
      data_source_endpoint_id: endpointId,
      scraper_id: scraperId,
      binding_type: endpointId ? 'api' : 'scraper',
      field_mappings: fieldMappings,
      refresh_interval: refreshInterval
    })
    return response.data
  } catch (error) {
    console.error('Failed to create widget binding:', error)
    throw error
  }
}

/**
 * Get widget data bindings
 */
export async function getWidgetBindings(widgetId: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/data-sources/bindings/${widgetId}`)
    return response.data.bindings || []
  } catch (error) {
    console.error('Failed to fetch widget bindings:', error)
    return []
  }
}