'use client'

import { useState, useCallback, useMemo } from 'react'
import { m, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronRight, ChevronDown, 
  GripVertical, Layers, Type, Image, MousePointer2, Palette, Layout,
  Code, Video, Music, FileText, Square, Circle, Triangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

interface LayersPanelProps {
  app: any
}

interface LayerElement {
  id: string
  name: string
  type: string
  parentId?: string
  children?: LayerElement[]
  visible?: boolean
  locked?: boolean
  zIndex?: number
  isSubElement?: boolean
  subElementType?: string
  elementPath?: string // Path to the sub-element within the widget
}

// Widget sub-element definitions for decomposition
const WIDGET_SUB_ELEMENTS = {
  hero: [
    { type: 'badge', name: 'Badge', icon: Square, path: 'badgeText' },
    { type: 'title', name: 'Title', icon: Type, path: 'title' },
    { type: 'subtitle', name: 'Subtitle', icon: Type, path: 'subtitle' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'primary-button', name: 'Primary Button', icon: MousePointer2, path: 'primaryButtonText' },
    { type: 'secondary-button', name: 'Secondary Button', icon: MousePointer2, path: 'secondaryButtonText' },
    { type: 'background', name: 'Background', icon: Image, path: 'backgroundImage' }
  ],
  card: [
    { type: 'image', name: 'Card Image', icon: Image, path: 'image' },
    { type: 'title', name: 'Card Title', icon: Type, path: 'title' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'button', name: 'Action Button', icon: MousePointer2, path: 'buttonText' }
  ],
  navbar: [
    { type: 'logo', name: 'Logo', icon: Image, path: 'logo' },
    { type: 'brand', name: 'Brand Text', icon: Type, path: 'brandText' },
    { type: 'menu-items', name: 'Menu Items', icon: Layout, path: 'menuItems' },
    { type: 'cta-button', name: 'CTA Button', icon: MousePointer2, path: 'ctaButton' }
  ],
  footer: [
    { type: 'logo', name: 'Footer Logo', icon: Image, path: 'logo' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'links', name: 'Footer Links', icon: Layout, path: 'links' },
    { type: 'social', name: 'Social Links', icon: Layout, path: 'socialLinks' },
    { type: 'copyright', name: 'Copyright', icon: Type, path: 'copyright' }
  ],
  pricing: [
    { type: 'title', name: 'Plan Title', icon: Type, path: 'title' },
    { type: 'price', name: 'Price', icon: Type, path: 'price' },
    { type: 'features', name: 'Features List', icon: Layout, path: 'features' },
    { type: 'button', name: 'Subscribe Button', icon: MousePointer2, path: 'buttonText' }
  ],
  testimonial: [
    { type: 'quote', name: 'Quote Text', icon: Type, path: 'quote' },
    { type: 'author', name: 'Author Name', icon: Type, path: 'author' },
    { type: 'role', name: 'Author Role', icon: Type, path: 'role' },
    { type: 'avatar', name: 'Author Avatar', icon: Image, path: 'avatar' },
    { type: 'rating', name: 'Rating', icon: Square, path: 'rating' }
  ],
  features: [
    { type: 'title', name: 'Section Title', icon: Type, path: 'title' },
    { type: 'subtitle', name: 'Subtitle', icon: Type, path: 'subtitle' },
    { type: 'feature-items', name: 'Feature Items', icon: Layout, path: 'features' }
  ],
  form: [
    { type: 'title', name: 'Form Title', icon: Type, path: 'title' },
    { type: 'fields', name: 'Form Fields', icon: Layout, path: 'fields' },
    { type: 'submit-button', name: 'Submit Button', icon: MousePointer2, path: 'submitButton' }
  ],
  gallery: [
    { type: 'title', name: 'Gallery Title', icon: Type, path: 'title' },
    { type: 'images', name: 'Image Grid', icon: Layout, path: 'images' },
    { type: 'filters', name: 'Filter Buttons', icon: Layout, path: 'filters' }
  ],
  video: [
    { type: 'video-player', name: 'Video Player', icon: Video, path: 'src' },
    { type: 'title', name: 'Video Title', icon: Type, path: 'title' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'controls', name: 'Player Controls', icon: Layout, path: 'controls' }
  ],
  audio: [
    { type: 'audio-player', name: 'Audio Player', icon: Music, path: 'src' },
    { type: 'title', name: 'Track Title', icon: Type, path: 'title' },
    { type: 'artist', name: 'Artist Name', icon: Type, path: 'artist' },
    { type: 'controls', name: 'Player Controls', icon: Layout, path: 'controls' }
  ],
  'custom-code': [
    { type: 'html-content', name: 'HTML Content', icon: Code, path: 'content' },
    { type: 'css-styles', name: 'CSS Styles', icon: Palette, path: 'styles' },
    { type: 'js-script', name: 'JavaScript', icon: Code, path: 'script' }
  ],
  // Basic widgets
  text: [
    { type: 'text-content', name: 'Text Content', icon: Type, path: 'content' }
  ],
  heading: [
    { type: 'heading-text', name: 'Heading Text', icon: Type, path: 'text' },
    { type: 'heading-level', name: 'Heading Level', icon: Type, path: 'level' }
  ],
  paragraph: [
    { type: 'paragraph-text', name: 'Paragraph Text', icon: Type, path: 'text' }
  ],
  image: [
    { type: 'image-src', name: 'Image Source', icon: Image, path: 'src' },
    { type: 'alt-text', name: 'Alt Text', icon: Type, path: 'alt' }
  ],
  button: [
    { type: 'button-text', name: 'Button Text', icon: Type, path: 'text' },
    { type: 'button-icon', name: 'Button Icon', icon: Square, path: 'icon' }
  ],
  // Advanced widgets
  accordion: [
    { type: 'title', name: 'Accordion Title', icon: Type, path: 'title' },
    { type: 'items', name: 'Accordion Items', icon: Layout, path: 'items' }
  ],
  alert: [
    { type: 'title', name: 'Alert Title', icon: Type, path: 'title' },
    { type: 'message', name: 'Alert Message', icon: Type, path: 'message' },
    { type: 'type', name: 'Alert Type', icon: Square, path: 'type' }
  ],
  'avatar-group': [
    { type: 'avatars', name: 'Avatar List', icon: Layout, path: 'avatars' },
    { type: 'max-count', name: 'Max Count', icon: Type, path: 'maxCount' }
  ],
  banner: [
    { type: 'title', name: 'Banner Title', icon: Type, path: 'title' },
    { type: 'message', name: 'Banner Message', icon: Type, path: 'message' },
    { type: 'button', name: 'Action Button', icon: MousePointer2, path: 'buttonText' }
  ],
  breadcrumb: [
    { type: 'items', name: 'Breadcrumb Items', icon: Layout, path: 'items' },
    { type: 'separator', name: 'Separator', icon: Type, path: 'separator' }
  ],
  calendar: [
    { type: 'title', name: 'Calendar Title', icon: Type, path: 'title' },
    { type: 'events', name: 'Calendar Events', icon: Layout, path: 'events' },
    { type: 'view-mode', name: 'View Mode', icon: Square, path: 'viewMode' }
  ],
  cart: [
    { type: 'title', name: 'Cart Title', icon: Type, path: 'title' },
    { type: 'items', name: 'Cart Items', icon: Layout, path: 'items' },
    { type: 'total', name: 'Total Price', icon: Type, path: 'total' },
    { type: 'checkout-button', name: 'Checkout Button', icon: MousePointer2, path: 'checkoutButton' }
  ],
  chart: [
    { type: 'title', name: 'Chart Title', icon: Type, path: 'title' },
    { type: 'data', name: 'Chart Data', icon: Layout, path: 'data' },
    { type: 'type', name: 'Chart Type', icon: Square, path: 'chartType' },
    { type: 'legend', name: 'Legend', icon: Layout, path: 'legend' }
  ],
  checkout: [
    { type: 'title', name: 'Checkout Title', icon: Type, path: 'title' },
    { type: 'form', name: 'Checkout Form', icon: Layout, path: 'form' },
    { type: 'payment', name: 'Payment Section', icon: Layout, path: 'payment' }
  ],
  code: [
    { type: 'code-content', name: 'Code Content', icon: Code, path: 'code' },
    { type: 'language', name: 'Language', icon: Type, path: 'language' },
    { type: 'theme', name: 'Code Theme', icon: Palette, path: 'theme' }
  ],
  columns: [
    { type: 'column-1', name: 'Column 1', icon: Layout, path: 'column1' },
    { type: 'column-2', name: 'Column 2', icon: Layout, path: 'column2' },
    { type: 'column-3', name: 'Column 3', icon: Layout, path: 'column3' }
  ],
  comparison: [
    { type: 'title', name: 'Comparison Title', icon: Type, path: 'title' },
    { type: 'items', name: 'Comparison Items', icon: Layout, path: 'items' },
    { type: 'features', name: 'Feature List', icon: Layout, path: 'features' }
  ],
  contact: [
    { type: 'title', name: 'Contact Title', icon: Type, path: 'title' },
    { type: 'form', name: 'Contact Form', icon: Layout, path: 'form' },
    { type: 'info', name: 'Contact Info', icon: Layout, path: 'contactInfo' }
  ],
  container: [
    { type: 'content', name: 'Container Content', icon: Layout, path: 'children' },
    { type: 'background', name: 'Background', icon: Palette, path: 'backgroundColor' }
  ],
  countdown: [
    { type: 'title', name: 'Countdown Title', icon: Type, path: 'title' },
    { type: 'target-date', name: 'Target Date', icon: Type, path: 'targetDate' },
    { type: 'format', name: 'Time Format', icon: Type, path: 'format' }
  ],
  cta: [
    { type: 'title', name: 'CTA Title', icon: Type, path: 'title' },
    { type: 'description', name: 'CTA Description', icon: FileText, path: 'description' },
    { type: 'button', name: 'CTA Button', icon: MousePointer2, path: 'buttonText' }
  ],
  data: [
    { type: 'title', name: 'Data Title', icon: Type, path: 'title' },
    { type: 'source', name: 'Data Source', icon: Layout, path: 'dataSource' },
    { type: 'template', name: 'Display Template', icon: Layout, path: 'template' }
  ],
  divider: [
    { type: 'style', name: 'Divider Style', icon: Palette, path: 'style' },
    { type: 'thickness', name: 'Thickness', icon: Type, path: 'thickness' }
  ],
  embed: [
    { type: 'url', name: 'Embed URL', icon: Type, path: 'url' },
    { type: 'title', name: 'Embed Title', icon: Type, path: 'title' }
  ],
  'enhanced-button': [
    { type: 'text', name: 'Button Text', icon: Type, path: 'text' },
    { type: 'icon', name: 'Button Icon', icon: Square, path: 'icon' },
    { type: 'animation', name: 'Animation', icon: Square, path: 'animation' }
  ],
  faq: [
    { type: 'title', name: 'FAQ Title', icon: Type, path: 'title' },
    { type: 'items', name: 'FAQ Items', icon: Layout, path: 'items' }
  ],
  list: [
    { type: 'title', name: 'List Title', icon: Type, path: 'title' },
    { type: 'items', name: 'List Items', icon: Layout, path: 'items' },
    { type: 'style', name: 'List Style', icon: Palette, path: 'listStyle' }
  ],
  'logo-cloud': [
    { type: 'title', name: 'Logo Cloud Title', icon: Type, path: 'title' },
    { type: 'logos', name: 'Logo Images', icon: Layout, path: 'logos' }
  ],
  map: [
    { type: 'title', name: 'Map Title', icon: Type, path: 'title' },
    { type: 'location', name: 'Location', icon: Type, path: 'location' },
    { type: 'zoom', name: 'Zoom Level', icon: Type, path: 'zoom' }
  ],
  marquee: [
    { type: 'text', name: 'Marquee Text', icon: Type, path: 'text' },
    { type: 'speed', name: 'Animation Speed', icon: Type, path: 'speed' }
  ],
  metric: [
    { type: 'title', name: 'Metric Title', icon: Type, path: 'title' },
    { type: 'value', name: 'Metric Value', icon: Type, path: 'value' },
    { type: 'unit', name: 'Unit', icon: Type, path: 'unit' }
  ],
  newsletter: [
    { type: 'title', name: 'Newsletter Title', icon: Type, path: 'title' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'input', name: 'Email Input', icon: Layout, path: 'inputPlaceholder' },
    { type: 'button', name: 'Subscribe Button', icon: MousePointer2, path: 'buttonText' }
  ],
  product: [
    { type: 'image', name: 'Product Image', icon: Image, path: 'image' },
    { type: 'title', name: 'Product Title', icon: Type, path: 'title' },
    { type: 'description', name: 'Description', icon: FileText, path: 'description' },
    { type: 'price', name: 'Price', icon: Type, path: 'price' },
    { type: 'button', name: 'Buy Button', icon: MousePointer2, path: 'buttonText' }
  ],
  progress: [
    { type: 'title', name: 'Progress Title', icon: Type, path: 'title' },
    { type: 'value', name: 'Progress Value', icon: Type, path: 'value' },
    { type: 'max', name: 'Max Value', icon: Type, path: 'max' }
  ],
  quote: [
    { type: 'quote-text', name: 'Quote Text', icon: Type, path: 'quote' },
    { type: 'author', name: 'Author', icon: Type, path: 'author' },
    { type: 'source', name: 'Source', icon: Type, path: 'source' }
  ],
  rating: [
    { type: 'value', name: 'Rating Value', icon: Type, path: 'value' },
    { type: 'max', name: 'Max Rating', icon: Type, path: 'max' },
    { type: 'readonly', name: 'Read Only', icon: Square, path: 'readonly' }
  ],
  search: [
    { type: 'placeholder', name: 'Search Placeholder', icon: Type, path: 'placeholder' },
    { type: 'button', name: 'Search Button', icon: MousePointer2, path: 'buttonText' }
  ],
  section: [
    { type: 'content', name: 'Section Content', icon: Layout, path: 'children' },
    { type: 'background', name: 'Background', icon: Palette, path: 'backgroundColor' }
  ],
  sidebar: [
    { type: 'title', name: 'Sidebar Title', icon: Type, path: 'title' },
    { type: 'content', name: 'Sidebar Content', icon: Layout, path: 'content' }
  ],
  social: [
    { type: 'title', name: 'Social Title', icon: Type, path: 'title' },
    { type: 'links', name: 'Social Links', icon: Layout, path: 'socialLinks' }
  ],
  spacer: [
    { type: 'height', name: 'Spacer Height', icon: Type, path: 'height' }
  ],
  stats: [
    { type: 'title', name: 'Stats Title', icon: Type, path: 'title' },
    { type: 'stats', name: 'Statistics', icon: Layout, path: 'stats' }
  ],
  steps: [
    { type: 'title', name: 'Steps Title', icon: Type, path: 'title' },
    { type: 'steps', name: 'Step Items', icon: Layout, path: 'steps' }
  ],
  table: [
    { type: 'title', name: 'Table Title', icon: Type, path: 'title' },
    { type: 'headers', name: 'Table Headers', icon: Layout, path: 'headers' },
    { type: 'data', name: 'Table Data', icon: Layout, path: 'data' }
  ],
  'enhanced-table': [
    { type: 'title', name: 'Table Title', icon: Type, path: 'title' },
    { type: 'columns', name: 'Table Columns', icon: Layout, path: 'columns' },
    { type: 'data', name: 'Table Data', icon: Layout, path: 'data' },
    { type: 'filters', name: 'Table Filters', icon: Layout, path: 'filters' }
  ],
  tabs: [
    { type: 'tabs', name: 'Tab Items', icon: Layout, path: 'tabs' },
    { type: 'content', name: 'Tab Content', icon: Layout, path: 'content' }
  ],
  team: [
    { type: 'title', name: 'Team Title', icon: Type, path: 'title' },
    { type: 'members', name: 'Team Members', icon: Layout, path: 'members' }
  ],
  timeline: [
    { type: 'title', name: 'Timeline Title', icon: Type, path: 'title' },
    { type: 'events', name: 'Timeline Events', icon: Layout, path: 'events' }
  ],
  // E-commerce widgets
  ecommerce: [
    { type: 'title', name: 'Store Title', icon: Type, path: 'title' },
    { type: 'products', name: 'Product Grid', icon: Layout, path: 'products' },
    { type: 'filters', name: 'Product Filters', icon: Layout, path: 'filters' }
  ]
}

export function LayersPanel({ app }: LayersPanelProps) {
  const { 
    elements, 
    selectedElement, 
    selectElement, 
    deleteElement, 
    duplicateElement, 
    updateElement,
    selectSubElement,
    selectedSubElement
  } = useEditor()
  
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)

  // Create hierarchical layer structure with sub-elements
  const layerHierarchy = useMemo(() => {
    const layers: LayerElement[] = []
    
    // Sort elements by z-index (highest first)
    const sortedElements = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
    
    sortedElements.forEach(element => {
      const layer: LayerElement = {
        id: element.id,
        name: element.name || element.type,
        type: element.type,
        visible: element.visible !== false,
        locked: element.locked || false,
        zIndex: element.zIndex || 0,
        children: []
      }
      
      // Add sub-elements based on widget type
      const subElements = WIDGET_SUB_ELEMENTS[element.type as keyof typeof WIDGET_SUB_ELEMENTS]
      if (subElements) {
        layer.children = subElements.map(subEl => ({
          id: `${element.id}-${subEl.path}`,
          name: subEl.name,
          type: subEl.type,
          parentId: element.id,
          isSubElement: true,
          subElementType: subEl.type,
          elementPath: subEl.path,
          visible: true,
          locked: false
        }))
      }
      
      layers.push(layer)
    })
    
    return layers
  }, [elements])

  const toggleExpanded = useCallback((elementId: string) => {
    setExpandedElements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(elementId)) {
        newSet.delete(elementId)
      } else {
        newSet.add(elementId)
      }
      return newSet
    })
  }, [])

  const handleLayerSelect = useCallback((layer: LayerElement) => {
    if (layer.isSubElement && layer.parentId) {
      // Select sub-element
      const parentElement = elements.find(el => el.id === layer.parentId)
      if (parentElement) {
        selectElement(parentElement)
        selectSubElement?.(layer.elementPath || '', layer.subElementType || '')
      }
    } else {
      // Select main element
      selectElement(elements.find(el => el.id === layer.id) || null)
      selectSubElement?.('', '')
    }
  }, [elements, selectElement, selectSubElement])

  const handleToggleVisibility = useCallback((layer: LayerElement, e: React.MouseEvent) => {
    e.stopPropagation()
    if (layer.isSubElement) {
      // Handle sub-element visibility
      // This would require extending the element structure to support sub-element visibility
      console.log('Toggle sub-element visibility:', layer.id)
    } else {
      updateElement(layer.id, { visible: !layer.visible })
    }
  }, [updateElement])

  const handleToggleLock = useCallback((layer: LayerElement, e: React.MouseEvent) => {
    e.stopPropagation()
    if (layer.isSubElement) {
      // Handle sub-element lock
      console.log('Toggle sub-element lock:', layer.id)
    } else {
      updateElement(layer.id, { locked: !layer.locked })
    }
  }, [updateElement])

  const getLayerIcon = (layer: LayerElement) => {
    if (layer.isSubElement) {
      const subElements = WIDGET_SUB_ELEMENTS[elements.find(el => el.id === layer.parentId)?.type as keyof typeof WIDGET_SUB_ELEMENTS]
      const subElement = subElements?.find(sub => sub.path === layer.elementPath)
      return subElement?.icon || Type
    }
    
    // Main element icons
    const iconMap: Record<string, any> = {
      text: Type,
      heading: Type,
      paragraph: Type,
      image: Image,
      video: Video,
      audio: Music,
      button: MousePointer2,
      form: Layout,
      card: Square,
      hero: Layout,
      navbar: Layout,
      footer: Layout,
      'custom-code': Code,
      container: Square,
      section: Layout
    }
    
    return iconMap[layer.type] || Square
  }

  const renderLayer = (layer: LayerElement, depth = 0) => {
    const isSelected = layer.isSubElement 
      ? selectedSubElement?.path === layer.elementPath && selectedElement?.id === layer.parentId
      : selectedElement?.id === layer.id
    
    const isExpanded = expandedElements.has(layer.id)
    const hasChildren = layer.children && layer.children.length > 0
    const IconComponent = getLayerIcon(layer)

    return (
      <div key={layer.id}>
        <m.div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all mb-1 group",
            isSelected
              ? "bg-primary/10 border border-primary/30 shadow-sm"
              : "hover:bg-accent/50",
            layer.isSubElement && "ml-6 text-sm",
            layer.locked && "opacity-60"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleLayerSelect(layer)}
          onMouseEnter={() => setHoveredLayer(layer.id)}
          onMouseLeave={() => setHoveredLayer(null)}
          whileHover={{ x: layer.isSubElement ? 2 : 4 }}
          layout
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(layer.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          )}
          
          {/* Drag Handle */}
          {!layer.isSubElement && (
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          
          {/* Layer Icon */}
          <div className={cn(
            "flex items-center justify-center w-5 h-5 rounded",
            layer.isSubElement ? "bg-muted/50" : "bg-primary/10"
          )}>
            <IconComponent className={cn(
              "w-3 h-3",
              layer.isSubElement ? "text-muted-foreground" : "text-primary"
            )} />
          </div>
          
          {/* Layer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                "font-medium truncate",
                layer.isSubElement ? "text-xs" : "text-sm"
              )}>
                {layer.name}
              </p>
              {layer.isSubElement && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {layer.subElementType}
                </Badge>
              )}
            </div>
            {!layer.isSubElement && (
              <p className="text-xs text-muted-foreground truncate">
                {layer.type} • {hasChildren ? `${layer.children?.length} elements` : 'Simple'}
              </p>
            )}
          </div>

          {/* Layer Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleToggleVisibility(layer, e)}
            >
              {layer.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleToggleLock(layer, e)}
            >
              {layer.locked ? (
                <Lock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </Button>
            
            {!layer.isSubElement && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateElement(layer.id)
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteElement(layer.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </m.div>

        {/* Render Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {layer.children?.map(child => renderLayer(child, depth + 1))}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (layerHierarchy.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">No elements yet</p>
          <p className="text-xs mt-1">Drag widgets to the canvas to start building</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Layers</h3>
          <Badge variant="secondary" className="text-xs">
            {layerHierarchy.length} elements
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Click to select • Expand to see sub-elements
        </p>
      </div>

      {/* Layers List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Reorder.Group axis="y" values={layerHierarchy} onReorder={() => {}}>
            {layerHierarchy.map(layer => (
              <Reorder.Item key={layer.id} value={layer}>
                {renderLayer(layer)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </ScrollArea>
    </div>
  )
}
