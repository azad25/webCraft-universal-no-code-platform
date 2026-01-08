'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

import { Button } from '@/components/ui/button'
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
  Maximize2
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
import { SocialWidget } from './widgets/social-widget'
import { AvatarGroupWidget } from './widgets/avatar-group-widget'
import { EnhancedButtonWidget } from './widgets/enhanced-button-widget'
import { ChartWidget } from './widgets/chart-widget'
import { TableWidget } from './widgets/table-widget'

interface WidgetRendererProps {
  element: any
  isSelected: boolean
  isHovered: boolean
  isPreview: boolean
  onSelect: () => void
  onOpenInlineEditor?: (element: any, position?: { x: number; y: number }) => void
  onStartResize?: (elementId: string) => void
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
}

export function WidgetRenderer({
  element,
  isSelected,
  isHovered,
  isPreview,
  onSelect,
  onOpenInlineEditor,
  onStartResize
}: WidgetRendererProps) {
  const [isEditing, setIsEditing] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const {
    updateElement,
    deleteElement,
    duplicateElement,
    moveElementUp,
    moveElementDown,
    addElementAfter
  } = useEditor()

  const [isDraggingPosition, setIsDraggingPosition] = useState(false)
  const [dragMode, setDragMode] = useState<'reorder' | 'position'>('reorder')

  // Drag handle for reordering (only when selected)
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { type: 'element', id: element.id, dragMode },
    canDrag: () => isSelected && !isPreview, // Only allow dragging when selected
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  // Position drag functionality
  const [{ isDraggingPos }, dragPosition] = useDrag({
    type: 'element-position',
    item: () => ({
      type: 'element-position',
      id: element.id,
      initialPosition: element.position
    }),
    canDrag: () => isSelected && !isPreview && dragMode === 'position',
    collect: (monitor) => ({
      isDraggingPos: monitor.isDragging()
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) return
      
      const delta = monitor.getDifferenceFromInitialOffset()
      if (delta) {
        const newPosition = {
          x: element.position.x + delta.x,
          y: element.position.y + delta.y
        }
        updateElement(element.id, { position: newPosition })
      }
    }
  })

  // Get the widget component
  const WidgetComponent = WIDGET_COMPONENTS[element.type]

  // Handle element click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isPreview) {
      console.log('Element clicked:', element.id, element.type)
      onSelect()
    }
  }, [isPreview, onSelect, element.id, element.type])

  // Handle inline editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    
    if (onOpenInlineEditor) {
      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: rect.left + rect.width / 2 - 160, // Center the editor
        y: Math.max(10, rect.top - 10) // Position above element, but not off-screen
      }
      onOpenInlineEditor(element, position)
    } else {
      setIsEditing(true)
    }
  }, [isPreview, onOpenInlineEditor, element])

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
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
        !isPreview && isHovered && !isSelected && "ring-1 ring-primary/50",
        dragMode === 'position' && !isPreview && "absolute"
      )}
      style={{
        ...(dragMode === 'position' && !isPreview ? {
          left: element.position?.x || 0,
          top: element.position?.y || 0,
          width: element.size?.width || 'auto',
          zIndex: isSelected ? 1000 : 1
        } : {})
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Widget Content */}
      <div 
        ref={dragMode === 'position' ? dragPosition as any : undefined}
        style={element.style}
        className={cn(
          "relative",
          !isPreview && !isSelected && "hover:outline hover:outline-1 hover:outline-primary/40 hover:outline-offset-2",
          dragMode === 'position' && isSelected && !isPreview && "cursor-move"
        )}
      >
        <WidgetComponent
          {...element.props}
          isEditing={isEditing && !isPreview}
          isPreview={isPreview}
          isSelected={isSelected}
          onChange={handlePropsChange}
          onStyleChange={handleStyleChange}
          elementId={element.id}
        />
      </div>

      {/* Selection Controls - Only show when selected and not in preview */}
      {isSelected && !isPreview && (
        <TooltipProvider>
          {/* Top Label */}
          <motion.div
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
                    setDragMode(dragMode === 'reorder' ? 'position' : 'reorder')
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
          </motion.div>

          {/* Add Section Button (below) */}
          <motion.div
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
          </motion.div>
        </TooltipProvider>
      )}

      {/* Hover indicator for non-selected elements */}
      {isHovered && !isSelected && !isPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 left-0 bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium z-40 pointer-events-none"
        >
          Click to select • {element.type} • {dragMode === 'position' ? 'Position Mode' : 'Stack Mode'}
        </motion.div>
      )}

      {/* Position mode indicator */}
      {dragMode === 'position' && isSelected && !isPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-6 left-0 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium z-40 pointer-events-none"
        >
          Position Mode • Drag to move freely
        </motion.div>
      )}

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
    </div>
  )
}
