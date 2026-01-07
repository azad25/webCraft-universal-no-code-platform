/**
 * App State Slice
 * Manages user's apps, templates, and widgets
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/api-client'

// Types
export interface App {
  id: string
  name: string
  slug: string
  description: string | null
  appType: string
  isPublished: boolean
  customDomain: string | null
  subdomain: string | null
  config: Record<string, any>
  themeConfig: Record<string, any>
  seoConfig: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  previewImage: string | null
  demoUrl: string | null
  isPremium: boolean
  price: number
  downloads: number
  rating: number
  tags: string[]
  createdAt: string
}

export interface Widget {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  configSchema: Record<string, any>
  defaultConfig: Record<string, any>
  isPremium: boolean
  price: number
  downloads: number
  rating: number
}

interface AppState {
  // User's apps
  apps: App[]
  currentApp: App | null
  isLoadingApps: boolean
  appsError: string | null
  
  // Templates
  templates: Template[]
  featuredTemplates: Template[]
  templateCategories: string[]
  isLoadingTemplates: boolean
  templatesError: string | null
  
  // Widgets
  widgets: Widget[]
  widgetCategories: string[]
  isLoadingWidgets: boolean
  widgetsError: string | null
  
  // Filters
  appFilter: {
    search: string
    type: string | null
    status: 'all' | 'published' | 'draft'
  }
  templateFilter: {
    search: string
    category: string | null
    isPremium: boolean | null
  }
}

const initialState: AppState = {
  apps: [],
  currentApp: null,
  isLoadingApps: false,
  appsError: null,
  
  templates: [],
  featuredTemplates: [],
  templateCategories: [],
  isLoadingTemplates: false,
  templatesError: null,
  
  widgets: [],
  widgetCategories: [],
  isLoadingWidgets: false,
  widgetsError: null,
  
  appFilter: {
    search: '',
    type: null,
    status: 'all'
  },
  templateFilter: {
    search: '',
    category: null,
    isPremium: null
  }
}

// Async thunks
export const fetchApps = createAsyncThunk<App[], void>(
  'app/fetchApps',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ apps: App[] }>('/apps')
      return response.data.apps
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch apps')
    }
  }
)

export const fetchApp = createAsyncThunk<App, string>(
  'app/fetchApp',
  async (appId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<App>(`/apps/${appId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch app')
    }
  }
)

export const createApp = createAsyncThunk<App, {
  name: string
  description?: string
  appType: string
  templateId?: string
}>(
  'app/createApp',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<App>('/apps', {
        name: data.name,
        description: data.description,
        app_type: data.appType,
        template_id: data.templateId
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create app')
    }
  }
)

export const updateApp = createAsyncThunk<App, {
  id: string
  updates: Partial<App>
}>(
  'app/updateApp',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<App>(`/apps/${id}`, updates)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update app')
    }
  }
)

export const deleteApp = createAsyncThunk<string, string>(
  'app/deleteApp',
  async (appId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/apps/${appId}`)
      return appId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete app')
    }
  }
)

export const publishApp = createAsyncThunk<App, {
  appId: string
  customDomain?: string
  subdomain?: string
}>(
  'app/publishApp',
  async ({ appId, customDomain, subdomain }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<App>(`/apps/${appId}/publish`, {
        custom_domain: customDomain,
        subdomain
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to publish app')
    }
  }
)

export const unpublishApp = createAsyncThunk<App, string>(
  'app/unpublishApp',
  async (appId, { rejectWithValue }) => {
    try {
      await apiClient.post(`/apps/${appId}/unpublish`)
      const response = await apiClient.get<App>(`/apps/${appId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to unpublish app')
    }
  }
)

export const fetchTemplates = createAsyncThunk<{
  templates: Template[]
  categories: string[]
  featured: Template[]
}, { category?: string; search?: string }>(
  'app/fetchTemplates',
  async (params, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/templates', { params })
      return {
        templates: response.data.templates,
        categories: response.data.categories || [],
        featured: response.data.featured || []
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch templates')
    }
  }
)

export const installTemplate = createAsyncThunk<App, {
  templateId: string
  appName: string
  appDescription?: string
}>(
  'app/installTemplate',
  async ({ templateId, appName, appDescription }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ app_id: string }>(`/templates/${templateId}/install`, {
        app_name: appName,
        app_description: appDescription
      })
      
      // Fetch the created app
      const appResponse = await apiClient.get<App>(`/apps/${response.data.app_id}`)
      return appResponse.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to install template')
    }
  }
)

export const fetchWidgets = createAsyncThunk<{
  widgets: Widget[]
  categories: string[]
}, { category?: string }>(
  'app/fetchWidgets',
  async (params, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/widgets', { params })
      return {
        widgets: response.data.widgets,
        categories: response.data.categories || []
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch widgets')
    }
  }
)

// Slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentApp: (state, action: PayloadAction<App | null>) => {
      state.currentApp = action.payload
    },
    
    setAppFilter: (state, action: PayloadAction<Partial<AppState['appFilter']>>) => {
      state.appFilter = { ...state.appFilter, ...action.payload }
    },
    
    setTemplateFilter: (state, action: PayloadAction<Partial<AppState['templateFilter']>>) => {
      state.templateFilter = { ...state.templateFilter, ...action.payload }
    },
    
    clearErrors: (state) => {
      state.appsError = null
      state.templatesError = null
      state.widgetsError = null
    }
  },
  extraReducers: (builder) => {
    // Fetch apps
    builder
      .addCase(fetchApps.pending, (state) => {
        state.isLoadingApps = true
        state.appsError = null
      })
      .addCase(fetchApps.fulfilled, (state, action) => {
        state.isLoadingApps = false
        state.apps = action.payload
      })
      .addCase(fetchApps.rejected, (state, action) => {
        state.isLoadingApps = false
        state.appsError = action.payload as string
      })
    
    // Fetch single app
    builder
      .addCase(fetchApp.pending, (state) => {
        state.isLoadingApps = true
      })
      .addCase(fetchApp.fulfilled, (state, action) => {
        state.isLoadingApps = false
        state.currentApp = action.payload
        
        // Update in apps list if exists
        const index = state.apps.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.apps[index] = action.payload
        }
      })
      .addCase(fetchApp.rejected, (state, action) => {
        state.isLoadingApps = false
        state.appsError = action.payload as string
      })
    
    // Create app
    builder
      .addCase(createApp.fulfilled, (state, action) => {
        state.apps.unshift(action.payload)
        state.currentApp = action.payload
      })
    
    // Update app
    builder
      .addCase(updateApp.fulfilled, (state, action) => {
        const index = state.apps.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.apps[index] = action.payload
        }
        if (state.currentApp?.id === action.payload.id) {
          state.currentApp = action.payload
        }
      })
    
    // Delete app
    builder
      .addCase(deleteApp.fulfilled, (state, action) => {
        state.apps = state.apps.filter(a => a.id !== action.payload)
        if (state.currentApp?.id === action.payload) {
          state.currentApp = null
        }
      })
    
    // Publish app
    builder
      .addCase(publishApp.fulfilled, (state, action) => {
        const index = state.apps.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.apps[index] = action.payload
        }
        if (state.currentApp?.id === action.payload.id) {
          state.currentApp = action.payload
        }
      })
    
    // Unpublish app
    builder
      .addCase(unpublishApp.fulfilled, (state, action) => {
        const index = state.apps.findIndex(a => a.id === action.payload.id)
        if (index !== -1) {
          state.apps[index] = action.payload
        }
        if (state.currentApp?.id === action.payload.id) {
          state.currentApp = action.payload
        }
      })
    
    // Fetch templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoadingTemplates = true
        state.templatesError = null
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoadingTemplates = false
        state.templates = action.payload.templates
        state.templateCategories = action.payload.categories
        state.featuredTemplates = action.payload.featured
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoadingTemplates = false
        state.templatesError = action.payload as string
      })
    
    // Install template
    builder
      .addCase(installTemplate.fulfilled, (state, action) => {
        state.apps.unshift(action.payload)
        state.currentApp = action.payload
      })
    
    // Fetch widgets
    builder
      .addCase(fetchWidgets.pending, (state) => {
        state.isLoadingWidgets = true
        state.widgetsError = null
      })
      .addCase(fetchWidgets.fulfilled, (state, action) => {
        state.isLoadingWidgets = false
        state.widgets = action.payload.widgets
        state.widgetCategories = action.payload.categories
      })
      .addCase(fetchWidgets.rejected, (state, action) => {
        state.isLoadingWidgets = false
        state.widgetsError = action.payload as string
      })
  }
})

export const {
  setCurrentApp,
  setAppFilter,
  setTemplateFilter,
  clearErrors
} = appSlice.actions

export default appSlice.reducer

// Selectors
export const selectApps = (state: { app: AppState }) => state.app.apps
export const selectCurrentApp = (state: { app: AppState }) => state.app.currentApp
export const selectTemplates = (state: { app: AppState }) => state.app.templates
export const selectFeaturedTemplates = (state: { app: AppState }) => state.app.featuredTemplates
export const selectWidgets = (state: { app: AppState }) => state.app.widgets

// Filtered selectors
export const selectFilteredApps = (state: { app: AppState }) => {
  const { apps, appFilter } = state.app
  
  return apps.filter(app => {
    // Search filter
    if (appFilter.search) {
      const search = appFilter.search.toLowerCase()
      if (!app.name.toLowerCase().includes(search) && 
          !app.description?.toLowerCase().includes(search)) {
        return false
      }
    }
    
    // Type filter
    if (appFilter.type && app.appType !== appFilter.type) {
      return false
    }
    
    // Status filter
    if (appFilter.status === 'published' && !app.isPublished) {
      return false
    }
    if (appFilter.status === 'draft' && app.isPublished) {
      return false
    }
    
    return true
  })
}