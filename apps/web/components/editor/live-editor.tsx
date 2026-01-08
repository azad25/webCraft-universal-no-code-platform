'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'

import { EditorSidebar } from './editor-sidebar'
import { EditorCanvas } from './editor-canvas'
import { EditorToolbar } from './editor-toolbar'
import { PropertiesPanel } from './properties-panel'
import { LayersPanel } from './layers-panel'
import { AIAssistant } from './ai-assistant'
import { FloatingToolbar } from './floating-toolbar'
import { InlineEditor } from './inline-editor'
import { ResizeHandles } from './resize-handles'
import { EditorProvider, useEditor } from '@/contexts/editor-context'
import { WebSocketProvider } from '@/contexts/websocket-context'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  Settings,
  Layers,
  Maximize2,
  Minimize2,
  Eye,
  ExternalLink
} from 'lucide-react'

interface LiveEditorProps {
  appId: string
  initialData?: any
}

function EditorContent({ appId }: { appId: string }) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState('properties')
  const [showAI, setShowAI] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [inlineEditor, setInlineEditor] = useState<{
    element: any
    position: { x: number; y: number }
  } | null>(null)
  const [resizingElement, setResizingElement] = useState<string | null>(null)

  const {
    selectedElement,
    canUndo,
    canRedo,
    undo,
    redo,
    saveApp,
    isSaving,
    isDirty,
    isLoading,
    deleteElement,
    duplicateElement,
    selectElement,
    addElement,
    updateElement
  } = useEditor()

  // Handle inline editor
  const handleOpenInlineEditor = useCallback((element: any, position?: { x: number; y: number }) => {
    if (!position) {
      // Calculate position from element
      const elementNode = document.querySelector(`[data-element-id="${element.id}"]`)
      if (elementNode) {
        const rect = elementNode.getBoundingClientRect()
        position = {
          x: rect.left + rect.width / 2 - 160, // Center the 320px wide editor
          y: rect.top - 10 // Position above element
        }
      } else {
        position = { x: window.innerWidth / 2 - 160, y: 100 }
      }
    }
    
    setInlineEditor({ element, position })
  }, [])

  const handleCloseInlineEditor = useCallback(() => {
    setInlineEditor(null)
  }, [])

  const handleUpdateElement = useCallback((updates: any) => {
    if (inlineEditor) {
      updateElement(inlineEditor.element.id, updates)
    }
  }, [inlineEditor, updateElement])

  const handleStartResize = useCallback((elementId: string) => {
    setResizingElement(elementId)
  }, [])

  const handleElementResize = useCallback((elementId: string, newSize: { width: number; height: number }) => {
    updateElement(elementId, { size: newSize })
  }, [updateElement])
  // Handle adding elements from sidebar
  const handleAddElement = useCallback((elementData: any) => {
    // Handle different data structures from sidebar
    let elementConfig
    if (elementData.element) {
      // From Elements tab (complex structure)
      elementConfig = {
        type: elementData.element.type,
        position: { x: 0, y: 0 },
        size: { 
          width: 1440, // Full width by default
          height: elementData.element.defaultHeight || 400 
        },
        props: elementData.element.props || {},
        style: elementData.element.style || {},
        children: []
      }
    } else {
      // From direct call or simple structure
      elementConfig = {
        type: elementData.type,
        position: { x: 0, y: 0 },
        size: { 
          width: 1440, // Full width by default
          height: elementData.defaultHeight || 200 
        },
        props: elementData.props || {},
        style: elementData.style || {},
        children: []
      }
    }
    
    addElement(elementConfig)
  }, [addElement])

  // Enhanced save function with user feedback
  const handleSave = useCallback(async () => {
    try {
      await saveApp()
      console.log('✅ App saved successfully')
    } catch (error) {
      console.error('❌ Failed to save app:', error)
    }
  }, [saveApp])

  // Generate and open live preview
  const handleLivePreview = useCallback(async () => {
    if (isGeneratingPreview) return

    setIsGeneratingPreview(true)
    try {
      // Save first to ensure latest changes are included
      if (isDirty) {
        await saveApp()
      }

      // Generate preview
      const response = await fetch(`/api/v1/apps/${appId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'dev-bypass-token'}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const previewUrl = `${window.location.origin}/preview/${data.token}?device=${previewMode}`
        window.open(previewUrl, '_blank', 'width=1200,height=800')
        console.log('✅ Preview generated:', previewUrl)
      } else {
        console.error('❌ Failed to generate preview:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Preview generation error:', error)
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [appId, saveApp, isDirty, isGeneratingPreview, previewMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or contentEditable
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case '\\':
            e.preventDefault()
            setLeftSidebarOpen(!leftSidebarOpen)
            break
          case 'd':
            e.preventDefault()
            if (selectedElement) {
              duplicateElement(selectedElement.id)
            }
            break
        }
      }

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault()
        deleteElement(selectedElement.id)
      }

      // Toggle preview with P
      if (e.key === 'p' && !modifier) {
        e.preventDefault()
        setShowPreview(!showPreview)
      }

      // Live preview with Shift+P
      if (e.key === 'P' && e.shiftKey && !modifier) {
        e.preventDefault()
        handleLivePreview()
      }

      // Escape to deselect or close AI
      if (e.key === 'Escape') {
        if (showAI) {
          setShowAI(false)
        } else if (selectedElement) {
          selectElement(null)
        }
      }

      // Enter to start editing selected element
      if (e.key === 'Enter' && selectedElement && !showPreview) {
        e.preventDefault()
        // Trigger inline editing mode
        const elementNode = document.querySelector(`[data-element-id="${selectedElement.id}"]`)
        if (elementNode) {
          const editableElement = elementNode.querySelector('[contenteditable]')
          if (editableElement) {
            (editableElement as HTMLElement).focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleLivePreview, undo, redo, showPreview, leftSidebarOpen, selectedElement, showAI, deleteElement, duplicateElement, selectElement])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Show loading state while app data is being loaded
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Top Toolbar */}
      <EditorToolbar
        appId={appId}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={isDirty}
        onToggleAI={() => setShowAI(!showAI)}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Widget Library */}
        <AnimatePresence mode="wait">
          {leftSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-r bg-background overflow-y-auto overflow-x-hidden"
            >
              <EditorSidebar onAddElement={handleAddElement} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <EditorCanvas
            previewMode={previewMode}
            showPreview={showPreview}
            onOpenInlineEditor={handleOpenInlineEditor}
            onStartResize={handleStartResize}
          />

          {/* Floating Actions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLivePreview}
              disabled={isGeneratingPreview}
              className="shadow-lg"
            >
              {isGeneratingPreview ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isGeneratingPreview ? 'Generating...' : 'Live Preview'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              className="shadow-lg"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Right Panel */}
        <AnimatePresence mode="wait">
          {rightSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-l bg-background overflow-y-auto overflow-x-hidden"
            >
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-1 flex-shrink-0">
                  <TabsTrigger
                    value="properties"
                    className="flex items-center gap-2 data-[state=active]:bg-accent"
                  >
                    <Settings className="w-4 h-4" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger
                    value="layers"
                    className="flex items-center gap-2 data-[state=active]:bg-accent"
                  >
                    <Layers className="w-4 h-4" />
                    Layers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
                  <PropertiesPanel selectedElement={selectedElement} />
                </TabsContent>

                <TabsContent value="layers" className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
                  <LayersPanel app={null} />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute right-0 top-0 bottom-0 w-96 border-l bg-background shadow-2xl z-50"
            >
              <AIAssistant app={null} onClose={() => setShowAI(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toolbar */}
        {selectedElement && !showPreview && (
          <FloatingToolbar 
            selectedElement={selectedElement}
            onStartEditing={() => handleOpenInlineEditor(selectedElement)}
          />
        )}

        {/* Inline Editor */}
        <AnimatePresence>
          {inlineEditor && (
            <InlineEditor
              element={inlineEditor.element}
              position={inlineEditor.position}
              onClose={handleCloseInlineEditor}
              onUpdate={handleUpdateElement}
              onDelete={() => {
                deleteElement(inlineEditor.element.id)
                handleCloseInlineEditor()
              }}
              onDuplicate={() => {
                duplicateElement(inlineEditor.element.id)
                handleCloseInlineEditor()
              }}
              onStartResize={() => {
                handleStartResize(inlineEditor.element.id)
                handleCloseInlineEditor()
              }}
            />
          )}
        </AnimatePresence>

        {/* Resize Handles */}
        {selectedElement && resizingElement === selectedElement.id && !showPreview && (
          <div className="fixed inset-0 pointer-events-none z-[9998]">
            <ResizeHandles
              element={selectedElement}
              isSelected={true}
              onResize={(newSize) => handleElementResize(selectedElement.id, newSize)}
              onResizeEnd={() => setResizingElement(null)}
              minWidth={50}
              minHeight={20}
              showGrid={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function LiveEditor({ appId, initialData }: LiveEditorProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <WebSocketProvider>
        <EditorProvider appId={appId} initialData={initialData}>
          <EditorContent appId={appId} />
        </EditorProvider>
      </WebSocketProvider>
    </DndProvider>
  )
}
