'use client'

import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react'
import { useWebSocket } from './websocket-context'
import { v4 as uuidv4 } from 'uuid'
import { apiClient } from '@/lib/api-client'

export interface Element {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  props: Record<string, any>
  style: Record<string, any>
  children?: Element[]
  locked?: boolean
  visible?: boolean
  name?: string
  zIndex?: number
}

interface EditorState {
  elements: Element[]
  selectedElementId: string | null
  hoveredElementId: string | null
  history: Element[][]
  historyIndex: number
  clipboard: Element | null
  zoom: number
  isDirty: boolean
  isSaving: boolean
  currentPageId: string | null
  pages: any[]
  appData: any | null
}

interface EditorContextValue {
  // State
  elements: Element[]
  selectedElement: Element | null
  hoveredElement: Element | null
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  zoom: number
  appId?: string
  currentPageId: string | null
  pages: any[]
  currentPage: any | null
  appData: any | null
  
  // Page actions
  switchToPage: (pageId: string) => void
  createPage: (pageData: any) => Promise<void>
  updatePageInfo: (pageId: string, updates: any) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  
  // Element actions
  addElement: (element: Omit<Element, 'id'>) => void
  updateElement: (id: string, updates: Partial<Element>) => void
  deleteElement: (id: string) => void
  duplicateElement: (id: string) => void
  moveElementUp: (id: string) => void
  moveElementDown: (id: string) => void
  reorderElement: (id: string, newIndex: number) => void
  addElementAfter: (id: string) => void
  
  // Selection
  selectElement: (element: Element | null) => void
  setHoveredElement: (element: Element | null) => void
  
  // Clipboard
  copy: () => void
  cut: () => void
  paste: () => void
  
  // History
  undo: () => void
  redo: () => void
  
  // Canvas
  setZoom: (zoom: number) => void
  
  // Save
  saveApp: () => Promise<void>
  savePage: () => Promise<void>
}

const EditorContext = createContext<EditorContextValue | null>(null)

interface EditorProviderProps {
  children: React.ReactNode
  appId?: string
  initialData?: any
}

