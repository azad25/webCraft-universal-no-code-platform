import { getAuthToken } from './dev-auth'

export interface CustomAsset {
  id: string
  app_id: string
  page_id?: string
  name: string
  type: 'html' | 'css' | 'js' | 'image' | 'video' | 'audio'
  content?: string
  url?: string
  size?: number
  is_global: boolean
  metadata?: {
    width?: number
    height?: number
    duration?: number
    format?: string
    original_filename?: string
  }
  created_at: string
  updated_at: string
}

export interface CreateAssetData {
  name: string
  type: 'html' | 'css' | 'js'
  content: string
  page_id?: string
  is_global?: boolean
  metadata?: Record<string, any>
}

export interface UpdateAssetData {
  name?: string
  content?: string
  is_global?: boolean
  metadata?: Record<string, any>
}

class CustomAssetsAPI {
  private baseUrl = '/api/apps'

  private async request(url: string, options: RequestInit = {}) {
    const token = getAuthToken()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData}`)
    }

    return response.json()
  }

  async getAssets(appId: string, filters?: {
    type?: string
    is_global?: boolean
  }): Promise<{ assets: CustomAsset[], total: number }> {
    const params = new URLSearchParams()
    if (filters?.type) params.append('asset_type', filters.type)
    if (filters?.is_global !== undefined) params.append('is_global', filters.is_global.toString())
    
    const url = `${this.baseUrl}/${appId}/assets${params.toString() ? `?${params}` : ''}`
    return this.request(url)
  }

  async getAsset(appId: string, assetId: string): Promise<CustomAsset> {
    return this.request(`${this.baseUrl}/${appId}/assets/${assetId}`)
  }

  async createAsset(appId: string, data: CreateAssetData): Promise<CustomAsset> {
    return this.request(`${this.baseUrl}/${appId}/assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAsset(appId: string, assetId: string, data: UpdateAssetData): Promise<CustomAsset> {
    return this.request(`${this.baseUrl}/${appId}/assets/${assetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAsset(appId: string, assetId: string): Promise<void> {
    await this.request(`${this.baseUrl}/${appId}/assets/${assetId}`, {
      method: 'DELETE',
    })
  }

  async uploadFile(
    appId: string, 
    file: File, 
    options?: {
      pageId?: string
      isGlobal?: boolean
    }
  ): Promise<CustomAsset> {
    const token = getAuthToken()
    const formData = new FormData()
    
    formData.append('file', file)
    
    // Determine asset type from file
    let assetType: 'image' | 'video' | 'audio'
    if (file.type.startsWith('image/')) {
      assetType = 'image'
    } else if (file.type.startsWith('video/')) {
      assetType = 'video'
    } else if (file.type.startsWith('audio/')) {
      assetType = 'audio'
    } else {
      throw new Error('Unsupported file type')
    }
    
    formData.append('asset_type', assetType)
    
    if (options?.pageId) {
      formData.append('page_id', options.pageId)
    }
    
    if (options?.isGlobal !== undefined) {
      formData.append('is_global', options.isGlobal.toString())
    }

    const response = await fetch(`${this.baseUrl}/${appId}/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorData}`)
    }

    return response.json()
  }

  // Utility methods
  async getAssetsByType(appId: string, type: CustomAsset['type']): Promise<CustomAsset[]> {
    const result = await this.getAssets(appId, { type })
    return result.assets
  }

  async getGlobalAssets(appId: string): Promise<CustomAsset[]> {
    const result = await this.getAssets(appId, { is_global: true })
    return result.assets
  }

  async getPageAssets(appId: string, pageId: string): Promise<CustomAsset[]> {
    const result = await this.getAssets(appId)
    return result.assets.filter(asset => asset.page_id === pageId)
  }

  // Batch operations
  async createMultipleAssets(appId: string, assets: CreateAssetData[]): Promise<CustomAsset[]> {
    const promises = assets.map(asset => this.createAsset(appId, asset))
    return Promise.all(promises)
  }

  async deleteMultipleAssets(appId: string, assetIds: string[]): Promise<void> {
    const promises = assetIds.map(id => this.deleteAsset(appId, id))
    await Promise.all(promises)
  }

  // File validation
  validateFile(file: File): { valid: boolean, error?: string } {
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      video: 100 * 1024 * 1024, // 100MB
      audio: 50 * 1024 * 1024, // 50MB
    }

    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'],
    }

    let category: 'image' | 'video' | 'audio'
    if (file.type.startsWith('image/')) {
      category = 'image'
    } else if (file.type.startsWith('video/')) {
      category = 'video'
    } else if (file.type.startsWith('audio/')) {
      category = 'audio'
    } else {
      return { valid: false, error: 'Unsupported file type' }
    }

    if (!allowedTypes[category].includes(file.type)) {
      return { valid: false, error: `Unsupported ${category} format` }
    }

    if (file.size > maxSizes[category]) {
      const maxSizeMB = maxSizes[category] / 1024 / 1024
      return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` }
    }

    return { valid: true }
  }

  // Code validation
  validateCode(type: 'html' | 'css' | 'js', content: string): { valid: boolean, error?: string } {
    if (!content.trim()) {
      return { valid: false, error: 'Content cannot be empty' }
    }

    // Basic validation
    if (type === 'html') {
      // Check for basic HTML structure issues
      const openTags = (content.match(/<[^/][^>]*>/g) || []).length
      const closeTags = (content.match(/<\/[^>]*>/g) || []).length
      if (Math.abs(openTags - closeTags) > 2) { // Allow some flexibility
        return { valid: false, error: 'HTML tags may not be properly balanced' }
      }
    }

    if (type === 'css') {
      // Check for basic CSS syntax
      const openBraces = (content.match(/{/g) || []).length
      const closeBraces = (content.match(/}/g) || []).length
      if (openBraces !== closeBraces) {
        return { valid: false, error: 'CSS braces are not balanced' }
      }
    }

    if (type === 'js') {
      // Basic JS validation - check for common syntax errors
      try {
        // This is a very basic check - in production you might want more sophisticated validation
        new Function(content)
      } catch (error) {
        return { valid: false, error: `JavaScript syntax error: ${error}` }
      }
    }

    return { valid: true }
  }
}

