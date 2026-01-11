'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Grid, Type, Image, MousePointer2, FormInput, 
  CreditCard, List, BarChart, Video, Map, Share2, ShoppingCart, 
  Calendar, Users, FileText, Settings, Sparkles, Layers, Package, 
  Zap, Clock, Mail, MessageSquare, ArrowRight, CheckSquare, 
  GitBranch, Star, Download, Eye, Heart, Filter
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

// Element categories
const ELEMENT_CATEGORIES = [
  { id: 'hero', name: 'Hero Sections', icon: Sparkles, color: 'bg-violet-500' },
  { id: 'features', name: 'Features', icon: Grid, color: 'bg-blue-500' },
  { id: 'pricing', name: 'Pricing', icon: Package, color: 'bg-green-500' },
  { id: 'testimonials', name: 'Testimonials', icon: MessageSquare, color: 'bg-purple-500' },
  { id: 'cta', name: 'Call to Action', icon: ArrowRight, color: 'bg-orange-500' },
  { id: 'contact', name: 'Contact', icon: Mail, color: 'bg-red-500' },
  { id: 'stats', name: 'Statistics', icon: BarChart, color: 'bg-indigo-500' },
  { id: 'content', name: 'Content', icon: Type, color: 'bg-gray-500' },
  { id: 'media', name: 'Media', icon: Image, color: 'bg-pink-500' },
]

interface ElementTemplate {
  id: string
  name: string
  description: string
  element: {
    type: string
    props: any
  }
}

interface ElementLibraryProps {
  onAddElement: (element: any) => void
}

export function ElementLibrary({ onAddElement }: ElementLibraryProps) {
  const [activeTab, setActiveTab] = useState('elements')
  const [selectedCategory, setSelectedCategory] = useState('hero')
  const [searchQuery, setSearchQuery] = useState('')
  const [elements, setElements] = useState<Record<string, ElementTemplate[]>>({})
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  // Load elements for selected category
  useEffect(() => {
    if (activeTab === 'elements') {
      loadElements(selectedCategory)
    }
  }, [selectedCategory, activeTab])

  const loadElements = async (category: string) => {
    if (elements[category]) return // Already loaded

    setLoading(true)
    try {
      const response = await apiClient.get(`/api/templates/elements/${category}`)
      setElements(prev => ({
        ...prev,
        [category]: response.data.elements || []
      }))
    } catch (error) {
      console.error('Failed to load elements:', error)
      // Fallback to mock data
      setElements(prev => ({
        ...prev,
        [category]: getMockElements(category)
      }))
    } finally {
      setLoading(false)
    }
  }

  const getMockElements = (category: string): ElementTemplate[] => {
    const mockData: Record<string, ElementTemplate[]> = {
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
              subtitle: 'Powerful tools to help you grow faster than ever before',
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
                { icon: 'Zap', title: 'Lightning Fast', description: 'Built for speed and performance' },
                { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade security' },
                { icon: 'Puzzle', title: 'Integrations', description: 'Connect with your favorite tools' }
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
              showImages: true
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
                {
                  name: 'Starter',
                  price: '$9',
                  period: '/month',
                  features: ['5 Projects', 'Basic Support', '1GB Storage']
                },
                {
                  name: 'Pro',
                  price: '$29',
                  period: '/month',
                  features: ['Unlimited Projects', 'Priority Support', '10GB Storage'],
                  highlighted: true
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  features: ['Custom Solutions', 'Dedicated Support', 'Unlimited Storage']
                }
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
              subtitle: 'Join thousands of satisfied customers today',
              primaryCta: 'Start Free Trial',
              secondaryCta: 'Contact Sales'
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

  const filteredElements = elements[selectedCategory]?.filter(element =>
    element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    element.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const toggleFavorite = (elementId: string) => {
    setFavorites(prev => 
      prev.includes(elementId) 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    )
  }

  const handleAddElement = (element: ElementTemplate) => {
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

  return (
    <div className="w-80 h-full bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold">Element Library</h2>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        {/* Elements Tab */}
        <TabsContent value="elements" className="flex-1 mt-4">
          {/* Categories */}
          <div className="px-4 mb-4">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {ELEMENT_CATEGORIES.map((category) => {
                  const Icon = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex-shrink-0"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {category.name}
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Elements Grid */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredElements.map((element) => (
                    <ElementCard
                      key={element.id}
                      element={element}
                      isFavorite={favorites.includes(element.id)}
                      onToggleFavorite={() => toggleFavorite(element.id)}
                      onAdd={() => handleAddElement(element)}
                    />
                  ))}
                </AnimatePresence>
              )}

              {!loading && filteredElements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No elements found</p>
                  <p className="text-xs">Try a different category or search term</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="flex-1 mt-4">
          <ScrollArea className="h-full px-4">
            <div className="space-y-3 pb-4">
              {favorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No favorites yet</p>
                  <p className="text-xs">Heart elements to save them here</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {favorites.length} favorite element{favorites.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="flex-1 mt-4">
          <ScrollArea className="h-full px-4">
            <div className="space-y-3 pb-4">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent elements</p>
                <p className="text-xs">Recently used elements will appear here</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Element Card Component
function ElementCard({
  element,
  isFavorite,
  onToggleFavorite,
  onAdd
}: {
  element: ElementTemplate
  isFavorite: boolean
  onToggleFavorite: () => void
  onAdd: () => void
}) {
  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="group hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
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
                onToggleFavorite()
              }}
              className="flex-shrink-0 ml-2"
            >
              <Heart className={cn(
                "w-4 h-4",
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )} />
            </Button>
          </div>

          {/* Preview */}
          <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border mb-3 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-8 h-8 text-primary/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
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
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </m.div>
  )
}