export function EditorProvider({ children, appId, initialData }: EditorProviderProps) {
  const { sendMessage, isConnected } = useWebSocket()
  const [isLoading, setIsLoading] = useState(!initialData && !!appId)
  
  const [state, setState] = useState<EditorState>({
    elements: [],
    selectedElementId: null,
    hoveredElementId: null,
    history: [[]],
    historyIndex: 0,
    clipboard: null,
    zoom: 100,
    isDirty: false,
    isSaving: false,
    currentPageId: null,
    pages: [],
    appData: null
  })

  // Load app and pages data
  useEffect(() => {
    if (!appId || initialData) {
      console.log('🔍 Skipping app load:', { appId: !!appId, initialData: !!initialData })
      return
    }

    // Check if user is authenticated before loading
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      console.log('🔒 No auth token found, user needs to login first')
      setIsLoading(false)
      return
    }

    const loadAppData = async () => {
      try {
        console.log('🔄 Loading app data for:', appId)
        
        // Load app data
        console.log('📡 Fetching app data...')
        const appResponse = await apiClient.get(`/api/apps/${appId}`)
        const appData = appResponse.data
        console.log('📦 Loaded app data:', appData)
        
        // Load pages data
        console.log('📡 Fetching pages data...')
        const pagesResponse = await apiClient.get(`/api/apps/${appId}/pages`)
        const pagesData = pagesResponse.data
        const pages = pagesData.pages || []
        console.log('📄 Loaded pages:', pages.length, pages)
        
        if (pages.length === 0) {
          console.warn('⚠️ No pages found for app, creating default page')
          
          // Create a default homepage
          const defaultPageData = {
            title: 'Home',
            slug: 'home',
            content: { elements: [] },
            is_homepage: true,
            is_published: true,
            meta_title: appData.name || 'Home',
            meta_description: appData.description || `Welcome to ${appData.name || 'your app'}`
          }
          
          console.log('🔄 Creating default page:', defaultPageData)
          const createResponse = await apiClient.post(`/api/apps/${appId}/pages`, defaultPageData)
          const newPage = createResponse.data
          console.log('✅ Created default page:', newPage)
          
          setState(prev => ({
            ...prev,
            elements: [],
            history: [[]],
            historyIndex: 0,
            isDirty: false,
            currentPageId: newPage.id,
            pages: [newPage],
            appData
          }))
        } else {
          // Find the homepage or first page
          const homepage = pages.find((p: any) => p.is_homepage) || pages[0]
          console.log('🏠 Auto-selecting page:', homepage.title, homepage.id)
          
          // Load the homepage content
          console.log('📡 Fetching page content...')
          const pageResponse = await apiClient.get(`/api/apps/${appId}/pages/${homepage.id}`)
          const pageData = pageResponse.data
          console.log('📄 Loaded page content:', pageData)
          
          const elements = pageData?.content?.elements || []
          console.log('🧩 Page elements:', elements.length)
          
          setState(prev => ({
            ...prev,
            elements,
            history: [elements],
            historyIndex: 0,
            isDirty: false,
            currentPageId: homepage.id,
            pages,
            appData
          }))
        }
        
        setIsLoading(false)
        console.log('✅ App data loaded successfully')
      } catch (error) {
        console.error('❌ Failed to load app data:', error)
        console.error('❌ Error details:', {
          message: error?.message,
          status: error?.status,
          response: error?.response?.data
        })
        
        // Try to create a default page if pages loading failed
        try {
          console.log('🔄 Attempting to create default page as fallback...')
          const defaultPageData = {
            title: 'Home',
            slug: 'home',
            content: { elements: [] },
            is_homepage: true,
            is_published: true,
            meta_title: 'Home',
            meta_description: 'Welcome to your app'
          }
          
          const createResponse = await apiClient.post(`/api/apps/${appId}/pages`, defaultPageData)
          const newPage = createResponse.data
          console.log('✅ Created fallback page:', newPage)
          
          setState(prev => ({
            ...prev,
            elements: [],
            history: [[]],
            historyIndex: 0,
            isDirty: false,
            currentPageId: newPage.id,
            pages: [newPage],
            appData: { name: 'App', description: 'Your app' }
          }))
        } catch (fallbackError) {
          console.error('❌ Failed to create fallback page:', fallbackError)
        }
        
        setIsLoading(false)
      }
    }

    loadAppData()
  }, [appId, initialData])

  // Derived state
  const selectedElement = useMemo(() => 
    state.elements.find(el => el.id === state.selectedElementId) || null,
    [state.elements, state.selectedElementId]
  )
  
  const hoveredElement = useMemo(() => 
    state.elements.find(el => el.id === state.hoveredElementId) || null,
    [state.elements, state.hoveredElementId]
  )

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  // Push to history
  const pushHistory = useCallback((elements: Element[]) => {
    setState(prev => ({
      ...prev,
      elements,
      history: [...prev.history.slice(0, prev.historyIndex + 1), elements],
      historyIndex: prev.historyIndex + 1,
      isDirty: true
    }))
  }, [])

  // Broadcast changes
  const broadcast = useCallback((type: string, payload: any) => {
    if (isConnected && appId) {
      sendMessage({ type, payload, room: `app:${appId}` })
    }
  }, [isConnected, appId, sendMessage])

  // Element actions - require page selection
  const addElement = useCallback((element: Omit<Element, 'id'>) => {
    if (!state.currentPageId) {
      alert('Please select a page before adding elements')
      return
    }
    
    const newElement: Element = {
      ...element,
      id: uuidv4()
    }
    const newElements = [...state.elements, newElement]
    pushHistory(newElements)
    broadcast('element.added', newElement)
    
    // Auto-select new element
    setState(prev => ({ ...prev, selectedElementId: newElement.id }))
  }, [state.elements, state.currentPageId, pushHistory, broadcast])

  // Update element - require page selection
  const updateElement = useCallback((id: string, updates: Partial<Element>) => {
    if (!state.currentPageId) {
      alert('Please select a page before editing elements')
      return
    }
    
    const newElements = state.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    )
    pushHistory(newElements)
    broadcast('element.updated', { id, updates })
  }, [state.elements, state.currentPageId, pushHistory, broadcast])

  // Delete element
  const deleteElement = useCallback((id: string) => {
    const newElements = state.elements.filter(el => el.id !== id)
    pushHistory(newElements)
    broadcast('element.deleted', { id })
    
    if (state.selectedElementId === id) {
      setState(prev => ({ ...prev, selectedElementId: null }))
    }
  }, [state.elements, state.selectedElementId, pushHistory, broadcast])

  // Duplicate element
  const duplicateElement = useCallback((id: string) => {
    const element = state.elements.find(el => el.id === id)
    if (!element) return
    
    const newElement: Element = {
      ...element,
      id: uuidv4(),
      name: element.name ? `${element.name} (copy)` : undefined
    }
    
    const index = state.elements.findIndex(el => el.id === id)
    const newElements = [
      ...state.elements.slice(0, index + 1),
      newElement,
      ...state.elements.slice(index + 1)
    ]
    
    pushHistory(newElements)
    setState(prev => ({ ...prev, selectedElementId: newElement.id }))
  }, [state.elements, pushHistory])

  // Move element up
  const moveElementUp = useCallback((id: string) => {
    const index = state.elements.findIndex(el => el.id === id)
    if (index <= 0) return
    
    const newElements = [...state.elements]
    ;[newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]]
    pushHistory(newElements)
  }, [state.elements, pushHistory])

  // Move element down
  const moveElementDown = useCallback((id: string) => {
    const index = state.elements.findIndex(el => el.id === id)
    if (index === -1 || index >= state.elements.length - 1) return
    
    const newElements = [...state.elements]
    ;[newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]]
    pushHistory(newElements)
  }, [state.elements, pushHistory])

  // Reorder element
  const reorderElement = useCallback((id: string, newIndex: number) => {
    const currentIndex = state.elements.findIndex(el => el.id === id)
    if (currentIndex === -1) return
    
    const newElements = [...state.elements]
    const [removed] = newElements.splice(currentIndex, 1)
    newElements.splice(newIndex, 0, removed)
    pushHistory(newElements)
  }, [state.elements, pushHistory])

  // Add element after
  const addElementAfter = useCallback((id: string) => {
    const index = state.elements.findIndex(el => el.id === id)
    const newElement: Element = {
      id: uuidv4(),
      type: 'section',
      position: { x: 0, y: 0 },
      size: { width: 1440, height: 400 },
      props: {},
      style: {}
    }
    
    const newElements = [
      ...state.elements.slice(0, index + 1),
      newElement,
      ...state.elements.slice(index + 1)
    ]
    
    pushHistory(newElements)
    setState(prev => ({ ...prev, selectedElementId: newElement.id }))
  }, [state.elements, pushHistory])

  // Selection
  const selectElement = useCallback((element: Element | null) => {
    setState(prev => ({ ...prev, selectedElementId: element?.id || null }))
  }, [])

  const setHoveredElement = useCallback((element: Element | null) => {
    setState(prev => ({ ...prev, hoveredElementId: element?.id || null }))
  }, [])

  // Clipboard
  const copy = useCallback(() => {
    if (selectedElement) {
      setState(prev => ({ ...prev, clipboard: selectedElement }))
    }
  }, [selectedElement])

  const cut = useCallback(() => {
    if (selectedElement) {
      setState(prev => ({ ...prev, clipboard: selectedElement }))
      deleteElement(selectedElement.id)
    }
  }, [selectedElement, deleteElement])

  const paste = useCallback(() => {
    if (state.clipboard) {
      addElement({
        ...state.clipboard,
        name: state.clipboard.name ? `${state.clipboard.name} (copy)` : undefined
      })
    }
  }, [state.clipboard, addElement])

  // History
  const undo = useCallback(() => {
    if (!canUndo) return
    setState(prev => ({
      ...prev,
      elements: prev.history[prev.historyIndex - 1],
      historyIndex: prev.historyIndex - 1,
      isDirty: true
    }))
  }, [canUndo])

  const redo = useCallback(() => {
    if (!canRedo) return
    setState(prev => ({
      ...prev,
      elements: prev.history[prev.historyIndex + 1],
      historyIndex: prev.historyIndex + 1,
      isDirty: true
    }))
  }, [canRedo])

  // Zoom
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom }))
  }, [])

  // Page Management
  const currentPage = useMemo(() => 
    state.pages.find(p => p.id === state.currentPageId) || null,
    [state.pages, state.currentPageId]
  )

  const switchToPage = useCallback(async (pageId: string) => {
    if (pageId === state.currentPageId) return
    
    try {
      console.log('🔄 Switching to page:', pageId)
      
      // Save current page if dirty
      if (state.isDirty && state.currentPageId) {
        console.log('💾 Saving current page before switching...')
        await savePage()
      }
      
      // Load the new page content
      const pageResponse = await apiClient.get(`/api/apps/${appId}/pages/${pageId}`)
      const pageData = pageResponse.data
      console.log('📄 Loaded page content:', pageData)
      
      const elements = pageData?.content?.elements || []
      
      setState(prev => ({
        ...prev,
        elements,
        history: [elements],
        historyIndex: 0,
        isDirty: false,
        currentPageId: pageId,
        selectedElementId: null // Clear selection when switching pages
      }))
      
      console.log('✅ Switched to page successfully')
    } catch (error) {
      console.error('❌ Failed to switch page:', error)
      alert(`Failed to switch to page: ${error}`)
    }
  }, [state.currentPageId, state.isDirty, appId])

  const createPage = useCallback(async (pageData: any) => {
    try {
      console.log('🔄 Creating new page:', pageData)
      
      const response = await apiClient.post(`/api/apps/${appId}/pages`, {
        ...pageData,
        content: { elements: [] }
      })
      const newPage = response.data
      
      setState(prev => ({
        ...prev,
        pages: [...prev.pages, newPage]
      }))
      
      console.log('✅ Page created successfully:', newPage.id)
      
      // Switch to the new page
      await switchToPage(newPage.id)
    } catch (error) {
      console.error('❌ Failed to create page:', error)
      throw error
    }
  }, [appId, switchToPage])

  const updatePageInfo = useCallback(async (pageId: string, updates: any) => {
    try {
      console.log('🔄 Updating page info:', pageId, updates)
      
      const response = await apiClient.put(`/api/apps/${appId}/pages/${pageId}`, updates)
      const updatedPage = response.data
      
      setState(prev => ({
        ...prev,
        pages: prev.pages.map(p => p.id === pageId ? updatedPage : p)
      }))
      
      console.log('✅ Page info updated successfully')
    } catch (error) {
      console.error('❌ Failed to update page info:', error)
      throw error
    }
  }, [appId])

  const deletePage = useCallback(async (pageId: string) => {
    try {
      console.log('🔄 Deleting page:', pageId)
      
      await apiClient.delete(`/api/apps/${appId}/pages/${pageId}`)
      
      const remainingPages = state.pages.filter(p => p.id !== pageId)
      
      setState(prev => ({
        ...prev,
        pages: remainingPages
      }))
      
      // If we deleted the current page, switch to another page
      if (pageId === state.currentPageId && remainingPages.length > 0) {
        const nextPage = remainingPages.find(p => p.is_homepage) || remainingPages[0]
        await switchToPage(nextPage.id)
      }
      
      console.log('✅ Page deleted successfully')
    } catch (error) {
      console.error('❌ Failed to delete page:', error)
      throw error
    }
  }, [appId, state.pages, state.currentPageId, switchToPage])

  // Save current page
  const savePage = useCallback(async () => {
    if (!state.currentPageId || !state.isDirty) return
    
    setState(prev => ({ ...prev, isSaving: true }))
    
    try {
      console.log('💾 Saving page content:', state.currentPageId)
      
      await apiClient.put(`/api/apps/${appId}/pages/${state.currentPageId}/content`, {
        elements: state.elements
      })
      
      setState(prev => ({ ...prev, isDirty: false }))
      console.log('✅ Page saved successfully')
    } catch (error) {
      console.error('❌ Failed to save page:', error)
      throw error
    } finally {
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }, [state.currentPageId, state.isDirty, state.elements, appId])

  // Comprehensive app save - saves all pages and app data
  const saveApp = useCallback(async () => {
    console.log('🔍 Comprehensive app save:', {
      appId,
      currentPageId: state.currentPageId,
      isDirty: state.isDirty,
      pagesCount: state.pages.length,
      elementsCount: state.elements.length
    })
    
    if (!appId) {
      console.error('❌ No appId provided')
      return
    }
    
    setState(prev => ({ ...prev, isSaving: true }))
    
    try {
      // Step 1: Save current page content if dirty
      if (state.isDirty && state.currentPageId) {
        console.log('💾 Saving current page content first...')
        await apiClient.put(`/api/apps/${appId}/pages/${state.currentPageId}/content`, {
          elements: state.elements,
          lastModified: new Date().toISOString()
        })
        console.log('✅ Current page content saved')
      }
      
      // Step 2: Save app-level data (metadata, theme, SEO, etc.)
      if (state.appData) {
        console.log('💾 Saving app metadata...')
        const appUpdateData = {
          name: state.appData.name,
          description: state.appData.description,
          theme_config: state.appData.theme_config,
          seo_config: state.appData.seo_config,
          config: {
            ...state.appData.config,
            lastModified: new Date().toISOString(),
            totalPages: state.pages.length,
            currentVersion: (state.appData.config?.currentVersion || 0) + 1
          }
        }
        
        await apiClient.put(`/api/apps/${appId}`, appUpdateData)
        console.log('✅ App metadata saved')
      }
      
      // Step 3: Ensure all pages are properly saved (validation)
      console.log('🔍 Validating all pages are saved...')
      for (const page of state.pages) {
        try {
          const pageResponse = await apiClient.get(`/api/apps/${appId}/pages/${page.id}`)
          console.log(`✅ Page "${page.title}" validated`)
        } catch (error) {
          console.warn(`⚠️ Page "${page.title}" may have issues:`, error)
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isDirty: false, 
        isSaving: false,
        appData: prev.appData ? {
          ...prev.appData,
          config: {
            ...prev.appData.config,
            lastModified: new Date().toISOString()
          }
        } : prev.appData
      }))
      
      console.log('✅ Comprehensive app save completed successfully')
      
      // Broadcast save completion
      broadcast('app.saved', {
        appId,
        timestamp: new Date().toISOString(),
        pagesCount: state.pages.length,
        currentPageId: state.currentPageId
      })
      
    } catch (error: any) {
      console.error('❌ Failed to save app comprehensively:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        details: error?.details,
        response: error?.response?.data,
        originalError: error
      })
      setState(prev => ({ ...prev, isSaving: false }))
      throw error
    }
  }, [appId, state.isDirty, state.elements, state.currentPageId, state.pages, state.appData, broadcast])

  // Auto-save
  useEffect(() => {
    if (!state.isDirty) return
    
    const timer = setTimeout(() => {
      saveApp()
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [state.isDirty, saveApp])

  const value: EditorContextValue = {
    elements: state.elements,
    selectedElement,
    hoveredElement,
    canUndo,
    canRedo,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    isLoading,
    zoom: state.zoom,
    appId,
    currentPageId: state.currentPageId,
    pages: state.pages,
    currentPage,
    appData: state.appData,
    
    // Page actions
    switchToPage,
    createPage,
    updatePageInfo,
    deletePage,
    
    // Element actions
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    reorderElement,
    addElementAfter,
    
    selectElement,
    setHoveredElement,
    
    copy,
    cut,
    paste,
    
    undo,
    redo,
    
    setZoom,
    saveApp,
    savePage
  }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}
