'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useDrop } from 'react-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { WidgetRenderer } from './widget-renderer'
import { DropIndicator } from './drop-indicator'
import { SelectionBox } from './selection-box'
import { CollaboratorCursors } from './collaborator-cursors'
import { GridOverlay } from './grid-overlay'
import { RulerOverlay } from './ruler-overlay'
import { ContextMenu } from './context-menu'

import { useEditor } from '@/contexts/editor-context'
import { useWebSocket } from '@/contexts/websocket-context'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Grid3X3, 
  Ruler,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MousePointer,
  Hand,
  Move
} from 'lucide-react'

interface EditorCanvasProps {
  previewMode: 'desktop' | 'tablet' | 'mobile'
  showPreview: boolean
  onOpenInlineEditor?: (element: any, position?: { x: number; y: number }) => void
  onStartResize?: (elementId: string) => void
}

const CANVAS_DIMENSIONS = {
  desktop: { width: 1440, minWidth: 1024 },
  tablet: { width: 768, minWidth: 768 },
  mobile: { width: 375, minWidth: 375 }
}

export function EditorCanvas({ previewMode, showPreview, onOpenInlineEditor, onStartResize }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [tool, setTool] = useState<'select' | 'pan' | 'zoom'>('select')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [dropPosition, setDropPosition] = useState<{ x: number; y: number; index: number } | null>(null)
  
  const {
    selectedElement,
    hoveredElement,
    elements,
    selectElement,
    setHoveredElement,
    addElement,
    reorderElement
  } = useEditor()
  
  const { collaborators, sendCursorPosition } = useWebSocket()

  // Drop zone for widgets
  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: ['widget', 'element', 'element-position'],
    hover: (item: any, monitor) => {
      if (!canvasRef.current) return
      
      const offset = monitor.getClientOffset()
      const canvasRect = canvasRef.current.getBoundingClientRect()
      
      if (offset) {
        const x = (offset.x - canvasRect.left) / (zoom / 100)
        const y = (offset.y - canvasRect.top) / (zoom / 100)
        
        // Only show drop indicator for reorder mode
        if (item.type === 'widget' || (item.type === 'element' && item.dragMode === 'reorder')) {
          // Calculate drop index based on y position
          const sortedElements = [...elements].sort((a, b) => a.position.y - b.position.y)
          let dropIndex = sortedElements.length
          
          for (let i = 0; i < sortedElements.length; i++) {
            if (y < sortedElements[i].position.y + sortedElements[i].size.height / 2) {
              dropIndex = i
              break
            }
          }
          
          setDropPosition({ x, y, index: dropIndex })
        } else {
          setDropPosition(null)
        }
      }
    },
    drop: (item: any, monitor) => {
      if (!canvasRef.current) return
      
      const offset = monitor.getClientOffset()
      const canvasRect = canvasRef.current.getBoundingClientRect()
      
      if (offset) {
        const x = (offset.x - canvasRect.left) / (zoom / 100)
        const y = (offset.y - canvasRect.top) / (zoom / 100)
        
        if (item.type === 'widget') {
          addElement({
            type: item.widgetType,
            position: { x: 0, y }, // Full width by default
            size: { 
              width: CANVAS_DIMENSIONS[previewMode].width, 
              height: item.defaultHeight || 200 
            },
            props: item.defaultProps || {},
            style: item.defaultStyle || {},
            children: []
          })
        } else if (item.type === 'element' && item.dragMode === 'reorder' && dropPosition) {
          reorderElement(item.id, dropPosition.index)
        } else if (item.type === 'element-position') {
          // Position dragging is handled by the drag source
          return
        }
      }
      
      setDropPosition(null)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem()
    })
  })

  // Mouse tracking for collaboration
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / (zoom / 100)
    const y = (e.clientY - rect.top) / (zoom / 100)
    
    sendCursorPosition({ x, y })
    
    // Panning
    if (isPanning && tool === 'pan') {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))
    }
  }, [zoom, sendCursorPosition, isPanning, tool])

  // Canvas click handler
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on elements
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('[data-element-id]') === null) {
      selectElement(null)
    }
    setContextMenu(null)
  }, [selectElement])

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.min(200, Math.max(25, prev + delta)))
  }, [])

  // Wheel zoom
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleZoom(e.deltaY > 0 ? -10 : 10)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleZoom])

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 100
    const canvasWidth = CANVAS_DIMENSIONS[previewMode].width
    const newZoom = Math.min(100, (containerWidth / canvasWidth) * 100)
    setZoom(Math.round(newZoom))
    setPan({ x: 0, y: 0 })
  }, [previewMode])

  // Reset view on preview mode change
  useEffect(() => {
    fitToScreen()
  }, [previewMode, fitToScreen])

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col bg-slate-200 dark:bg-slate-800 overflow-hidden"
    >
      {/* Canvas Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          {/* Tool Selection */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button
              variant={tool === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTool('select')}
              className="h-7 w-7 p-0"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={tool === 'pan' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTool('pan')}
              className="h-7 w-7 p-0"
            >
              <Hand className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />
          
          {/* View Options */}
          <Button
            variant={showGrid ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="h-7 w-7 p-0"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
          
          <Button
            variant={showRulers ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowRulers(!showRulers)}
            className="h-7 w-7 p-0"
          >
            <Ruler className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {CANVAS_DIMENSIONS[previewMode].width}px
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleZoom(-10)} className="h-7 w-7 p-0">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => handleZoom(10)} className="h-7 w-7 p-0">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={fitToScreen} className="h-7 w-7 p-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        className={cn(
          "flex-1 overflow-auto relative",
          tool === 'pan' && "cursor-grab",
          isPanning && "cursor-grabbing"
        )}
        onMouseDown={() => tool === 'pan' && setIsPanning(true)}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        {/* Rulers */}
        {showRulers && <RulerOverlay zoom={zoom} />}
        
        <div 
          className="min-h-full flex items-start justify-center p-8"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`
          }}
        >
          {/* Canvas Frame */}
          <motion.div
            className="relative bg-white dark:bg-slate-900 shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: CANVAS_DIMENSIONS[previewMode].width,
              minHeight: 800,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center'
            }}
            layout
          >
            {/* Drop Target */}
            <div
              ref={(node) => {
                if (node) {
                  (canvasRef as any).current = node
                  drop(node)
                }
              }}
              className={cn(
                "relative min-h-[800px] transition-colors",
                isOver && canDrop && "bg-primary/5",
                showPreview && "pointer-events-none"
              )}
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
              onContextMenu={handleContextMenu}
            >
              {/* Grid Overlay */}
              {showGrid && !showPreview && <GridOverlay />}
              
              {/* Elements - Support both stacked and positioned layouts */}
              <div className="relative min-h-[400px]">
                {/* Stacked Elements (reorder mode) */}
                <div className="relative space-y-0">
                  {elements
                    .filter(element => !element.position || element.position.x === 0) // Stacked elements
                    .map((element, index) => (
                    <motion.div
                      key={element.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "relative w-full block",
                        !showPreview && "hover:z-10"
                      )}
                      onMouseEnter={() => !showPreview && setHoveredElement(element)}
                      onMouseLeave={() => setHoveredElement(null)}
                      style={{ zIndex: selectedElement?.id === element.id ? 20 : 1 }}
                    >
                      <WidgetRenderer
                        element={element}
                        isSelected={selectedElement?.id === element.id}
                        isHovered={hoveredElement?.id === element.id}
                        isPreview={showPreview}
                        onSelect={() => {
                          console.log('Selecting element:', element.id, element.type)
                          selectElement(element)
                        }}
                        onOpenInlineEditor={onOpenInlineEditor}
                        onStartResize={onStartResize}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Positioned Elements (position mode) */}
                {elements
                  .filter(element => element.position && element.position.x !== 0) // Positioned elements
                  .map((element) => (
                  <WidgetRenderer
                    key={element.id}
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    isHovered={hoveredElement?.id === element.id}
                    isPreview={showPreview}
                    onSelect={() => {
                      console.log('Selecting positioned element:', element.id, element.type)
                      selectElement(element)
                    }}
                    onOpenInlineEditor={onOpenInlineEditor}
                    onStartResize={onStartResize}
                  />
                ))}
              </div>
              
              {/* Drop Indicator */}
              {isOver && canDrop && dropPosition && (
                <DropIndicator 
                  y={dropPosition.y} 
                  width={CANVAS_DIMENSIONS[previewMode].width}
                />
              )}
              
              {/* Selection Box for multi-select */}
              {selectedElement && !showPreview && (
                <SelectionBox element={selectedElement} />
              )}
              
              {/* Collaborator Cursors */}
              {!showPreview && <CollaboratorCursors collaborators={collaborators} />}
              
              {/* Empty State */}
              {elements.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center text-muted-foreground max-w-md p-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                      <Move className="w-10 h-10 text-primary/50" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Start Building</h3>
                    <p className="text-sm mb-4">
                      Drag widgets from the left panel or use AI to generate your design
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs">
                      <Badge variant="secondary">Drag & Drop</Badge>
                      <Badge variant="secondary">AI Generate</Badge>
                      <Badge variant="secondary">Templates</Badge>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