export const customAssetsAPI = new CustomAssetsAPI()

// Export utility functions
export const validateFile = (file: File) => customAssetsAPI.validateFile(file)
export const validateCode = (type: 'html' | 'css' | 'js', content: string) => 
  customAssetsAPI.validateCode(type, content)

// Export hooks for React components
export const useCustomAssets = (appId: string) => {
  const [assets, setAssets] = useState<CustomAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAssets = useCallback(async (filters?: { type?: string, is_global?: boolean }) => {
    setLoading(true)
    setError(null)
    try {
      const result = await customAssetsAPI.getAssets(appId, filters)
      setAssets(result.assets)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [appId])

  const createAsset = useCallback(async (data: CreateAssetData) => {
    try {
      const newAsset = await customAssetsAPI.createAsset(appId, data)
      setAssets(prev => [newAsset, ...prev])
      return newAsset
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [appId])

  const updateAsset = useCallback(async (assetId: string, data: UpdateAssetData) => {
    try {
      const updatedAsset = await customAssetsAPI.updateAsset(appId, assetId, data)
      setAssets(prev => prev.map(asset => asset.id === assetId ? updatedAsset : asset))
      return updatedAsset
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [appId])

  const deleteAsset = useCallback(async (assetId: string) => {
    try {
      await customAssetsAPI.deleteAsset(appId, assetId)
      setAssets(prev => prev.filter(asset => asset.id !== assetId))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [appId])

  const uploadFile = useCallback(async (file: File, options?: { pageId?: string, isGlobal?: boolean }) => {
    try {
      const newAsset = await customAssetsAPI.uploadFile(appId, file, options)
      setAssets(prev => [newAsset, ...prev])
      return newAsset
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [appId])

  return {
    assets,
    loading,
    error,
    loadAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    uploadFile,
  }
}

// React imports for the hook
import { useState, useCallback } from 'react'