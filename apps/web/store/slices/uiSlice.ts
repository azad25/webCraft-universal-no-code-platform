/**
 * UI State Slice
 * Manages UI preferences, theme, and global UI state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
type Theme = 'light' | 'dark' | 'system'
type SidebarState = 'expanded' | 'collapsed' | 'hidden'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface Modal {
  id: string
  type: string
  props?: Record<string, any>
}

interface UIState {
  // Theme
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  
  // Sidebar
  sidebarState: SidebarState
  rightPanelOpen: boolean
  rightPanelTab: string
  
  // Modals
  modals: Modal[]
  
  // Toasts
  toasts: Toast[]
  
  // Loading states
  globalLoading: boolean
  loadingMessage: string | null
  
  // Command palette
  commandPaletteOpen: boolean
  
  // Keyboard shortcuts
  shortcutsEnabled: boolean
  
  // Onboarding
  onboardingCompleted: boolean
  onboardingStep: number
  
  // Preferences
  preferences: {
    autoSave: boolean
    autoSaveInterval: number // seconds
    showGrid: boolean
    snapToGrid: boolean
    showRulers: boolean
    animationsEnabled: boolean
    soundEnabled: boolean
    compactMode: boolean
  }
  
  // Notifications
  notificationsEnabled: boolean
  unreadNotifications: number
  
  // Mobile
  isMobileMenuOpen: boolean
  isMobile: boolean
}

const initialState: UIState = {
  theme: 'system',
  resolvedTheme: 'light',
  
  sidebarState: 'expanded',
  rightPanelOpen: true,
  rightPanelTab: 'properties',
  
  modals: [],
  toasts: [],
  
  globalLoading: false,
  loadingMessage: null,
  
  commandPaletteOpen: false,
  shortcutsEnabled: true,
  
  onboardingCompleted: false,
  onboardingStep: 0,
  
  preferences: {
    autoSave: true,
    autoSaveInterval: 30,
    showGrid: true,
    snapToGrid: true,
    showRulers: false,
    animationsEnabled: true,
    soundEnabled: false,
    compactMode: false
  },
  
  notificationsEnabled: true,
  unreadNotifications: 0,
  
  isMobileMenuOpen: false,
  isMobile: false
}

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
    },
    
    setResolvedTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.resolvedTheme = action.payload
    },
    
    // Sidebar
    setSidebarState: (state, action: PayloadAction<SidebarState>) => {
      state.sidebarState = action.payload
    },
    
    toggleSidebar: (state) => {
      state.sidebarState = state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'
    },
    
    setRightPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.rightPanelOpen = action.payload
    },
    
    setRightPanelTab: (state, action: PayloadAction<string>) => {
      state.rightPanelTab = action.payload
      state.rightPanelOpen = true
    },
    
    // Modals
    openModal: (state, action: PayloadAction<{ type: string; props?: Record<string, any> }>) => {
      const id = `modal-${Date.now()}`
      state.modals.push({
        id,
        type: action.payload.type,
        props: action.payload.props
      })
    },
    
    closeModal: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        state.modals = state.modals.filter(m => m.id !== action.payload)
      } else {
        state.modals.pop()
      }
    },
    
    closeAllModals: (state) => {
      state.modals = []
    },
    
    // Toasts
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast-${Date.now()}`
      state.toasts.push({
        ...action.payload,
        id,
        duration: action.payload.duration ?? 5000
      })
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
    
    clearToasts: (state) => {
      state.toasts = []
    },
    
    // Loading
    setGlobalLoading: (state, action: PayloadAction<boolean | { loading: boolean; message?: string }>) => {
      if (typeof action.payload === 'boolean') {
        state.globalLoading = action.payload
        state.loadingMessage = null
      } else {
        state.globalLoading = action.payload.loading
        state.loadingMessage = action.payload.message || null
      }
    },
    
    // Command palette
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen
    },
    
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload
    },
    
    // Shortcuts
    setShortcutsEnabled: (state, action: PayloadAction<boolean>) => {
      state.shortcutsEnabled = action.payload
    },
    
    // Onboarding
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload
    },
    
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboardingStep = action.payload
    },
    
    nextOnboardingStep: (state) => {
      state.onboardingStep += 1
    },
    
    // Preferences
    updatePreferences: (state, action: PayloadAction<Partial<UIState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    
    togglePreference: (state, action: PayloadAction<keyof UIState['preferences']>) => {
      const key = action.payload
      if (typeof state.preferences[key] === 'boolean') {
        (state.preferences[key] as boolean) = !state.preferences[key]
      }
    },
    
    // Notifications
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload
    },
    
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.unreadNotifications = action.payload
    },
    
    incrementUnreadNotifications: (state) => {
      state.unreadNotifications += 1
    },
    
    clearUnreadNotifications: (state) => {
      state.unreadNotifications = 0
    },
    
    // Mobile
    setIsMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload
    },
    
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload
    }
  }
})

export const {
  setTheme,
  setResolvedTheme,
  setSidebarState,
  toggleSidebar,
  setRightPanelOpen,
  setRightPanelTab,
  openModal,
  closeModal,
  closeAllModals,
  addToast,
  removeToast,
  clearToasts,
  setGlobalLoading,
  toggleCommandPalette,
  setCommandPaletteOpen,
  setShortcutsEnabled,
  setOnboardingCompleted,
  setOnboardingStep,
  nextOnboardingStep,
  updatePreferences,
  togglePreference,
  setNotificationsEnabled,
  setUnreadNotifications,
  incrementUnreadNotifications,
  clearUnreadNotifications,
  setIsMobileMenuOpen,
  toggleMobileMenu,
  setIsMobile
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectResolvedTheme = (state: { ui: UIState }) => state.ui.resolvedTheme
export const selectSidebarState = (state: { ui: UIState }) => state.ui.sidebarState
export const selectModals = (state: { ui: UIState }) => state.ui.modals
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading
export const selectPreferences = (state: { ui: UIState }) => state.ui.preferences
export const selectIsMobile = (state: { ui: UIState }) => state.ui.isMobile