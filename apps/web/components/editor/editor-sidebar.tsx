'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag } from 'react-dnd'
import { 
  Search, Plus, Grid, Type, Image, MousePointer2, FormInput, 
  CreditCard, List, BarChart, Video, Map, Share2, ShoppingCart, 
  Calendar, Users, FileText, Settings, Sparkles, Layers, Package, 
  Zap, Clock, Mail, MessageSquare, ArrowRight, CheckSquare, 
  GitBranch, Eye, Heart, Volume2, ExternalLink, Star, Database, 
  TrendingUp, ChevronRight, Table
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

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
      { id: 'footer', name: 'Footer', icon: Grid, description: 'Page footer', defaultHeight: 300 },
      { id: 'breadcrumb', name: 'Breadcrumb', icon: ChevronRight, description: 'Navigation breadcrumb', defaultHeight: 50 }
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
      { id: 'tabs', name: 'Tabs', icon: Grid, description: 'Tabbed content', defaultHeight: 300 },
      { id: 'quote', name: 'Quote', icon: MessageSquare, description: 'Blockquote', defaultHeight: 150 },
      { id: 'code', name: 'Code', icon: Settings, description: 'Code block', defaultHeight: 200 },
      { id: 'alert', name: 'Alert', icon: MessageSquare, description: 'Alert message', defaultHeight: 100 }
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
      { id: 'audio', name: 'Audio', icon: Volume2, description: 'Audio player', defaultHeight: 100 },
      { id: 'embed', name: 'Embed', icon: ExternalLink, description: 'Embed content', defaultHeight: 400 },
      { id: 'logo-cloud', name: 'Logo Cloud', icon: Image, description: 'Partner/client logos', defaultHeight: 150 }
    ]
  },
  interactive: {
    name: 'Interactive',
    icon: MousePointer2,
    color: 'bg-orange-500',
    widgets: [
      { id: 'button', name: 'Button', icon: MousePointer2, description: 'Clickable button', defaultHeight: 80 },
      { id: 'enhanced-button', name: 'Enhanced Button', icon: MousePointer2, description: 'Advanced button with animations', defaultHeight: 80 },
      { id: 'form', name: 'Form', icon: FormInput, description: 'Contact form', defaultHeight: 400 },
      { id: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Email signup', defaultHeight: 200 },
      { id: 'countdown', name: 'Countdown', icon: Clock, description: 'Countdown timer', defaultHeight: 250 },
      { id: 'progress', name: 'Progress', icon: BarChart, description: 'Progress bars', defaultHeight: 200 },
      { id: 'banner', name: 'Banner', icon: Sparkles, description: 'Announcement banner', defaultHeight: 60 },
      { id: 'rating', name: 'Rating', icon: Star, description: 'Star rating', defaultHeight: 80 }
    ]
  },
  business: {
    name: 'Business',
    icon: BarChart,
    color: 'bg-red-500',
    widgets: [
      { id: 'chart', name: 'Chart', icon: BarChart, description: 'Data charts', defaultHeight: 400 },
      { id: 'table', name: 'Table', icon: Grid, description: 'Data table', defaultHeight: 300 },
      { id: 'data-table', name: 'Data Table', icon: Table, description: 'Advanced data table', defaultHeight: 400 },
      { id: 'data', name: 'Data', icon: Database, description: 'Data display', defaultHeight: 300 },
      { id: 'metric', name: 'Metric', icon: TrendingUp, description: 'Key metrics', defaultHeight: 150 },
      { id: 'card', name: 'Card', icon: CreditCard, description: 'Content card', defaultHeight: 300 }
    ]
  },
  ecommerce: {
    name: 'E-commerce',
    icon: ShoppingCart,
    color: 'bg-indigo-500',
    widgets: [
      { id: 'product', name: 'Product', icon: Package, description: 'Product card', defaultHeight: 500 },
      { id: 'cart', name: 'Cart', icon: ShoppingCart, description: 'Shopping cart', defaultHeight: 600 },
      { id: 'checkout', name: 'Checkout', icon: CreditCard, description: 'Checkout form', defaultHeight: 800 }
    ]
  },
  advanced: {
    name: 'Advanced',
    icon: Zap,
    color: 'bg-yellow-500',
    widgets: [
      { id: 'map', name: 'Map', icon: Map, description: 'Interactive map', defaultHeight: 400 },
      { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Event calendar', defaultHeight: 400 },
      { id: 'search', name: 'Search', icon: Search, description: 'Search functionality', defaultHeight: 200 },
      { id: 'social', name: 'Social', icon: Share2, description: 'Social links', defaultHeight: 100 },
      { id: 'avatar-group', name: 'Avatar Group', icon: Users, description: 'User avatars', defaultHeight: 100 },
      { id: 'marquee', name: 'Marquee', icon: ArrowRight, description: 'Scrolling text', defaultHeight: 80 },
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
      ref={drag as any}
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

export function EditorSidebar({ onAddElement }: { onAddElement?: (element: any) => void }) {
  const [activeTab, setActiveTab] = useState('elements')
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
    <div className="w-80 h-full bg-card border-r flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
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
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
            <TabsTrigger value="widgets" className="text-xs">Widgets</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
          </TabsList>
        </div>

        {/* Elements Tab */}
        <TabsContent value="elements" className="flex-1 mt-4 overflow-hidden">
          <ElementLibraryContent onAddElement={onAddElement || (() => {})} />
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-6 pb-4">
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
                      {widgets.map((widget: any) => (
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
        <TabsContent value="templates" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-4 pb-4">
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
        <TabsContent value="ai" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-4 pb-4">
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

// Element Library Content Component (embedded version)
function ElementLibraryContent({ onAddElement }: { onAddElement: (element: any) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('hero')
  const [elements, setElements] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  // Element categories
  const ELEMENT_CATEGORIES = [
    { id: 'hero', name: 'Hero', icon: Sparkles },
    { id: 'features', name: 'Features', icon: Grid },
    { id: 'pricing', name: 'Pricing', icon: Package },
    { id: 'testimonials', name: 'Testimonials', icon: MessageSquare },
    { id: 'cta', name: 'CTA', icon: ArrowRight },
    { id: 'contact', name: 'Contact', icon: Mail },
    { id: 'stats', name: 'Stats', icon: BarChart },
  ]

  // Load elements for selected category
  useEffect(() => {
    loadElements(selectedCategory)
  }, [selectedCategory])

  const loadElements = async (category: string) => {
    if (elements[category]) return

    setLoading(true)
    try {
      // Try to load from API first, but fallback to mock data
      try {
        const response = await apiClient.get(`/api/v1/templates/elements/${category}`)
        setElements(prev => ({
          ...prev,
          [category]: response.data.elements || []
        }))
      } catch (apiError: any) {
        console.warn('API call failed, using mock data:', {
          url: `/api/v1/templates/elements/${category}`,
          error: apiError?.message,
          status: apiError?.response?.status,
          data: apiError?.response?.data
        })
        // Fallback to mock data
        setElements(prev => ({
          ...prev,
          [category]: getMockElements(category)
        }))
      }
    } catch (error) {
      console.error('Failed to load elements:', error)
      // Final fallback to mock data
      setElements(prev => ({
        ...prev,
        [category]: getMockElements(category)
      }))
    } finally {
      setLoading(false)
    }
  }

  const getMockElements = (category: string) => {
    const mockData: Record<string, any[]> = {
      hero: [
        {
          id: 'hero-centered',
          name: 'Centered Hero',
          description: 'Clean centered hero with title, subtitle and CTA',
          element: {
            type: 'hero',
            props: {
              title: 'Build Something Amazing',
              subtitle: 'The all-in-one platform to launch your next big idea',
              primaryCta: 'Get Started',
              secondaryCta: 'Learn More',
              alignment: 'center',
              backgroundType: 'gradient'
            }
          }
        },
        {
          id: 'hero-split',
          name: 'Split Hero',
          description: 'Hero with content on left and image on right',
          element: {
            type: 'hero',
            props: {
              title: 'Transform Your Business',
              subtitle: 'Powerful tools to help you grow faster',
              primaryCta: 'Start Free Trial',
              alignment: 'left',
              showImage: true,
              layout: 'split'
            }
          }
        },
        {
          id: 'hero-video',
          name: 'Video Hero',
          description: 'Hero section with background video',
          element: {
            type: 'hero',
            props: {
              title: 'See It In Action',
              subtitle: 'Watch how we can help you succeed',
              primaryCta: 'Watch Demo',
              backgroundType: 'video'
            }
          }
        }
      ],
      features: [
        {
          id: 'features-grid-3',
          name: '3-Column Features',
          description: 'Feature grid with icons and descriptions',
          element: {
            type: 'features',
            props: {
              title: 'Everything You Need',
              subtitle: 'Powerful features to help you succeed',
              columns: 3,
              features: [
                { icon: 'Zap', title: 'Lightning Fast', description: 'Built for speed' },
                { icon: 'Shield', title: 'Secure', description: 'Enterprise security' },
                { icon: 'Puzzle', title: 'Integrations', description: 'Connect everything' }
              ]
            }
          }
        },
        {
          id: 'features-alternating',
          name: 'Alternating Features',
          description: 'Features with alternating image layout',
          element: {
            type: 'features',
            props: {
              title: 'How It Works',
              variant: 'alternating',
              showImages: true,
              features: [
                {
                  title: 'Easy Setup',
                  description: 'Get started in minutes with our simple setup process'
                },
                {
                  title: 'Powerful Analytics',
                  description: 'Track your progress with detailed analytics and insights'
                }
              ]
            }
          }
        }
      ],
      pricing: [
        {
          id: 'pricing-3-tier',
          name: '3-Tier Pricing',
          description: 'Standard 3-tier pricing table',
          element: {
            type: 'pricing',
            props: {
              title: 'Simple Pricing',
              subtitle: 'Choose the plan that works for you',
              plans: [
                { name: 'Starter', price: '$9', period: '/month', features: ['5 Projects', 'Basic Support'] },
                { name: 'Pro', price: '$29', period: '/month', features: ['Unlimited Projects', 'Priority Support'], highlighted: true },
                { name: 'Enterprise', price: 'Custom', features: ['Custom Solutions', 'Dedicated Support'] }
              ]
            }
          }
        }
      ],
      testimonials: [
        {
          id: 'testimonials-grid',
          name: 'Testimonials Grid',
          description: 'Grid layout of customer testimonials',
          element: {
            type: 'testimonial',
            props: {
              title: 'What Our Customers Say',
              variant: 'grid',
              columns: 3,
              testimonials: [
                {
                  content: 'This product has completely transformed how we work.',
                  author: 'Sarah Johnson',
                  role: 'CEO, TechCorp',
                  rating: 5
                },
                {
                  content: 'Amazing support team and great features.',
                  author: 'Mike Chen',
                  role: 'Product Manager',
                  rating: 5
                },
                {
                  content: 'Easy to use and incredibly powerful.',
                  author: 'Emily Davis',
                  role: 'Designer',
                  rating: 5
                }
              ]
            }
          }
        }
      ],
      cta: [
        {
          id: 'cta-centered',
          name: 'Centered CTA',
          description: 'Simple centered call-to-action',
          element: {
            type: 'cta',
            props: {
              title: 'Ready to Get Started?',
              subtitle: 'Join thousands of satisfied customers',
              primaryCta: 'Start Free Trial',
              secondaryCta: 'Contact Sales'
            }
          }
        },
        {
          id: 'cta-newsletter',
          name: 'Newsletter Signup',
          description: 'Email newsletter subscription form',
          element: {
            type: 'newsletter',
            props: {
              title: 'Subscribe to Our Newsletter',
              subtitle: 'Get the latest updates delivered to your inbox',
              placeholder: 'Enter your email address',
              buttonText: 'Subscribe'
            }
          }
        }
      ],
      contact: [
        {
          id: 'contact-split',
          name: 'Split Contact',
          description: 'Contact form with company info',
          element: {
            type: 'contact',
            props: {
              title: 'Get in Touch',
              subtitle: 'We\'d love to hear from you',
              showForm: true,
              showInfo: true,
              layout: 'split'
            }
          }
        }
      ],
      stats: [
        {
          id: 'stats-simple',
          name: 'Simple Stats',
          description: 'Clean statistics counters',
          element: {
            type: 'stats',
            props: {
              stats: [
                { value: '10K+', label: 'Happy Customers' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
                { value: '50+', label: 'Countries' }
              ]
            }
          }
        }
      ]
    }
    return mockData[category] || []
  }

  const handleAddElement = (element: any) => {
    onAddElement({
      id: `${element.element.type}-${Date.now()}`,
      type: element.element.type,
      props: element.element.props,
      style: {
        width: '100%',
        minHeight: '200px'
      }
    })
  }

  const toggleFavorite = (elementId: string) => {
    setFavorites(prev => 
      prev.includes(elementId) 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    )
  }

  const currentElements = elements[selectedCategory] || []

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-4 pb-4">
        {/* Category Selector */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Categories</h3>
          <div className="grid grid-cols-2 gap-1">
            {ELEMENT_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="justify-start text-xs h-8"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Elements List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {currentElements.map((element) => (
                <motion.div
                  key={element.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="group hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{element.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {element.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(element.id)
                          }}
                          className="flex-shrink-0 ml-2 h-6 w-6 p-0"
                        >
                          <Heart className={cn(
                            "w-3 h-3",
                            favorites.includes(element.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          )} />
                        </Button>
                      </div>

                      {/* Preview */}
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded border mb-2 flex items-center justify-center">
                        <div className="text-center">
                          <Layers className="w-6 h-6 text-primary/30 mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Preview</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Preview functionality
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddElement(element)
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!loading && currentElements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No elements found</p>
              <p className="text-xs">Try a different category</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}