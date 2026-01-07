'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from 'framer-motion'

import { EditorSidebar } from './editor-sidebar'
import { EditorCanvas } from './editor-canvas'
import { EditorToolbar } from './editor-toolbar'
import { PropertiesPanel } from './properties-panel'
import { LayersPanel } from './layers-panel'
import { AIAssistant } from './ai-assistant'
import { EditorProvider, useEditor } from '@/contexts/editor-context'
import { WebSocketProvider } from '@/contexts/websocket-context'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { 
  Settings,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelRightClose,
  Maximize2,
  Minimize2
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
  
  const {
    selectedElement,
    elements,
    canUndo,
    canRedo,
    undo,
    redo,
    saveApp,
    isSaving,
    isDirty
  } = useEditor()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            saveApp()
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
        }
      }

      // Toggle preview with P
      if (e.key === 'p' && !modifier) {
        e.preventDefault()
        setShowPreview(!showPreview)
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setShowAI(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveApp, undo, redo, showPreview, leftSidebarOpen])

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
        onSave={saveApp}
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
              className="h-full border-r bg-background overflow-hidden"
            >
              <EditorSidebar />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <EditorCanvas 
            previewMode={previewMode}
            showPreview={showPreview}
          />
          
          {/* Floating Actions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
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
              className="h-full border-l bg-background overflow-hidden"
            >
              <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-1">
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
                
                <TabsContent value="properties" className="flex-1 mt-0 overflow-hidden">
                  <PropertiesPanel selectedElement={selectedElement} />
                </TabsContent>
                
                <TabsContent value="layers" className="flex-1 mt-0 overflow-hidden">
                  <LayersPanel elements={elements} />
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
              <AIAssistant onClose={() => setShowAI(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function LiveEditor({ appId, initialData }: LiveEditorProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <WebSocketProvider appId={appId}>
        <EditorProvider appId={appId} initialData={initialData}>
          <EditorContent appId={appId} />
        </EditorProvider>
      </WebSocketProvider>
    </DndProvider>
  )
}
