'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, Layout, Type, Image, Users, DollarSign, 
  MessageSquare, HelpCircle, Mail, BarChart, ArrowRight,
  ChevronRight, Plus, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Section template categories
const SECTION_CATEGORIES = [
  { id: 'hero', name: 'Hero', icon: Sparkles },
  { id: 'features', name: 'Features', icon: Layout },
  { id: 'content', name: 'Content', icon: Type },
  { id: 'media', name: 'Media', icon: Image },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'pricing', name: 'Pricing', icon: DollarSign },
  { id: 'testimonials', name: 'Testimonials', icon: MessageSquare },
  { id: 'faq', name: 'FAQ', icon: HelpCircle },
  { id: 'cta', name: 'CTA', icon: ArrowRight },
  { id: 'contact', name: 'Contact', icon: Mail },
  { id: 'stats', name: 'Stats', icon: BarChart },
]

// Premade section templates
const SECTION_TEMPLATES = [
  // Hero Sections
  {
    id: 'hero-centered',
    name: 'Centered Hero',
    category: 'hero',
    preview: 'gradient',
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
    category: 'hero',
    preview: 'split',
    element: {
      type: 'hero',
      props: {
        title: 'Transform Your Business',
        subtitle: 'Powerful tools to help you grow',
        primaryCta: 'Start Free Trial',
        alignment: 'left',
        showImage: true
      }
    }
  },
  {
    id: 'hero-video',
    name: 'Video Hero',
    category: 'hero',
    preview: 'video',
    element: {
      type: 'hero',
      props: {
        title: 'See It In Action',
        subtitle: 'Watch how we can help you succeed',
        primaryCta: 'Watch Demo',
        backgroundType: 'video'
      }
    }
  },
  
  // Features Sections
  {
    id: 'features-grid-3',
    name: '3-Column Features',
    category: 'features',
    preview: 'grid-3',
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
    id: 'features-grid-4',
    name: '4-Column Features',
    category: 'features',
    preview: 'grid-4',
    element: {
      type: 'features',
      props: {
        title: 'Why Choose Us',
        columns: 4,
        variant: 'icons'
      }
    }
  },
  {
    id: 'features-alternating',
    name: 'Alternating Features',
    category: 'features',
    preview: 'alternating',
    element: {
      type: 'features',
      props: {
        title: 'How It Works',
        variant: 'alternating',
        showImages: true
      }
    }
  },

  // Pricing Sections
  {
    id: 'pricing-3-tier',
    name: '3-Tier Pricing',
    category: 'pricing',
    preview: 'pricing-3',
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
  },
  {
    id: 'pricing-toggle',
    name: 'Pricing with Toggle',
    category: 'pricing',
    preview: 'pricing-toggle',
    element: {
      type: 'pricing',
      props: {
        title: 'Flexible Pricing',
        showToggle: true,
        toggleLabels: ['Monthly', 'Yearly']
      }
    }
  },
  
  // Testimonials
  {
    id: 'testimonials-grid',
    name: 'Testimonials Grid',
    category: 'testimonials',
    preview: 'testimonials-grid',
    element: {
      type: 'testimonial',
      props: {
        title: 'What Our Customers Say',
        variant: 'grid',
        columns: 3
      }
    }
  },
  {
    id: 'testimonials-carousel',
    name: 'Testimonials Carousel',
    category: 'testimonials',
    preview: 'testimonials-carousel',
    element: {
      type: 'testimonial',
      props: {
        title: 'Customer Stories',
        variant: 'carousel'
      }
    }
  },
  {
    id: 'testimonials-large',
    name: 'Large Testimonial',
    category: 'testimonials',
    preview: 'testimonials-large',
    element: {
      type: 'testimonial',
      props: {
        variant: 'large',
        showRating: true
      }
    }
  },
  
  // Team Sections
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'team',
    preview: 'team-grid',
    element: {
      type: 'team',
      props: {
        title: 'Meet Our Team',
        columns: 4,
        showSocial: true
      }
    }
  },
  {
    id: 'team-cards',
    name: 'Team Cards',
    category: 'team',
    preview: 'team-cards',
    element: {
      type: 'team',
      props: {
        title: 'Leadership',
        variant: 'cards',
        showBio: true
      }
    }
  },
  
  // FAQ Sections
  {
    id: 'faq-accordion',
    name: 'FAQ Accordion',
    category: 'faq',
    preview: 'faq-accordion',
    element: {
      type: 'faq',
      props: {
        title: 'Frequently Asked Questions',
        variant: 'accordion'
      }
    }
  },
  {
    id: 'faq-two-column',
    name: 'Two-Column FAQ',
    category: 'faq',
    preview: 'faq-two-col',
    element: {
      type: 'faq',
      props: {
        title: 'Common Questions',
        columns: 2
      }
    }
  },
  
  // CTA Sections
  {
    id: 'cta-centered',
    name: 'Centered CTA',
    category: 'cta',
    preview: 'cta-centered',
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
    name: 'Newsletter CTA',
    category: 'cta',
    preview: 'cta-newsletter',
    element: {
      type: 'newsletter',
      props: {
        title: 'Subscribe to Our Newsletter',
        subtitle: 'Get the latest updates delivered to your inbox',
        buttonText: 'Subscribe'
      }
    }
  },
  {
    id: 'cta-gradient',
    name: 'Gradient CTA',
    category: 'cta',
    preview: 'cta-gradient',
    element: {
      type: 'cta',
      props: {
        title: "Don't Miss Out",
        primaryCta: 'Get Started Now',
        variant: 'gradient'
      }
    }
  },
  
  // Contact Sections
  {
    id: 'contact-split',
    name: 'Split Contact',
    category: 'contact',
    preview: 'contact-split',
    element: {
      type: 'contact',
      props: {
        title: 'Get in Touch',
        showForm: true,
        showInfo: true,
        layout: 'split'
      }
    }
  },
  {
    id: 'contact-map',
    name: 'Contact with Map',
    category: 'contact',
    preview: 'contact-map',
    element: {
      type: 'contact',
      props: {
        title: 'Visit Us',
        showForm: true,
        showMap: true
      }
    }
  },
  
  // Stats Sections
  {
    id: 'stats-simple',
    name: 'Simple Stats',
    category: 'stats',
    preview: 'stats-simple',
    element: {
      type: 'stats',
      props: {
        stats: [
          { value: '10K+', label: 'Customers' },
          { value: '99.9%', label: 'Uptime' },
          { value: '24/7', label: 'Support' },
          { value: '50+', label: 'Countries' }
        ]
      }
    }
  },
  {
    id: 'stats-background',
    name: 'Stats with Background',
    category: 'stats',
    preview: 'stats-bg',
    element: {
      type: 'stats',
      props: {
        variant: 'background',
        animated: true
      }
    }
  },
  
  // Content Sections
  {
    id: 'content-two-column',
    name: 'Two Column Content',
    category: 'content',
    preview: 'content-2col',
    element: {
      type: 'columns',
      props: {
        columns: 2,
        gap: 'lg'
      }
    }
  },
  {
    id: 'content-timeline',
    name: 'Timeline',
    category: 'content',
    preview: 'timeline',
    element: {
      type: 'timeline',
      props: {
        title: 'Our Journey',
        items: []
      }
    }
  },
  
  // Media Sections
  {
    id: 'media-gallery',
    name: 'Image Gallery',
    category: 'media',
    preview: 'gallery',
    element: {
      type: 'gallery',
      props: {
        title: 'Gallery',
        layout: 'masonry',
        columns: 3
      }
    }
  },
  {
    id: 'media-video',
    name: 'Video Section',
    category: 'media',
    preview: 'video',
    element: {
      type: 'video',
      props: {
        title: 'Watch Our Story',
        videoType: 'youtube'
      }
    }
  },
  {
    id: 'media-logo-cloud',
    name: 'Logo Cloud',
    category: 'media',
    preview: 'logos',
    element: {
      type: 'logo-cloud',
      props: {
        title: 'Trusted By',
        variant: 'simple'
      }
    }
  }
]

interface SectionTemplatesProps {
  onSelectSection: (element: any) => void
}

export function SectionTemplates({ onSelectSection }: SectionTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('hero')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSections = SECTION_TEMPLATES.filter(section => {
    const matchesCategory = section.category === selectedCategory
    const matchesSearch = !searchQuery || 
      section.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <Input
          placeholder="Search sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <ScrollArea className="border-b">
        <div className="flex gap-1 p-2">
          {SECTION_CATEGORIES.map((category) => {
            const Icon = category.icon
            const count = SECTION_TEMPLATES.filter(s => s.category === category.id).length
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex-shrink-0"
              >
                <Icon className="w-4 h-4 mr-1" />
                {category.name}
                <Badge variant="outline" className="ml-1 text-xs">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Sections Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredSections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <button
                onClick={() => onSelectSection(section.element)}
                className="w-full text-left"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center mb-2">
                  <Layout className="w-8 h-8 text-primary/30" />
                </div>
                <p className="text-sm font-medium">{section.name}</p>
              </button>
            </motion.div>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sections found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
