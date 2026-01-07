'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Import all widget components
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

interface WidgetRendererProps {
  element: any
  isSelected: boolean
  isHovered: boolean
  isPreview: boolean
  onSelect: () => void
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
}

export function WidgetRenderer({
  element,
  isSelected,
  isHovered,
  isPreview,
  onSelect
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

  // Drag handle for reordering
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { type: 'element', id: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  // Get the widget component
  const WidgetComponent = WIDGET_COMPONENTS[element.type]

  // Handle inline editing
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isPreview) return
    e.stopPropagation()
    setIsEditing(true)
  }, [isPreview])

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
        elementRef.current = node
        preview(node)
      }}
      className={cn(
        "relative group transition-all",
        isDragging && "opacity-50",
        !isPreview && isSelected && "ring-2 ring-primary ring-offset-2",
        !isPreview && isHovered && !isSelected && "ring-1 ring-primary/50"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Widget Content */}
      <div style={element.style}>
        <WidgetComponent
          {...element.props}
          isEditing={isEditing && !isPreview}
          isPreview={isPreview}
          onChange={handlePropsChange}
          onStyleChange={handleStyleChange}
        />
      </div>

      {/* Selection Controls - Only show when selected and not in preview */}
      {isSelected && !isPreview && (
        <>
          {/* Top Label */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-8 left-0 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-lg z-50"
          >
            {/* Drag Handle */}
            <div ref={drag} className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 hover:bg-white/20 rounded">
              <GripVertical className="w-3 h-3" />
            </div>
            
            <span className="capitalize">{element.type}</span>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-0.5 ml-2 border-l border-white/30 pl-2">
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
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Edit Content
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
          </motion.div>
        </>
      )}

      {/* Hover indicator for non-selected elements */}
      {isHovered && !isSelected && !isPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 left-0 bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium z-40"
        >
          {element.type}
        </motion.div>
      )}
    </div>
  )
}
