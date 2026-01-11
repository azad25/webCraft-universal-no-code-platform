'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'
import { getActionService } from '@/lib/action-service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  GripVertical,
  Copy,
  Trash2,
  Settings2,
  ChevronUp,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Move,
  ArrowUpDown,
  Maximize2,
  Edit3,
  Type,
  Image as ImageIcon,
  Palette,
  Layout,
  Wand2,
  Upload,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  X,
  Paintbrush,
  MousePointer2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Import all widget components directly (no lazy loading for now)
import { SectionWidget } from './widgets/section-widget'
import { HeroWidget } from './widgets/hero-widget'
import { TextWidget } from './widgets/text-widget'
import { ImageWidget } from './widgets/image-widget'
import { ButtonWidget } from './widgets/button-widget'
import { FormWidget } from './widgets/form-widget'
import { CardWidget } from './widgets/card-widget'
import { VideoWidget } from './widgets/video-widget'
import { ContainerWidget } from './widgets/container-widget'
import { ColumnsWidget } from './widgets/columns-widget'
import { SpacerWidget } from './widgets/spacer-widget'
import { DividerWidget } from './widgets/divider-widget'
import { NavbarWidget } from './widgets/navbar-widget'
import { FooterWidget } from './widgets/footer-widget'
import { TestimonialWidget } from './widgets/testimonial-widget'
import { PricingWidget } from './widgets/pricing-widget'
import { FeaturesWidget } from './widgets/features-widget'
import { GalleryWidget } from './widgets/gallery-widget'
import { FAQWidget } from './widgets/faq-widget'
import { CTAWidget } from './widgets/cta-widget'
import { StatsWidget } from './widgets/stats-widget'
import { TeamWidget } from './widgets/team-widget'
import { LogoCloudWidget } from './widgets/logo-cloud-widget'
import { CountdownWidget } from './widgets/countdown-widget'
import { AccordionWidget } from './widgets/accordion-widget'
import { TabsWidget } from './widgets/tabs-widget'
import { ProgressWidget } from './widgets/progress-widget'
import { TimelineWidget } from './widgets/timeline-widget'
import { ContactWidget } from './widgets/contact-widget'
import { NewsletterWidget } from './widgets/newsletter-widget'
import { BannerWidget } from './widgets/banner-widget'
import { ComparisonWidget } from './widgets/comparison-widget'
import { StepsWidget } from './widgets/steps-widget'
import { ProductWidget } from './widgets/product-widget'
import { CartWidget } from './widgets/cart-widget'
import { CheckoutWidget } from './widgets/checkout-widget'
import { MapWidget } from './widgets/map-widget'
import { CalendarWidget } from './widgets/calendar-widget'
import { SearchWidget } from './widgets/search-widget'
import { AlertWidget } from './widgets/alert-widget'
import { AudioWidget } from './widgets/audio-widget'
import { BreadcrumbWidget } from './widgets/breadcrumb-widget'
import { CodeWidget } from './widgets/code-widget'
import { DataWidget } from './widgets/data-widget'
import { EmbedWidget } from './widgets/embed-widget'
import { ListWidget } from './widgets/list-widget'
import { MarqueeWidget } from './widgets/marquee-widget'
import { MetricWidget } from './widgets/metric-widget'
import { QuoteWidget } from './widgets/quote-widget'
import { RatingWidget } from './widgets/rating-widget'
import { CustomCodeWidget } from './widgets/custom-code-widget'
import { SocialWidget } from './widgets/social-widget'
import { AvatarGroupWidget } from './widgets/avatar-group-widget'
import { EnhancedButtonWidget } from './widgets/enhanced-button-widget'
import { ChartWidget } from './widgets/chart-widget'
import { TableWidget } from './widgets/table-widget'

// Import the widget toolbar
import { WidgetToolbar } from './widget-toolbar'

interface WidgetRendererProps {
  element: any
  isSelected: boolean
  isHovered: boolean
  isPreview: boolean
  onSelect: () => void
  onOpenInlineEditor?: (element: any, position?: { x: number; y: number }) => void
  onStartResize?: (elementId: string) => void
  appId?: string
}

