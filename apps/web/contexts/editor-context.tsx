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
    elements: initialData?.config?.elements || initialData?.elements || [],
    selectedElementId: null,
    hoveredElementId: null,
    history: [initialData?.config?.elements || initialData?.elements || []],
    historyIndex: 0,
    clipboard: null,
    zoom: 100,
    isDirty: false,
    isSaving: false
  })

  // Load app data if not provided as initialData
  useEffect(() => {
    if (!appId || initialData || !isLoading) return

    const loadAppData = async () => {
      try {
        console.log('🔄 Loading app data for:', appId)
        const response = await apiClient.get(`/api/apps/${appId}`)
        const appData = response.data
        
        console.log('📦 Loaded app data:', appData)
        
        const elements = appData?.config?.elements || []
        setState(prev => ({
          ...prev,
          elements,
          history: [elements],
          historyIndex: 0,
          isDirty: false
        }))
        
        setIsLoading(false)
        console.log('✅ App data loaded successfully')
      } catch (error) {
        console.error('❌ Failed to load app data:', error)
        setIsLoading(false)
      }
    }

    loadAppData()
  }, [appId, initialData, isLoading])

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

  // Add element
  const addElement = useCallback((element: Omit<Element, 'id'>) => {
    const newElement: Element = {
      ...element,
      id: uuidv4()
    }
    const newElements = [...state.elements, newElement]
    pushHistory(newElements)
    broadcast('element.added', newElement)
    
    // Auto-select new element
    setState(prev => ({ ...prev, selectedElementId: newElement.id }))
  }, [state.elements, pushHistory, broadcast])

  // Update element
  const updateElement = useCallback((id: string, updates: Partial<Element>) => {
    const newElements = state.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    )
    pushHistory(newElements)
    broadcast('element.updated', { id, updates })
  }, [state.elements, pushHistory, broadcast])

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

  // Save
  const saveApp = useCallback(async () => {
    console.log('🔍 Save attempt:', {
      appId,
      isDirty: state.isDirty,
      elementsCount: state.elements.length
    })
    
    if (!appId) {
      console.error('❌ No appId provided')
      return
    }
    
    if (!state.isDirty) {
      console.log('⏭️ No changes to save')
      return
    }
    
    setState(prev => ({ ...prev, isSaving: true }))
    
    try {
      const payload = { 
        config: { 
          elements: state.elements,
          lastModified: new Date().toISOString()
        } 
      }
      
      console.log('💾 Saving app:', {
        appId,
        elementsCount: state.elements.length,
        payload
      })
      
      const response = await apiClient.put(`/api/apps/${appId}`, payload)
      
      console.log('📡 Save response:', response.data)
      setState(prev => ({ ...prev, isDirty: false, isSaving: false }))
      console.log('✅ App saved successfully')
    } catch (error: any) {
      console.error('❌ Failed to save app:', {
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
  }, [appId, state.isDirty, state.elements])

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
    saveApp
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
