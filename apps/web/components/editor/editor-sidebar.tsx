'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag } from 'react-dnd'
import { Search, Plus, Grid, Type, Image, Button as ButtonIcon, Form, Card, List, BarChart, Video, Map, Share2, ShoppingCart, Calendar, Users, FileText, Settings, Sparkles, Layers, Package, Zap, Clock, Mail, MessageSquare, ArrowRight, CheckSquare, GitBranch } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Widget categories and definitions
const WIDGET_CATEGORIES = {
  sections: {
    name: 'Sections',
    icon: Layers,
    color: 'bg-violet-500',
    widgets: [
      { id: 'hero', name: 'Hero', icon: Sparkles, description: 'Hero section with CTA', defaultHeight: 600 },
      { id: 'features', name: 'Features', icon: Grid, description: 'Feature showcase grid', defaultHeight: 500 },
      { id: 'cta', name: 'Call to Action', icon: ArrowRight, description: 'CTA section', defaultHeight: 300 },
      { id: 'pricing', name: 'Pricing', icon: Package, description: 'Pricing tables', defaultHeight: 600 },
      { id: 'testimonial', name: 'Testimonials', icon: MessageSquare, description: 'Customer reviews', defaultHeight: 400 },
      { id: 'faq', name: 'FAQ', icon: MessageSquare, description: 'FAQ accordion', defaultHeight: 500 },
      { id: 'team', name: 'Team', icon: Users, description: 'Team members', defaultHeight: 500 },
      { id: 'contact', name: 'Contact', icon: Mail, description: 'Contact form section', defaultHeight: 600 },
      { id: 'stats', name: 'Statistics', icon: BarChart, description: 'Stats counters', defaultHeight: 200 },
      { id: 'steps', name: 'Steps', icon: CheckSquare, description: 'How it works steps', defaultHeight: 400 },
      { id: 'timeline', name: 'Timeline', icon: GitBranch, description: 'Timeline/roadmap', defaultHeight: 500 },
      { id: 'comparison', name: 'Comparison', icon: Grid, description: 'Feature comparison table', defaultHeight: 500 }
    ]
  },
  layout: {
    name: 'Layout',
    icon: Grid,
    color: 'bg-blue-500',
    widgets: [
      { id: 'container', name: 'Container', icon: Grid, description: 'Flexible container' },
      { id: 'section', name: 'Section', icon: Layers, description: 'Full-width section' },
      { id: 'columns', name: 'Columns', icon: Grid, description: 'Multi-column layout' },
      { id: 'spacer', name: 'Spacer', icon: Grid, description: 'Add spacing', defaultHeight: 60 },
      { id: 'divider', name: 'Divider', icon: Grid, description: 'Horizontal divider', defaultHeight: 40 },
      { id: 'navbar', name: 'Navigation', icon: Grid, description: 'Navigation bar', defaultHeight: 80 },
      { id: 'footer', name: 'Footer', icon: Grid, description: 'Page footer', defaultHeight: 300 }
    ]
  },
  content: {
    name: 'Content',
    icon: Type,
    color: 'bg-green-500',
    widgets: [
      { id: 'heading', name: 'Heading', icon: Type, description: 'H1-H6 headings', defaultHeight: 80 },
      { id: 'text', name: 'Text', icon: Type, description: 'Rich text block', defaultHeight: 100 },
      { id: 'paragraph', name: 'Paragraph', icon: FileText, description: 'Paragraph text', defaultHeight: 120 },
      { id: 'list', name: 'List', icon: List, description: 'Bullet/numbered list', defaultHeight: 200 },
      { id: 'accordion', name: 'Accordion', icon: List, description: 'Collapsible content', defaultHeight: 300 },
      { id: 'tabs', name: 'Tabs', icon: Grid, description: 'Tabbed content', defaultHeight: 300 }
    ]
  },
  media: {
    name: 'Media',
    icon: Image,
    color: 'bg-purple-500',
    widgets: [
      { id: 'image', name: 'Image', icon: Image, description: 'Responsive image', defaultHeight: 400 },
      { id: 'gallery', name: 'Gallery', icon: Image, description: 'Image gallery', defaultHeight: 500 },
      { id: 'video', name: 'Video', icon: Video, description: 'YouTube/Vimeo/file', defaultHeight: 450, defaultProps: { videoType: 'youtube', aspectRatio: '16:9' } },
      { id: 'logo-cloud', name: 'Logo Cloud', icon: Image, description: 'Partner/client logos', defaultHeight: 150 }
    ]
  },
  interactive: {
    name: 'Interactive',
    icon: ButtonIcon,
    color: 'bg-orange-500',
    widgets: [
      { id: 'button', name: 'Button', icon: ButtonIcon, description: 'Clickable button', defaultHeight: 80 },
      { id: 'form', name: 'Form', icon: Form, description: 'Contact form', defaultHeight: 400 },
      { id: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email signup', defaultHeight: 200 },
      { id: 'countdown', name: 'Countdown', icon: Clock, description: 'Countdown timer', defaultHeight: 250 },
      { id: 'progress', name: 'Progress', icon: BarChart, description: 'Progress bars', defaultHeight: 200 },
      { id: 'banner', name: 'Banner', icon: Sparkles, description: 'Announcement banner', defaultHeight: 60 }
    ]
  },
  business: {
    name: 'Business',
    icon: BarChart,
    color: 'bg-red-500',
    widgets: [
      { id: 'chart', name: 'Chart', icon: BarChart, description: 'Data charts', defaultHeight: 400 },
      { id: 'table', name: 'Table', icon: Grid, description: 'Data table', defaultHeight: 300 },
      { id: 'card', name: 'Card', icon: Card, description: 'Content card', defaultHeight: 300 }
    ]
  },
  ecommerce: {
    name: 'E-commerce',
    icon: ShoppingCart,
    color: 'bg-indigo-500',
    widgets: [
      { id: 'product', name: 'Product', icon: Package, description: 'Product card' },
      { id: 'cart', name: 'Cart', icon: ShoppingCart, description: 'Shopping cart' },
      { id: 'checkout', name: 'Checkout', icon: ShoppingCart, description: 'Checkout form' }
    ]
  },
  advanced: {
    name: 'Advanced',
    icon: Zap,
    color: 'bg-yellow-500',
    widgets: [
      { id: 'map', name: 'Map', icon: Map, description: 'Interactive map', defaultHeight: 400 },
      { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Event calendar', defaultHeight: 400 },
      { id: 'social', name: 'Social', icon: Share2, description: 'Social links', defaultHeight: 100 },
      { id: 'custom', name: 'Custom Code', icon: Settings, description: 'HTML/CSS/JS', defaultHeight: 200 }
    ]
  }
}

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', count: 150 },
  { id: 'business', name: 'Business', count: 45 },
  { id: 'ecommerce', name: 'E-commerce', count: 32 },
  { id: 'portfolio', name: 'Portfolio', count: 28 },
  { id: 'blog', name: 'Blog', count: 25 },
  { id: 'landing', name: 'Landing Page', count: 20 }
]

// Draggable widget component
function DraggableWidget({ widget, category }: { widget: any, category: string }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: {
      type: 'widget',
      widgetType: widget.id,
      category,
      defaultWidth: widget.defaultWidth || 200,
      defaultHeight: widget.defaultHeight || 200,
      defaultProps: widget.defaultProps || {},
      defaultStyle: widget.defaultStyle || {}
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const IconComponent = widget.icon

  return (
    <motion.div
      ref={drag}
      className={cn(
        "group p-3 rounded-lg border-2 border-dashed border-transparent hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all duration-200",
        "bg-card hover:bg-accent/50",
        isDragging && "opacity-50 scale-95"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center text-white text-sm",
          WIDGET_CATEGORIES[category as keyof typeof WIDGET_CATEGORIES]?.color || 'bg-gray-500'
        )}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{widget.name}</p>
          <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function EditorSidebar() {
  const [activeTab, setActiveTab] = useState('widgets')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    const filtered: any = {}
    
    Object.entries(WIDGET_CATEGORIES).forEach(([categoryKey, category]) => {
      filtered[categoryKey] = category.widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    
    return filtered
  }, [searchQuery])

  return (
    <div className="w-80 h-full bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold">Add Elements</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="widgets">Widgets</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
        </TabsList>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="flex-1 mt-4">
          <ScrollArea className="h-full px-4">
            <div className="space-y-6 pb-4">
              {Object.entries(WIDGET_CATEGORIES).map(([categoryKey, category]) => {
                const widgets = filteredWidgets[categoryKey] || []
                if (widgets.length === 0) return null

                const IconComponent = category.icon

                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center text-white text-xs",
                        category.color
                      )}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {widgets.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {widgets.map((widget) => (
                        <DraggableWidget
                          key={widget.id}
                          widget={widget}
                          category={categoryKey}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 mt-4">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 pb-4">
              {/* Template Categories */}
              <div className="space-y-2">
                {TEMPLATE_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary">{category.count}</Badge>
                  </Button>
                ))}
              </div>

              <Separator />

              {/* Featured Templates */}
              <div>
                <h3 className="font-medium text-sm mb-3">Featured Templates</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="aspect-[4/3] bg-muted rounded-lg border cursor-pointer overflow-hidden group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <div className="text-white text-center">
                          <Grid className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-xs font-medium">Template {i}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* AI Generate Tab */}
        <TabsContent value="ai" className="flex-1 mt-4">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 pb-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">AI-Powered Generation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe what you want to build and let AI create it for you
                </p>
                
                <div className="space-y-3">
                  <Input placeholder="Describe your widget or section..." />
                  <Button className="w-full" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </div>

              <Separator />

              {/* AI Suggestions */}
              <div>
                <h4 className="font-medium text-sm mb-3">Quick Suggestions</h4>
                <div className="space-y-2">
                  {[
                    'Hero section with call-to-action',
                    'Product showcase grid',
                    'Contact form with validation',
                    'Pricing table comparison',
                    'Team member cards',
                    'Blog post layout'
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                    >
                      <Sparkles className="w-3 h-3 mr-2 text-purple-500" />
                      <span className="text-xs">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}