// Direct editing state interface
interface DirectEditState {
  isEditing: boolean
  editType: 'text' | 'image' | 'style' | 'layout' | null
  editTarget: string | null // Which property is being edited
  originalValue: any
  tempValue: any
}

// Widget component registry
const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  section: SectionWidget,
  hero: HeroWidget,
  text: TextWidget,
  heading: TextWidget,
  paragraph: TextWidget,
  image: ImageWidget,
  button: ButtonWidget,
  form: FormWidget,
  card: CardWidget,
  video: VideoWidget,
  container: ContainerWidget,
  columns: ColumnsWidget,
  spacer: SpacerWidget,
  divider: DividerWidget,
  navbar: NavbarWidget,
  footer: FooterWidget,
  testimonial: TestimonialWidget,
  pricing: PricingWidget,
  features: FeaturesWidget,
  gallery: GalleryWidget,
  faq: FAQWidget,
  cta: CTAWidget,
  stats: StatsWidget,
  team: TeamWidget,
  'logo-cloud': LogoCloudWidget,
  countdown: CountdownWidget,
  accordion: AccordionWidget,
  tabs: TabsWidget,
  progress: ProgressWidget,
  timeline: TimelineWidget,
  contact: ContactWidget,
  newsletter: NewsletterWidget,
  banner: BannerWidget,
  comparison: ComparisonWidget,
  steps: StepsWidget,
  product: ProductWidget,
  cart: CartWidget,
  checkout: CheckoutWidget,
  map: MapWidget,
  calendar: CalendarWidget,
  search: SearchWidget,
  alert: AlertWidget,
  audio: AudioWidget,
  breadcrumb: BreadcrumbWidget,
  code: CodeWidget,
  data: DataWidget,
  embed: EmbedWidget,
  list: ListWidget,
  marquee: MarqueeWidget,
  metric: MetricWidget,
  quote: QuoteWidget,
  rating: RatingWidget,
  social: SocialWidget,
  'avatar-group': AvatarGroupWidget,
  'enhanced-button': EnhancedButtonWidget,
  // Add ecommerce as an alias for container with product grid
  ecommerce: ContainerWidget,
  // Add chart widget
  chart: ChartWidget,
  // Add table widget
  table: TableWidget,
  // Add dedicated table widget
  'data-table': TableWidget,
  // Custom code widgets
  'custom-code': CustomCodeWidget,
  'custom-html': CustomCodeWidget,
  'custom-css': CustomCodeWidget,
  'custom-js': CustomCodeWidget,
}

