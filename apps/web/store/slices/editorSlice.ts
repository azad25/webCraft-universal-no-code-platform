/**
 * Editor State Slice
 * Manages the visual editor state including elements, selection, and history
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

// Types
export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ElementStyle {
  backgroundColor?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  padding?: string
  margin?: string
  borderRadius?: string
  border?: string
  boxShadow?: string
  opacity?: number
  [key: string]: any
}

export interface Element {
  id: string
  type: string
  name: string
  position: Position
  size: Size
  props: Record<string, any>
  style: ElementStyle
  children?: string[]
  parentId?: string | null
  locked: boolean
  visible: boolean
  zIndex: number
}

export interface Page {
  id: string
  name: string
  slug: string
  elements: string[]
  isHomepage: boolean
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

interface HistoryEntry {
  elements: Record<string, Element>
  timestamp: number
}

interface EditorState {
  // Current app
  appId: string | null
  appName: string
  
  // Pages
  pages: Record<string, Page>
  currentPageId: string | null
  
  // Elements
  elements: Record<string, Element>
  
  // Selection
  selectedElementId: string | null
  hoveredElementId: string | null
  multiSelectedIds: string[]
  
  // Clipboard
  clipboard: Element | null
  
  // History (undo/redo)
  history: HistoryEntry[]
  historyIndex: number
  maxHistoryLength: number
  
  // Editor state
  isDragging: boolean
  isResizing: boolean
  isPanning: boolean
  
  // Canvas
  zoom: number
  panOffset: Position
  gridEnabled: boolean
  snapToGrid: boolean
  gridSize: number
  
  // Preview
  previewMode: 'desktop' | 'tablet' | 'mobile'
  isPreviewMode: boolean
  
  // Saving
  isDirty: boolean
  lastSavedAt: string | null
  isSaving: boolean
}

// Initial state
const initialState: EditorState = {
  appId: null,
  appName: 'Untitled App',
  
  pages: {},
  currentPageId: null,
  
  elements: {},
  
  selectedElementId: null,
  hoveredElementId: null,
  multiSelectedIds: [],
  
  clipboard: null,
  
  history: [],
  historyIndex: -1,
  maxHistoryLength: 50,
  
  isDragging: false,
  isResizing: false,
  isPanning: false,
  
  zoom: 100,
  panOffset: { x: 0, y: 0 },
  gridEnabled: true,
  snapToGrid: true,
  gridSize: 8,
  
  previewMode: 'desktop',
  isPreviewMode: false,
  
  isDirty: false,
  lastSavedAt: null,
  isSaving: false
}

// Helper functions
const saveToHistory = (state: EditorState) => {
  const entry: HistoryEntry = {
    elements: JSON.parse(JSON.stringify(state.elements)),
    timestamp: Date.now()
  }
  
  // Remove any future history if we're not at the end
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(entry)
  
  // Limit history length
  if (newHistory.length > state.maxHistoryLength) {
    newHistory.shift()
  }
  
  state.history = newHistory
  state.historyIndex = newHistory.length - 1
  state.isDirty = true
}

const snapToGridValue = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize
}

// Slice
const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // App management
    setApp: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.appId = action.payload.id
      state.appName = action.payload.name
    },
    
    // Page management
    addPage: (state, action: PayloadAction<Omit<Page, 'id' | 'elements'>>) => {
      const id = uuidv4()
      state.pages[id] = {
        ...action.payload,
        id,
        elements: []
      }
      if (!state.currentPageId) {
        state.currentPageId = id
      }
    },
    
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPageId = action.payload
      state.selectedElementId = null
      state.multiSelectedIds = []
    },
    
    updatePage: (state, action: PayloadAction<{ id: string; updates: Partial<Page> }>) => {
      const page = state.pages[action.payload.id]
      if (page) {
        Object.assign(page, action.payload.updates)
        state.isDirty = true
      }
    },
    
    deletePage: (state, action: PayloadAction<string>) => {
      const pageId = action.payload
      const page = state.pages[pageId]
      
      if (page) {
        // Delete all elements on the page
        page.elements.forEach(elementId => {
          delete state.elements[elementId]
        })
        
        delete state.pages[pageId]
        
        // Switch to another page if current was deleted
        if (state.currentPageId === pageId) {
          const remainingPages = Object.keys(state.pages)
          state.currentPageId = remainingPages[0] || null
        }
        
        state.isDirty = true
      }
    },
    
    // Element management
    addElement: (state, action: PayloadAction<Omit<Element, 'id'>>) => {
      saveToHistory(state)
      
      const id = uuidv4()
      const element: Element = {
        ...action.payload,
        id,
        zIndex: Object.keys(state.elements).length + 1
      }
      
      // Snap to grid if enabled
      if (state.snapToGrid) {
        element.position.x = snapToGridValue(element.position.x, state.gridSize)
        element.position.y = snapToGridValue(element.position.y, state.gridSize)
      }
      
      state.elements[id] = element
      
      // Add to current page
      if (state.currentPageId && state.pages[state.currentPageId]) {
        state.pages[state.currentPageId].elements.push(id)
      }
      
      state.selectedElementId = id
    },
    
    updateElement: (state, action: PayloadAction<{ id: string; updates: Partial<Element> }>) => {
      const element = state.elements[action.payload.id]
      if (element) {
        saveToHistory(state)
        Object.assign(element, action.payload.updates)
      }
    },
    
    updateElementStyle: (state, action: PayloadAction<{ id: string; style: Partial<ElementStyle> }>) => {
      const element = state.elements[action.payload.id]
      if (element) {
        saveToHistory(state)
        element.style = { ...element.style, ...action.payload.style }
      }
    },
    
    updateElementProps: (state, action: PayloadAction<{ id: string; props: Record<string, any> }>) => {
      const element = state.elements[action.payload.id]
      if (element) {
        saveToHistory(state)
        element.props = { ...element.props, ...action.payload.props }
      }
    },
    
    moveElement: (state, action: PayloadAction<{ id: string; position: Position }>) => {
      const element = state.elements[action.payload.id]
      if (element && !element.locked) {
        let { x, y } = action.payload.position
        
        if (state.snapToGrid) {
          x = snapToGridValue(x, state.gridSize)
          y = snapToGridValue(y, state.gridSize)
        }
        
        element.position = { x, y }
        state.isDirty = true
      }
    },
    
    resizeElement: (state, action: PayloadAction<{ id: string; size: Size; position?: Position }>) => {
      const element = state.elements[action.payload.id]
      if (element && !element.locked) {
        let { width, height } = action.payload.size
        
        if (state.snapToGrid) {
          width = snapToGridValue(width, state.gridSize)
          height = snapToGridValue(height, state.gridSize)
        }
        
        element.size = { width, height }
        
        if (action.payload.position) {
          let { x, y } = action.payload.position
          if (state.snapToGrid) {
            x = snapToGridValue(x, state.gridSize)
            y = snapToGridValue(y, state.gridSize)
          }
          element.position = { x, y }
        }
        
        state.isDirty = true
      }
    },
    
    deleteElement: (state, action: PayloadAction<string>) => {
      saveToHistory(state)
      
      const elementId = action.payload
      delete state.elements[elementId]
      
      // Remove from page
      Object.values(state.pages).forEach(page => {
        page.elements = page.elements.filter(id => id !== elementId)
      })
      
      if (state.selectedElementId === elementId) {
        state.selectedElementId = null
      }
      
      state.multiSelectedIds = state.multiSelectedIds.filter(id => id !== elementId)
    },
    
    duplicateElement: (state, action: PayloadAction<string>) => {
      const original = state.elements[action.payload]
      if (original) {
        saveToHistory(state)
        
        const id = uuidv4()
        const duplicate: Element = {
          ...JSON.parse(JSON.stringify(original)),
          id,
          name: `${original.name} (copy)`,
          position: {
            x: original.position.x + 20,
            y: original.position.y + 20
          },
          zIndex: Object.keys(state.elements).length + 1
        }
        
        state.elements[id] = duplicate
        
        if (state.currentPageId && state.pages[state.currentPageId]) {
          state.pages[state.currentPageId].elements.push(id)
        }
        
        state.selectedElementId = id
      }
    },
    
    // Selection
    selectElement: (state, action: PayloadAction<string | null>) => {
      state.selectedElementId = action.payload
      state.multiSelectedIds = action.payload ? [action.payload] : []
    },
    
    addToSelection: (state, action: PayloadAction<string>) => {
      if (!state.multiSelectedIds.includes(action.payload)) {
        state.multiSelectedIds.push(action.payload)
      }
    },
    
    removeFromSelection: (state, action: PayloadAction<string>) => {
      state.multiSelectedIds = state.multiSelectedIds.filter(id => id !== action.payload)
      if (state.selectedElementId === action.payload) {
        state.selectedElementId = state.multiSelectedIds[0] || null
      }
    },
    
    clearSelection: (state) => {
      state.selectedElementId = null
      state.multiSelectedIds = []
    },
    
    setHoveredElement: (state, action: PayloadAction<string | null>) => {
      state.hoveredElementId = action.payload
    },
    
    // Clipboard
    copyElement: (state) => {
      if (state.selectedElementId) {
        state.clipboard = JSON.parse(JSON.stringify(state.elements[state.selectedElementId]))
      }
    },
    
    cutElement: (state) => {
      if (state.selectedElementId) {
        state.clipboard = JSON.parse(JSON.stringify(state.elements[state.selectedElementId]))
        delete state.elements[state.selectedElementId]
        
        Object.values(state.pages).forEach(page => {
          page.elements = page.elements.filter(id => id !== state.selectedElementId)
        })
        
        state.selectedElementId = null
        state.isDirty = true
      }
    },
    
    pasteElement: (state) => {
      if (state.clipboard) {
        saveToHistory(state)
        
        const id = uuidv4()
        const pasted: Element = {
          ...JSON.parse(JSON.stringify(state.clipboard)),
          id,
          position: {
            x: state.clipboard.position.x + 20,
            y: state.clipboard.position.y + 20
          },
          zIndex: Object.keys(state.elements).length + 1
        }
        
        state.elements[id] = pasted
        
        if (state.currentPageId && state.pages[state.currentPageId]) {
          state.pages[state.currentPageId].elements.push(id)
        }
        
        state.selectedElementId = id
      }
    },
    
    // History
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--
        state.elements = JSON.parse(JSON.stringify(state.history[state.historyIndex].elements))
        state.selectedElementId = null
        state.isDirty = true
      }
    },
    
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.elements = JSON.parse(JSON.stringify(state.history[state.historyIndex].elements))
        state.selectedElementId = null
        state.isDirty = true
      }
    },
    
    // Canvas controls
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(25, Math.min(200, action.payload))
    },
    
    setPanOffset: (state, action: PayloadAction<Position>) => {
      state.panOffset = action.payload
    },
    
    toggleGrid: (state) => {
      state.gridEnabled = !state.gridEnabled
    },
    
    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid
    },
    
    setGridSize: (state, action: PayloadAction<number>) => {
      state.gridSize = action.payload
    },
    
    // Preview
    setPreviewMode: (state, action: PayloadAction<'desktop' | 'tablet' | 'mobile'>) => {
      state.previewMode = action.payload
    },
    
    togglePreview: (state) => {
      state.isPreviewMode = !state.isPreviewMode
      if (state.isPreviewMode) {
        state.selectedElementId = null
      }
    },
    
    // Drag/Resize state
    setIsDragging: (state, action: PayloadAction<boolean>) => {
      state.isDragging = action.payload
    },
    
    setIsResizing: (state, action: PayloadAction<boolean>) => {
      state.isResizing = action.payload
    },
    
    setIsPanning: (state, action: PayloadAction<boolean>) => {
      state.isPanning = action.payload
    },
    
    // Z-Index management
    bringToFront: (state, action: PayloadAction<string>) => {
      const maxZ = Math.max(...Object.values(state.elements).map(e => e.zIndex))
      const element = state.elements[action.payload]
      if (element) {
        element.zIndex = maxZ + 1
        state.isDirty = true
      }
    },
    
    sendToBack: (state, action: PayloadAction<string>) => {
      const minZ = Math.min(...Object.values(state.elements).map(e => e.zIndex))
      const element = state.elements[action.payload]
      if (element) {
        element.zIndex = minZ - 1
        state.isDirty = true
      }
    },
    
    // Lock/Visibility
    toggleLock: (state, action: PayloadAction<string>) => {
      const element = state.elements[action.payload]
      if (element) {
        element.locked = !element.locked
      }
    },
    
    toggleVisibility: (state, action: PayloadAction<string>) => {
      const element = state.elements[action.payload]
      if (element) {
        element.visible = !element.visible
      }
    },
    
    // Saving
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload
    },
    
    markSaved: (state) => {
      state.isDirty = false
      state.lastSavedAt = new Date().toISOString()
      state.isSaving = false
    },
    
    // Load state
    loadEditorState: (state, action: PayloadAction<{
      elements: Record<string, Element>
      pages: Record<string, Page>
      currentPageId: string | null
    }>) => {
      state.elements = action.payload.elements
      state.pages = action.payload.pages
      state.currentPageId = action.payload.currentPageId
      state.isDirty = false
      state.history = [{
        elements: JSON.parse(JSON.stringify(action.payload.elements)),
        timestamp: Date.now()
      }]
      state.historyIndex = 0
    },
    
    // Reset
    resetEditor: () => initialState
  }
})

export const {
  setApp,
  addPage,
  setCurrentPage,
  updatePage,
  deletePage,
  addElement,
  updateElement,
  updateElementStyle,
  updateElementProps,
  moveElement,
  resizeElement,
  deleteElement,
  duplicateElement,
  selectElement,
  addToSelection,
  removeFromSelection,
  clearSelection,
  setHoveredElement,
  copyElement,
  cutElement,
  pasteElement,
  undo,
  redo,
  setZoom,
  setPanOffset,
  toggleGrid,
  toggleSnapToGrid,
  setGridSize,
  setPreviewMode,
  togglePreview,
  setIsDragging,
  setIsResizing,
  setIsPanning,
  bringToFront,
  sendToBack,
  toggleLock,
  toggleVisibility,
  setSaving,
  markSaved,
  loadEditorState,
  resetEditor
} = editorSlice.actions

export default editorSlice.reducer

// Selectors
export const selectElements = (state: { editor: EditorState }) => state.editor.elements
export const selectSelectedElement = (state: { editor: EditorState }) => 
  state.editor.selectedElementId ? state.editor.elements[state.editor.selectedElementId] : null
export const selectCanUndo = (state: { editor: EditorState }) => state.editor.historyIndex > 0
export const selectCanRedo = (state: { editor: EditorState }) => 
  state.editor.historyIndex < state.editor.history.length - 1
export const selectIsDirty = (state: { editor: EditorState }) => state.editor.isDirty
export const selectZoom = (state: { editor: EditorState }) => state.editor.zoom
export const selectPreviewMode = (state: { editor: EditorState }) => state.editor.previewMode
export const selectIsPreviewMode = (state: { editor: EditorState }) => state.editor.isPreviewMode
export const selectCurrentPage = (state: { editor: EditorState }) => 
  state.editor.currentPageId ? state.editor.pages[state.editor.currentPageId] : null