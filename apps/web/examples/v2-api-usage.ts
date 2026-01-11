/**
 * V2 API Usage Examples
 * 
 * This file demonstrates how to use the V2 API endpoints from the frontend
 * through the updated proxy configuration.
 */

import { useState } from 'react'
import { v2Api, v1Api, apiClient } from '../lib/api-client'

// Example 1: Using v2Api utility functions
export const v2Examples = {
  // Authentication
  async login(email: string, password: string) {
    try {
      const response = await v2Api.post('/auth/login', { email, password })
      return response.data
    } catch (error) {
      console.error('V2 Login failed:', error)
      throw error
    }
  },

  // Apps
  async getApps() {
    try {
      const response = await v2Api.get('/apps')
      return response.data
    } catch (error) {
      console.error('V2 Get apps failed:', error)
      throw error
    }
  },

  async createApp(appData: any) {
    try {
      const response = await v2Api.post('/apps', appData)
      return response.data
    } catch (error) {
      console.error('V2 Create app failed:', error)
      throw error
    }
  },

  // Templates
  async getTemplates() {
    try {
      const response = await v2Api.get('/templates')
      return response.data
    } catch (error) {
      console.error('V2 Get templates failed:', error)
      throw error
    }
  },

  // Data Sources
  async getDataSources(appId: string) {
    try {
      const response = await v2Api.get('/data-sources', { params: { app_id: appId } })
      return response.data
    } catch (error) {
      console.error('V2 Get data sources failed:', error)
      throw error
    }
  },

  async createDataSource(appId: string, dataSourceData: any) {
    try {
      const response = await v2Api.post('/data-sources', dataSourceData, { 
        params: { app_id: appId } 
      })
      return response.data
    } catch (error) {
      console.error('V2 Create data source failed:', error)
      throw error
    }
  },

  // Actions
  async getActions(appId: string) {
    try {
      const response = await v2Api.get(`/actions/apps/${appId}`)
      return response.data
    } catch (error) {
      console.error('V2 Get actions failed:', error)
      throw error
    }
  },

  async executeAction(appId: string, actionId: string, payload: any) {
    try {
      const response = await v2Api.post(`/actions/apps/${appId}/${actionId}/execute`, payload)
      return response.data
    } catch (error) {
      console.error('V2 Execute action failed:', error)
      throw error
    }
  },

  // Webhooks
  async getWebhooks(appId: string) {
    try {
      const response = await v2Api.get(`/webhooks/apps/${appId}`)
      return response.data
    } catch (error) {
      console.error('V2 Get webhooks failed:', error)
      throw error
    }
  },

  // Collections
  async getCollections(appId: string) {
    try {
      const response = await v2Api.get(`/apps/${appId}/collections`)
      return response.data
    } catch (error) {
      console.error('V2 Get collections failed:', error)
      throw error
    }
  },

  // Pages
  async getPages(appId: string) {
    try {
      const response = await v2Api.get(`/apps/${appId}/pages`)
      return response.data
    } catch (error) {
      console.error('V2 Get pages failed:', error)
      throw error
    }
  },

  // Automations
  async getAutomations(appId: string) {
    try {
      const response = await v2Api.get(`/apps/${appId}/automations`)
      return response.data
    } catch (error) {
      console.error('V2 Get automations failed:', error)
      throw error
    }
  },

  // Integrations
  async getAvailableIntegrations() {
    try {
      const response = await v2Api.get('/integrations/available')
      return response.data
    } catch (error) {
      console.error('V2 Get available integrations failed:', error)
      throw error
    }
  },

  // AI Services
  async generateContent(prompt: string, context?: any) {
    try {
      const response = await v2Api.post('/ai/generate-content', { prompt, context })
      return response.data
    } catch (error) {
      console.error('V2 Generate content failed:', error)
      throw error
    }
  },

  // Export
  async exportToStatic(appId: string) {
    try {
      const response = await v2Api.post(`/apps/${appId}/export/static`)
      return response.data
    } catch (error) {
      console.error('V2 Export to static failed:', error)
      throw error
    }
  },

  async getExportStatus(appId: string, exportId?: string) {
    try {
      const params = exportId ? { export_id: exportId } : {}
      const response = await v2Api.get(`/apps/${appId}/export/status`, { params })
      return response.data
    } catch (error) {
      console.error('V2 Get export status failed:', error)
      throw error
    }
  }
}

// Example 2: Direct API client usage with manual v2 paths
export const directV2Examples = {
  async getHealth() {
    try {
      const response = await apiClient.get('/api/v2/health')
      return response.data
    } catch (error) {
      console.error('V2 Health check failed:', error)
      throw error
    }
  },

  async getTemplates() {
    try {
      const response = await apiClient.get('/api/v2/templates')
      return response.data
    } catch (error) {
      console.error('V2 Get templates failed:', error)
      throw error
    }
  }
}

// Example 3: Comparison with V1 API usage
export const v1Examples = {
  async login(email: string, password: string) {
    try {
      const response = await v1Api.post('/auth/login', { email, password })
      return response.data
    } catch (error) {
      console.error('V1 Login failed:', error)
      throw error
    }
  },

  async getApps() {
    try {
      const response = await v1Api.get('/apps')
      return response.data
    } catch (error) {
      console.error('V1 Get apps failed:', error)
      throw error
    }
  }
}

// Example 4: React Hook usage
export const useV2Api = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callV2Api = async (apiCall: () => Promise<any>) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiCall()
      return result
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { callV2Api, loading, error }
}

// Example 5: SWR usage with V2 API
import useSWR from 'swr'

export const useV2Templates = () => {
  return useSWR('/api/v2/templates', async (url) => {
    const response = await apiClient.get(url)
    return response.data
  })
}

export const useV2Apps = () => {
  return useSWR('/api/v2/apps', async (url) => {
    const response = await apiClient.get(url)
    return response.data
  })
}

// Example 6: React Query usage with V2 API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const useV2AppsQuery = () => {
  return useQuery({
    queryKey: ['v2', 'apps'],
    queryFn: () => v2Examples.getApps()
  })
}

export const useV2CreateAppMutation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (appData: any) => v2Examples.createApp(appData),
    onSuccess: () => {
      // Invalidate and refetch apps list
      queryClient.invalidateQueries({ queryKey: ['v2', 'apps'] })
    }
  })
}

// Example 7: Error handling patterns
export const handleV2ApiError = (error: any) => {
  if (error.status === 401) {
    // Handle unauthorized - redirect to login
    window.location.href = '/login'
  } else if (error.status === 403) {
    // Handle forbidden - show permission error
    console.error('Permission denied')
  } else if (error.status >= 500) {
    // Handle server errors
    console.error('Server error:', error.message)
  } else {
    // Handle other errors
    console.error('API error:', error.message)
  }
}

// Example 8: Batch operations
export const batchV2Operations = {
  async createMultipleApps(appsData: any[]) {
    const promises = appsData.map(appData => v2Examples.createApp(appData))
    return Promise.allSettled(promises)
  },

  async getAppDetails(appIds: string[]) {
    const promises = appIds.map(id => v2Api.get(`/apps/${id}`))
    const results = await Promise.allSettled(promises)
    
    return results.map((result, index) => ({
      appId: appIds[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value.data : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}

// Export all examples
export default {
  v2Examples,
  directV2Examples,
  v1Examples,
  useV2Api,
  useV2Templates,
  useV2Apps,
  useV2AppsQuery,
  useV2CreateAppMutation,
  handleV2ApiError,
  batchV2Operations
}