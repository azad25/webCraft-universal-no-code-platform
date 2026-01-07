/**
 * Module State Slice
 * Manages installed and enabled modules
 */

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { moduleRegistry, ModuleMetadata } from '@/lib/module-system'
import { api } from '@/lib/api-client'

interface ModuleState {
  available: ModuleMetadata[]
  enabled: string[]
  installing: string[]
  loading: boolean
  error: string | null
}

const initialState: ModuleState = {
  available: [],
  enabled: [],
  installing: [],
  loading: false,
  error: null
}

// Async thunks
export const fetchModules = createAsyncThunk(
  'modules/fetchAll',
  async () => {
    const response = await api.get('/modules')
    return response.data.modules
  }
)

export const enableModule = createAsyncThunk(
  'modules/enable',
  async ({ moduleId, config }: { moduleId: string; config?: Record<string, any> }) => {
    const response = await api.post(`/modules/${moduleId}/enable`, { config })
    return { moduleId, success: response.data.success }
  }
)

export const disableModule = createAsyncThunk(
  'modules/disable',
  async (moduleId: string) => {
    const response = await api.post(`/modules/${moduleId}/disable`)
    return { moduleId, success: response.data.success }
  }
)

const moduleSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    setEnabled: (state, action: PayloadAction<string[]>) => {
      state.enabled = action.payload
    },
    addEnabled: (state, action: PayloadAction<string>) => {
      if (!state.enabled.includes(action.payload)) {
        state.enabled.push(action.payload)
      }
    },
    removeEnabled: (state, action: PayloadAction<string>) => {
      state.enabled = state.enabled.filter(id => id !== action.payload)
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModules.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false
        state.available = action.payload
        state.enabled = action.payload
          .filter((m: any) => m.enabled)
          .map((m: any) => m.id)
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch modules'
      })
      .addCase(enableModule.pending, (state, action) => {
        state.installing.push(action.meta.arg.moduleId)
      })
      .addCase(enableModule.fulfilled, (state, action) => {
        state.installing = state.installing.filter(id => id !== action.payload.moduleId)
        if (action.payload.success) {
          state.enabled.push(action.payload.moduleId)
        }
      })
      .addCase(enableModule.rejected, (state, action) => {
        state.installing = state.installing.filter(id => id !== action.meta.arg.moduleId)
        state.error = action.error.message || 'Failed to enable module'
      })
      .addCase(disableModule.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.enabled = state.enabled.filter(id => id !== action.payload.moduleId)
        }
      })
  }
})

export const { setEnabled, addEnabled, removeEnabled, clearError } = moduleSlice.actions
export default moduleSlice.reducer

// Selectors
export const selectAvailableModules = (state: { modules: ModuleState }) => state.modules.available
export const selectEnabledModules = (state: { modules: ModuleState }) => state.modules.enabled
export const selectIsModuleEnabled = (moduleId: string) => 
  (state: { modules: ModuleState }) => state.modules.enabled.includes(moduleId)
export const selectModulesLoading = (state: { modules: ModuleState }) => state.modules.loading
