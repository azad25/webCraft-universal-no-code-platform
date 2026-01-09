/**
 * Media API Client
 * Handles all media-related API calls
 */

import { api } from './api-client'

export type MediaType = 'image' | 'video' | 'document' | 'url' | 'code' | 'embed'

export interface MediaItem {
  id: string
  app_id: string
  type: MediaType
  name: string
  url: string
  thumbnail_url?: string
  mime_type?: string
  size?: number
  width?: number
  height?: number
  duration?: number
  alt_text?: string
  caption?: string
  metadata?: Record<string, any>
  folder_id?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface MediaFolder {
  id: string
  app_id: string
  name: string
  parent_id?: string
  created_at: string
}

export interface UploadResponse {
  success: boolean
  media?: MediaItem
  error?: string
}

export interface EmbedRequest {
  url: string
  app_id: string
  folder_id?: string
}

export interface CodeSnippetRequest {
  app_id: string
  name: string
  code: string
  language: string
  folder_id?: string
}

export interface UrlMediaRequest {
  app_id: string
  url: string
  name?: string
  folder_id?: string
}

export interface MediaListParams {
  type?: MediaType
  folder_id?: string
  search?: string
  tags?: string
  page?: number
  limit?: number
}

export const mediaApi = {
  // Upload file
  async uploadFile(
    file: File,
    appId: string,
    folderId?: string,
    altText?: string,
    tags?: string[]
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('app_id', appId)
    
    if (folderId) formData.append('folder_id', folderId)
    if (altText) formData.append('alt_text', altText)
    if (tags?.length) formData.append('tags', tags.join(','))

    const response = await api.post<UploadResponse>('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },

  // Upload multiple files
  async uploadBatch(
    files: File[],
    appId: string,
    folderId?: string
  ): Promise<UploadResponse[]> {
    const formData = new FormData()
    
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('app_id', appId)
    
    if (folderId) formData.append('folder_id', folderId)

    const response = await api.post<UploadResponse[]>('/api/media/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  },

  // Add embed (YouTube, Vimeo, etc.)
  async addEmbed(request: EmbedRequest): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/api/media/embed', request)
    return response.data
  },

  // Add URL media
  async addUrlMedia(request: UrlMediaRequest): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/api/media/url', request)
    return response.data
  },

  // Add code snippet
  async addCodeSnippet(request: CodeSnippetRequest): Promise<UploadResponse> {
    const response = await api.post<UploadResponse>('/api/media/code', request)
    return response.data
  },

  // List media
  async listMedia(appId: string, params?: MediaListParams): Promise<MediaItem[]> {
    const response = await api.get<MediaItem[]>(`/api/media/list/${appId}`, {
      params
    })
    return response.data
  },

  // Get single media item
  async getMedia(mediaId: string): Promise<MediaItem> {
    const response = await api.get<MediaItem>(`/api/media/${mediaId}`)
    return response.data
  },

  // Update media
  async updateMedia(
    mediaId: string,
    updates: {
      name?: string
      alt_text?: string
      caption?: string
      folder_id?: string
      tags?: string[]
    }
  ): Promise<MediaItem> {
    const response = await api.put<MediaItem>(`/api/media/${mediaId}`, updates)
    return response.data
  },

  // Delete media
  async deleteMedia(mediaId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/api/media/${mediaId}`)
    return response.data
  },

  // Folder management
  async createFolder(appId: string, name: string, parentId?: string): Promise<MediaFolder> {
    const response = await api.post<MediaFolder>('/api/media/folders', {
      app_id: appId,
      name,
      parent_id: parentId
    })
    return response.data
  },

  async listFolders(appId: string, parentId?: string): Promise<MediaFolder[]> {
    const response = await api.get<MediaFolder[]>(`/api/media/folders/${appId}`, {
      params: { parent_id: parentId }
    })
    return response.data
  },

  async deleteFolder(folderId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/api/media/folders/${folderId}`)
    return response.data
  }
}