export function WidgetRenderer({
  element,
  isSelected,
  isHovered,
  isPreview,
  onSelect,
  onOpenInlineEditor,
  onStartResize,
  appId
}: WidgetRendererProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [directEdit, setDirectEdit] = useState<DirectEditState>({
    isEditing: false,
    editType: null,
    editTarget: null,
    originalValue: null,
    tempValue: null
  })
  const [showQuickActions, setShowQuickActions] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Only use editor context when not in preview mode
  const editorContext = isPreview ? null : useEditor()
  const {
    updateElement,
    deleteElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    addElementAfter
  } = editorContext || {
    updateElement: () => {},
    deleteElement: () => {},
    duplicateElement: () => {},
    moveElementUp: () => {},
    moveElementDown: () => {},
    addElementAfter: () => {}
  }

  const [isDraggingPosition, setIsDraggingPosition] = useState(false)
  const [dragMode, setDragMode] = useState<'reorder' | 'position'>(() => {
    // Default to position mode for elements with position data, reorder for others
    return (element.position?.x !== undefined && element.position?.y !== undefined) ? 'position' : 'reorder'
  })

  // Drag handle for reordering (only when selected and not in preview)
  const dragResult = !isPreview ? useDrag({
    type: 'element',
    item: { type: 'element', id: element.id, dragMode },
    canDrag: () => isSelected && !isPreview, // Only allow dragging when selected
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }) : [{ isDragging: false }, () => {}, () => {}]

  const [{ isDragging }, drag, preview] = dragResult

  // Position drag functionality (only when not in preview)
  const dragPositionResult = !isPreview ? useDrag({
    type: 'element-position',
    item: () => ({
      type: 'element-position',
      id: element.id,
      initialPosition: element.position || { x: 0, y: 0 }
    }),
    canDrag: () => isSelected && !isPreview && dragMode === 'position',
    collect: (monitor) => ({
      isDraggingPos: monitor.isDragging()
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        // If not dropped on a valid target, update position based on mouse movement
        const delta = monitor.getDifferenceFromInitialOffset()
        if (delta) {
          const currentPos = element.position || { x: 0, y: 0 }
          const newPosition = {
            x: Math.max(0, currentPos.x + delta.x),
            y: Math.max(0, currentPos.y + delta.y)
          }
          updateElement(element.id, { position: newPosition })
        }
      }
    }
  }) : [{ isDraggingPos: false }, () => {}]

  const [{ isDraggingPos }, dragPosition] = dragPositionResult

  // Handle widget events (for actions)
  const handleWidgetEvent = useCallback(async (eventType: string, eventData: Record<string, any>) => {
    if (!appId || isPreview === false) return

    try {
      const actionService = getActionService(appId)
      if (actionService) {
        await actionService.executeWidgetEvent(
          element.id,
          eventType,
          eventData,
          {
            timestamp: Date.now(),
            elementType: element.type,
            elementProps: element.props
          }
        )
      }
    } catch (error) {
      console.error('Failed to execute widget event:', error)
    }
  }, [appId, isPreview, element.id, element.type, element.props])

  // Get the widget component
  const WidgetComponent = WIDGET_COMPONENTS[element.type]

  // Handle element click
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't interfere with contentEditable elements
    const target = e.target as HTMLElement
    if (target.contentEditable === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    
    e.stopPropagation()
    if (!isPreview) {
      console.log('Element clicked:', element.id, element.type)
      onSelect()
    } else {
      // In preview mode, execute actions
      handleWidgetEvent('click', {
        elementId: element.id,
        elementType: element.type,
        clickX: e.clientX,
        clickY: e.clientY,
        timestamp: Date.now()
      })
    }
  }, [isPreview, onSelect, element.id, element.type, handleWidgetEvent])

  // Handle single click for quick actions
  const handleSingleClick = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    
    // Show quick action hints
    setShowQuickActions(true)
    setTimeout(() => setShowQuickActions(false), 3000)
  }, [isPreview])

  // Handle direct text editing
  const startDirectEdit = useCallback((editType: 'text' | 'image' | 'style' | 'layout', target: string, currentValue: any) => {
    if (isPreview) return
    
    setDirectEdit({
      isEditing: true,
      editType,
      editTarget: target,
      originalValue: currentValue,
      tempValue: currentValue
    })
    
    // Focus input after state update
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus()
        if (editInputRef.current instanceof HTMLInputElement || editInputRef.current instanceof HTMLTextAreaElement) {
          editInputRef.current.select()
        }
      }
    }, 50)
  }, [isPreview])

  // Save direct edit
  const saveDirectEdit = useCallback(() => {
    if (!directEdit.isEditing || !directEdit.editTarget) return
    
    const updates: any = {}
    
    if (directEdit.editType === 'text') {
      updates.props = {
        ...element.props,
        [directEdit.editTarget]: directEdit.tempValue
      }
    } else if (directEdit.editType === 'image') {
      updates.props = {
        ...element.props,
        [directEdit.editTarget]: directEdit.tempValue
      }
    } else if (directEdit.editType === 'style') {
      updates.style = {
        ...element.style,
        [directEdit.editTarget]: directEdit.tempValue
      }
    }
    
    updateElement(element.id, updates)
    
    setDirectEdit({
      isEditing: false,
      editType: null,
      editTarget: null,
      originalValue: null,
      tempValue: null
    })
  }, [directEdit, element, updateElement])

  // Cancel direct edit
  const cancelDirectEdit = useCallback(() => {
    setDirectEdit({
      isEditing: false,
      editType: null,
      editTarget: null,
      originalValue: null,
      tempValue: null
    })
  }, [])

  // Handle text content click for direct editing
  const handleTextClick = useCallback((e: React.MouseEvent, textProperty: string) => {
    if (isPreview || !isSelected) return
    e.stopPropagation()
    
    const currentValue = element.props?.[textProperty] || ''
    startDirectEdit('text', textProperty, currentValue)
  }, [isPreview, isSelected, element.props, startDirectEdit])

  // Handle image click for direct editing
  const handleImageClick = useCallback((e: React.MouseEvent, imageProperty: string = 'src') => {
    if (isPreview || !isSelected) return
    e.stopPropagation()
    
    const currentValue = element.props?.[imageProperty] || ''
    startDirectEdit('image', imageProperty, currentValue)
  }, [isPreview, isSelected, element.props, startDirectEdit])

  // Show widget toolbar on selection
  const [showWidgetToolbar, setShowWidgetToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Update toolbar position when selected
  useEffect(() => {
    if (isSelected && !isPreview && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()
      setToolbarPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      })
      setShowWidgetToolbar(true)
    } else {
      setShowWidgetToolbar(false)
    }
  }, [isSelected, isPreview])

  // Render direct edit input
  const renderDirectEditInput = () => {
    if (!directEdit.isEditing) return null

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        saveDirectEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelDirectEdit()
      }
    }

    const inputProps = {
      ref: editInputRef as any,
      value: directEdit.tempValue || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDirectEdit(prev => ({ ...prev, tempValue: e.target.value }))
      },
      onKeyDown: handleKeyDown,
      onBlur: saveDirectEdit,
      className: "absolute inset-0 z-50 bg-white border-2 border-primary rounded px-2 py-1 text-sm font-medium shadow-lg",
      placeholder: directEdit.editType === 'image' ? 'Enter image URL...' : 'Enter text...',
      autoFocus: true
    }

    if (directEdit.editType === 'text' && directEdit.tempValue && directEdit.tempValue.length > 50) {
      return (
        <div className="absolute inset-0 z-50 bg-white border-2 border-primary rounded shadow-lg">
          <Textarea
            {...inputProps}
            className="w-full h-full resize-none border-none focus:ring-0 text-sm"
            rows={3}
          />
          <div className="absolute bottom-1 right-1 flex gap-1">
            <Button size="sm" variant="ghost" onClick={saveDirectEdit} className="h-6 w-6 p-0">
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelDirectEdit} className="h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="absolute inset-0 z-50">
        <Input {...inputProps} />
        <div className="absolute top-full left-0 mt-1 flex gap-1 bg-white border rounded shadow-lg p-1">
          <Button size="sm" variant="ghost" onClick={saveDirectEdit} className="h-6 px-2 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelDirectEdit} className="h-6 px-2 text-xs">
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // Handle double click for quick editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    
    // Don't interfere with contentEditable elements
    const target = e.target as HTMLElement
    if (target.contentEditable === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    
    e.stopPropagation()
    
    // Determine what to edit based on element type
    const textProperties = ['text', 'content', 'title', 'subtitle', 'description']
    const textProp = textProperties.find(prop => element.props?.[prop])
    
    if (textProp) {
      startDirectEdit('text', textProp, element.props[textProp])
    } else if (element.type === 'image' && element.props?.src) {
      startDirectEdit('image', 'src', element.props.src)
    } else if (onOpenInlineEditor) {
      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: rect.left + rect.width / 2 - 160,
        y: Math.max(10, rect.top - 10)
      }
      onOpenInlineEditor(element, position)
    }
  }, [isPreview, element, startDirectEdit, onOpenInlineEditor])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    
    // Don't interfere with contentEditable elements
    const target = e.target as HTMLElement
    if (target.contentEditable === 'true' || target.closest('[contenteditable="true"]')) {
      return
    }
    
    e.preventDefault()
    e.stopPropagation()
    
    // Open inline editor on right-click
    if (onOpenInlineEditor) {
      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: e.clientX - 160, // Position at cursor
        y: Math.max(10, e.clientY - 10)
      }
      onOpenInlineEditor(element, position)
    }
  }, [isPreview, onOpenInlineEditor, element])

  // Handle position dragging with grid snapping
  const handlePositionDrag = useCallback((elementId: string, delta: { x: number; y: number }) => {
    const gridSize = 8 // Default grid size
    const newPosition = {
      x: Math.round((element.position.x + delta.x) / gridSize) * gridSize,
      y: Math.round((element.position.y + delta.y) / gridSize) * gridSize
    }
    updateElement(elementId, { position: newPosition })
  }, [element.position, updateElement])

  // Enhanced resize handling with constraints
  const handleElementResize = useCallback((elementId: string, newSize: { width: number; height: number }) => {
    // Apply minimum size constraints
    const constrainedSize = {
      width: Math.max(20, newSize.width),
      height: Math.max(20, newSize.height)
    }
    updateElement(elementId, { size: constrainedSize })
  }, [updateElement])

  // Handle prop changes from widget
  const handlePropsChange = useCallback((newProps: any) => {
    updateElement(element.id, { props: { ...element.props, ...newProps } })
  }, [element.id, element.props, updateElement])

  // Handle style changes
  const handleStyleChange = useCallback((newStyle: any) => {
    updateElement(element.id, { style: { ...element.style, ...newStyle } })
  }, [element.id, element.style, updateElement])

  // Exit editing mode on click outside
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
        setIsEditing(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing])

  // Keyboard shortcuts when selected
  useEffect(() => {
    if (!isSelected || isPreview) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with contentEditable elements or form inputs
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && 
         (e.target.contentEditable === 'true' || e.target.closest('[contenteditable="true"]')))
      ) {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteElement(element.id)
      }

      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        duplicateElement(element.id)
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        setIsEditing(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelected, isPreview, element.id, deleteElement, duplicateElement])

  if (!WidgetComponent) {
    return (
      <div className="p-4 border-2 border-dashed border-red-300 bg-red-50 rounded text-center">
        <p className="text-red-600 text-sm">Unknown widget: {element.type}</p>
      </div>
    )
  }

  return (
    <div
      ref={(node) => {
        if (elementRef.current !== node) {
          (elementRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
        preview(node)
      }}
      data-element-id={element.id}
      data-element-type={element.type}
      className={cn(
        "relative group transition-all min-h-[40px]", // Ensure minimum clickable area
        !isPreview && "cursor-pointer hover:ring-1 hover:ring-primary/30",
        (isDragging || isDraggingPos) && "opacity-50",
        !isPreview && isSelected && "ring-2 ring-primary ring-offset-1",
        !isPreview && isHovered && !isSelected && "ring-1 ring-primary/50"
      )}
      style={{
        // Let the canvas handle positioning through its container
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Widget Content */}
      <div 
        ref={(node) => {
          // Apply the appropriate drag ref based on drag mode
          if (dragMode === 'position' && !isPreview) {
            dragPosition(node)
          } else if (dragMode === 'reorder' && !isPreview) {
            drag(node)
          }
        }}
        style={element.style}
        className={cn(
          "relative w-full h-full",
          !isPreview && !isSelected && "hover:outline hover:outline-1 hover:outline-primary/40 hover:outline-offset-2",
          dragMode === 'position' && isSelected && !isPreview && "cursor-move",
          // Add better visual feedback for editable elements
          !isPreview && isSelected && "ring-1 ring-primary/20 ring-offset-1"
        )}
      >
        <WidgetComponent
          {...element.props}
          isEditing={isEditing && !isPreview}
          isPreview={isPreview}
          isSelected={isSelected}
          isHovered={isHovered}
          onChange={handlePropsChange}
          onStyleChange={handleStyleChange}
          elementId={element.id}
          appId={appId}
          
          // Universal link props - passed to all widgets
          linkConfig={element.props?.linkConfig}
          href={element.props?.href}
          target={element.props?.target}
        />
      </div>

      {/* Selection Controls - Only show when selected and not in preview */}
      {isSelected && !isPreview && (
        <TooltipProvider>
          {/* Top Label */}
          <m.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-8 left-0 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-lg z-50"
          >
            {/* Drag Handle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div ref={dragMode === 'reorder' ? drag as any : undefined} className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-white/20 rounded">
                  <GripVertical className="w-3 h-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dragMode === 'reorder' ? 'Drag to reorder' : 'Reorder mode'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Drag Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    const newMode = dragMode === 'reorder' ? 'position' : 'reorder'
                    setDragMode(newMode)
                    // Update element style to match drag mode
                    if (newMode === 'position') {
                      updateElement(element.id, { 
                        style: { ...element.style, position: 'absolute' }
                      })
                    }
                  }}
                >
                  {dragMode === 'reorder' ? <ArrowUpDown className="w-3 h-3" /> : <Move className="w-3 h-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dragMode === 'reorder' ? 'Switch to position mode' : 'Switch to reorder mode'}</p>
              </TooltipContent>
            </Tooltip>

            <span className="capitalize">{element.type}</span>
            {dragMode === 'position' && (
              <span className="text-xs opacity-75 ml-1">
                ({Math.round(element.position?.x || 0)}, {Math.round(element.position?.y || 0)})
              </span>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 ml-2 border-l border-white/30 pl-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElementUp(element.id)
                    }}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move up</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElementDown(element.id)
                    }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Move down</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateElement(element.id)
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate (Ctrl+D)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-destructive text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(element.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete (Del)</p>
                </TooltipContent>
              </Tooltip>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-white/20 text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => {
                    if (onOpenInlineEditor) {
                      onOpenInlineEditor(element)
                    } else {
                      setIsEditing(true)
                    }
                  }}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Edit Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStartResize?.(element.id)}>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Resize Element
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateElement(element.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    // Open action configuration panel
                    // This would be handled by the parent component
                    console.log('Configure actions for:', element.id)
                  }}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Configure Actions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addElementAfter(element.id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section Below
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteElement(element.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </m.div>

          {/* Add Section Button (below) */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-50"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 text-xs shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    addElementAfter(element.id)
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Section
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new section below</p>
              </TooltipContent>
            </Tooltip>
          </m.div>
        </TooltipProvider>
      )}

      {/* Hover indicator for non-selected elements */}
      {isHovered && !isSelected && !isPreview && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 left-0 bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium z-40 pointer-events-none"
        >
          Click to select • Double-click to edit • {element.type} • {dragMode === 'position' ? 'Position Mode' : 'Stack Mode'}
        </m.div>
      )}

      {/* Position mode indicator */}
      {dragMode === 'position' && isSelected && !isPreview && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-6 left-0 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium z-40 pointer-events-none"
        >
          Position Mode • Drag to move freely
        </m.div>
      )}

      {/* Widget Toolbar - Figma-like editing */}
      {showWidgetToolbar && !isPreview && (
        <WidgetToolbar
          element={element}
          position={toolbarPosition}
          isVisible={showWidgetToolbar}
          onClose={() => setShowWidgetToolbar(false)}
          appId={appId}
        />
      )}

      {/* Direct Edit Input Overlay */}
      {directEdit.isEditing && renderDirectEditInput()}

      {/* Click overlay for better interaction */}
      {!isPreview && !isSelected && (
        <div 
          className="absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
          style={{ 
            background: dragMode === 'position' 
              ? 'linear-gradient(45deg, transparent 49%, rgba(147, 51, 234, 0.1) 50%, transparent 51%)'
              : 'linear-gradient(45deg, transparent 49%, rgba(59, 130, 246, 0.1) 50%, transparent 51%)',
            backgroundSize: '10px 10px'
          }}
        />
      )}

      {/* Quick Actions Hint */}
      {showQuickActions && !isPreview && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black text-white px-3 py-1 rounded text-xs whitespace-nowrap z-50"
        >
          Double-click text to edit • Right-click for options • Enter to start editing
        </m.div>
      )}
    </div>
  )
}
