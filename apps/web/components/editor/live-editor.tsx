'use client'

import { useState, useEffect, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { m, AnimatePresence } from 'framer-motion'
import { getAuthToken } from '@/lib/dev-auth'

import { EditorSidebar } from './editor-sidebar'
import { EditorCanvas } from './editor-canvas'
import { EditorToolbar } from './editor-toolbar'
import { PropertiesPanel } from './properties-panel'
import { LayersPanel } from './layers-panel'
import { AIAssistant } from './ai-assistant'
import { FloatingToolbar } from './floating-toolbar'
import { InlineEditor } from './inline-editor'
import { ResizeHandles } from './resize-handles'
import { PageManager } from './page-manager'
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
  ExternalLink,
  FileText
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
  const [showGrid, setShowGrid] = useState(true) // Enable grid by default for Figma-like experience

  const {
    selectedElement,
    canUndo,
    canRedo,
    undo,
    redo,
    saveApp,
    savePage,
    isSaving,
    isDirty,
    isLoading,
    deleteElement,
    duplicateElement,
    selectElement,
    addElement,
    updateElement,
    currentPage,
    currentPageId,
    pages,
    switchToPage,
    createPage
  } = useEditor()

  // Handle inline editor - Enhanced for Figma-like experience
  const handleOpenInlineEditor = useCallback((element: any, position?: { x: number; y: number }) => {
    if (!position) {
      // Calculate position from element
      const elementNode = document.querySelector(`[data-element-id="${element.id}"]`)
      if (elementNode) {
        const rect = elementNode.getBoundingClientRect()
        position = {
          x: Math.max(10, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 410)), // Center the 400px wide editor
          y: Math.max(10, rect.top - 10) // Position above element with safe margin
        }
      } else {
        position = { x: window.innerWidth / 2 - 200, y: 100 }
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
  // Handle adding elements from sidebar - Fixed for absolute positioning
  const handleAddElement = useCallback((elementData: any) => {
    if (!currentPageId) {
      alert('Please select a page before adding elements')
      return
    }
    
    // Calculate a random position to avoid overlapping
    const randomX = Math.floor(Math.random() * 300) + 50
    const randomY = Math.floor(Math.random() * 200) + 50
    
    // Handle different data structures from sidebar
    let elementConfig
    if (elementData.element) {
      // From Elements tab (complex structure)
      elementConfig = {
        type: elementData.element.type,
        position: { x: randomX, y: randomY }, // Random position to avoid overlap
        size: { 
          width: elementData.element.defaultWidth || 300, 
          height: elementData.element.defaultHeight || 150 
        },
        props: elementData.element.props || {},
        style: {
          ...elementData.element.style,
          // Force absolute positioning for Figma-like behavior
          position: 'absolute',
          zIndex: 1
        },
        children: [],
        // Enhanced capabilities for Figma-like editing
        capabilities: {
          resizable: true,
          movable: true,
          editable: true,
          deletable: true,
          duplicatable: true,
          styleable: true
        },
        // Force position mode for new elements
        dragMode: 'position'
      }
    } else {
      // From direct call or simple structure
      elementConfig = {
        type: elementData.type,
        position: { x: randomX, y: randomY }, // Random position
        size: { 
          width: elementData.defaultWidth || 300, 
          height: elementData.defaultHeight || 150 
        },
        props: elementData.props || {},
        style: {
          ...elementData.style,
          // Force absolute positioning for Figma-like behavior
          position: 'absolute',
          zIndex: 1
        },
        children: [],
        // Enhanced capabilities
        capabilities: {
          resizable: true,
          movable: true,
          editable: true,
          deletable: true,
          duplicatable: true,
          styleable: true
        },
        // Force position mode for new elements
        dragMode: 'position'
      }
    }
    
    addElement(elementConfig)
  }, [addElement, currentPageId])

  // Enhanced save function with user feedback
  const handleSave = useCallback(async () => {
    try {
      console.log(`💾 Saving current page...`)
      await savePage()
      console.log('✅ Page saved successfully')
    } catch (error) {
      console.error('❌ Failed to save page:', error)
      alert(`Failed to save page: ${error}`)
    }
  }, [savePage])

  // Generate and open live preview
  const handleLivePreview = useCallback(async () => {
    if (isGeneratingPreview) return

    setIsGeneratingPreview(true)
    try {
      console.log(`🔄 Generating preview for app ${appId}`)
      
      // Save first to ensure latest changes are included
      if (isDirty) {
        console.log('💾 Saving page before preview...')
        await savePage()
      }

      // Generate preview
      const token = getAuthToken()
      console.log(`🔑 Using auth token: ${token.substring(0, 20)}...`)
      
      const response = await fetch(`/api/apps/${appId}/preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log(`📡 Preview API response: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Preview data:', data)
        
        const previewUrl = data.preview_url || `${window.location.origin}/preview/${data.token}?device=${previewMode}&page=${currentPageId}`
        window.open(previewUrl, '_blank', 'width=1200,height=800')
        console.log('✅ Preview generated:', previewUrl)
      } else {
        const errorData = await response.text()
        console.error('❌ Failed to generate preview:', response.status, response.statusText)
        console.error('❌ Error details:', errorData)
        
        // Show user-friendly error
        alert(`Failed to generate preview: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Preview generation error:', error)
      alert(`Preview generation failed: ${error}`)
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [appId, savePage, isDirty, isGeneratingPreview, previewMode, currentPageId])

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

      // Device switching shortcuts
      if (!modifier) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            setPreviewMode('desktop')
            break
          case '2':
            e.preventDefault()
            setPreviewMode('tablet')
            break
          case '3':
            e.preventDefault()
            setPreviewMode('mobile')
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

      // Enter to start editing selected element - Enhanced for all widget types
      if (e.key === 'Enter' && selectedElement && !showPreview) {
        // Don't interfere with contentEditable elements
        if (
          e.target instanceof HTMLElement && 
          (e.target.contentEditable === 'true' || e.target.closest('[contenteditable="true"]'))
        ) {
          return
        }
        
        e.preventDefault()
        
        // Open inline editor for comprehensive editing
        const elementNode = document.querySelector(`[data-element-id="${selectedElement.id}"]`)
        if (elementNode) {
          const rect = elementNode.getBoundingClientRect()
          const position = {
            x: Math.max(10, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 410)),
            y: Math.max(10, rect.top - 10)
          }
          handleOpenInlineEditor(selectedElement, position)
        } else {
          handleOpenInlineEditor(selectedElement)
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

  // Show page selection required state
  if (!currentPageId && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Select a Page to Edit</h2>
          <p className="text-muted-foreground mb-6">
            You need to select a page before you can start adding elements and designing your app.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Available Pages:</strong> {pages.length}
            </p>
            {pages.length > 0 ? (
              <div className="mt-2 space-y-1">
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => switchToPage(page.id)}
                    className="block w-full text-left px-3 py-2 text-sm bg-white border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
                  >
                    {page.title} {page.is_homepage && '🏠'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-red-600 mb-3">
                  No pages found. Let's create a homepage for you.
                </p>
                <Button 
                  onClick={async () => {
                    try {
                      await createPage({
                        title: 'Home',
                        slug: 'home',
                        content: { elements: [] },
                        is_homepage: true,
                        is_published: true,
                        meta_title: 'Home',
                        meta_description: 'Welcome to your app'
                      })
                    } catch (error) {
                      console.error('Failed to create homepage:', error)
                      alert('Failed to create homepage. Please try again.')
                    }
                  }}
                  className="w-full"
                >
                  Create Homepage
                </Button>
              </div>
            )}
          </div>
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
        onLivePreview={handleLivePreview}
        isGeneratingPreview={isGeneratingPreview}
        currentPage={currentPage}
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
        {/* Left Sidebar - Enhanced Builder Panel */}
        <AnimatePresence mode="wait">
          {leftSidebarOpen && (
            <m.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-r bg-background overflow-y-auto overflow-x-hidden"
            >
              <EditorSidebar 
                appId={appId}
                onAddElement={handleAddElement} 
                currentPageId={currentPageId}
                selectedElement={selectedElement}
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <EditorCanvas
            previewMode={previewMode}
            showPreview={showPreview}
            onOpenInlineEditor={handleOpenInlineEditor}
            onStartResize={handleStartResize}
            appId={appId}
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
            <m.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full border-l bg-background overflow-y-auto overflow-x-hidden"
            >
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent p-1 flex-shrink-0">
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
                  <TabsTrigger
                    value="pages"
                    className="flex items-center gap-2 data-[state=active]:bg-accent"
                  >
                    <FileText className="w-4 h-4" />
                    Pages
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
                  <PropertiesPanel selectedElement={selectedElement} />
                </TabsContent>

                <TabsContent value="layers" className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
                  <LayersPanel app={null} />
                </TabsContent>

                <TabsContent value="pages" className="flex-1 mt-0 overflow-y-auto overflow-x-hidden">
                  <PageManager appId={appId} />
                </TabsContent>
              </Tabs>
            </m.div>
          )}
        </AnimatePresence>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAI && (
            <m.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute right-0 top-0 bottom-0 w-96 border-l bg-background shadow-2xl z-50"
            >
              <AIAssistant app={null} onClose={() => setShowAI(false)} />
            </m.div>
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
              appId={appId}
            />
          )}
        </AnimatePresence>

        {/* Resize Handles - Enhanced for Figma-like experience */}
        {selectedElement && !showPreview && (
          <ResizeHandles
            element={selectedElement}
            isSelected={true}
            onResize={(newSize) => handleElementResize(selectedElement.id, newSize)}
            onPositionChange={(newPosition) => updateElement(selectedElement.id, { position: newPosition })}
            onResizeEnd={() => setResizingElement(null)}
            minWidth={20}
            minHeight={20}
            showGrid={showGrid}
            snapToGrid={true}
            gridSize={8}
            zoom={100}
            aspectRatio={selectedElement.type === 'image' ? null : null}
          />
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
