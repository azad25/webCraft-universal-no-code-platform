'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import {
  Link as LinkIcon,
  ExternalLink,
  FileText,
  Database,
  Hash,
  Globe,
  ArrowRight,
  Settings,
  Eye,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  Zap,
  Target,
  MousePointer,
  Navigation,
  Bookmark,
  Code,
  Layers,
  ChevronRight,
  Home,
  User,
  ShoppingCart,
  Mail,
  Phone,
  Calendar,
  Map
} from 'lucide-react'

interface LinkConfig {
  type: 'page' | 'section' | 'data' | 'custom' | 'external' | 'action'
  target: string
  label?: string
  openInNewTab?: boolean
  parameters?: Record<string, any>
  conditions?: string[]
  tracking?: {
    event: string
    properties?: Record<string, any>
  }
}

interface LinkManagerProps {
  isOpen?: boolean
  onClose?: () => void
  onSelect?: (linkConfig: LinkConfig) => void
  currentLink?: LinkConfig
  elementType?: string
  appId?: string
  trigger?: React.ReactNode
}

// Predefined link templates
const LINK_TEMPLATES = {
  navigation: [
    { id: 'home', label: 'Home Page', icon: Home, type: 'page', target: 'home' },
    { id: 'about', label: 'About Page', icon: FileText, type: 'page', target: 'about' },
    { id: 'contact', label: 'Contact Page', icon: Mail, type: 'page', target: 'contact' },
    { id: 'services', label: 'Services Page', icon: Settings, type: 'page', target: 'services' }
  ],
  sections: [
    { id: 'hero', label: 'Hero Section', icon: Target, type: 'section', target: '#hero' },
    { id: 'features', label: 'Features Section', icon: Zap, type: 'section', target: '#features' },
    { id: 'pricing', label: 'Pricing Section', icon: ShoppingCart, type: 'section', target: '#pricing' },
    { id: 'testimonials', label: 'Testimonials', icon: User, type: 'section', target: '#testimonials' }
  ],
  actions: [
    { id: 'call', label: 'Phone Call', icon: Phone, type: 'external', target: 'tel:' },
    { id: 'email', label: 'Send Email', icon: Mail, type: 'external', target: 'mailto:' },
    { id: 'calendar', label: 'Schedule Meeting', icon: Calendar, type: 'external', target: 'https://calendly.com/' },
    { id: 'map', label: 'View Location', icon: Map, type: 'external', target: 'https://maps.google.com/' }
  ],
  ecommerce: [
    { id: 'product', label: 'Product Detail', icon: ShoppingCart, type: 'custom', target: '/products/[id]' },
    { id: 'category', label: 'Product Category', icon: Layers, type: 'custom', target: '/category/[slug]' },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, type: 'page', target: 'cart' },
    { id: 'checkout', label: 'Checkout', icon: CreditCard, type: 'page', target: 'checkout' }
  ]
}

// Dynamic route patterns
const ROUTE_PATTERNS = [
  { pattern: '/[id]', description: 'Dynamic ID route', example: '/123' },
  { pattern: '/[slug]', description: 'Dynamic slug route', example: '/my-post' },
  { pattern: '/[id]/pages', description: 'Nested pages route', example: '/123/pages' },
  { pattern: '/[category]/[id]', description: 'Category with ID', example: '/products/123' },
  { pattern: '/[...slug]', description: 'Catch-all route', example: '/path/to/page' },
  { pattern: '/api/[...path]', description: 'API route', example: '/api/users/123' }
]

export function LinkManager({
  isOpen = false,
  onClose,
  onSelect,
  currentLink,
  elementType = 'button',
  appId,
  trigger
}: LinkManagerProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'sections' | 'data' | 'custom' | 'external' | 'actions'>('pages')
  const [linkConfig, setLinkConfig] = useState<LinkConfig>(
    currentLink || {
      type: 'page',
      target: '',
      label: '',
      openInNewTab: false,
      parameters: {},
      conditions: []
    }
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [pages, setPages] = useState<any[]>([])
  const [dataSources, setDataSources] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const { currentPage, pages: allPages } = useEditor()

  // Load available pages, sections, and data sources
  useEffect(() => {
    if (isOpen && appId) {
      loadLinkTargets()
    }
  }, [isOpen, appId])

  const loadLinkTargets = async () => {
    setIsLoading(true)
    try {
      // Load pages
      setPages(allPages || [])
      
      // Load sections from current page
      if (currentPage?.content?.elements) {
        const pageSections = currentPage.content.elements
          .filter((el: any) => el.props?.id || el.id)
          .map((el: any) => ({
            id: el.props?.id || el.id,
            label: el.props?.title || el.props?.text || `${el.type} section`,
            type: el.type
          }))
        setSections(pageSections)
      }
      
      // Load data sources (mock for now)
      setDataSources([
        { id: 'products', label: 'Products', type: 'collection' },
        { id: 'users', label: 'Users', type: 'collection' },
        { id: 'posts', label: 'Blog Posts', type: 'collection' },
        { id: 'api-data', label: 'External API', type: 'api' }
      ])
    } catch (error) {
      console.error('Failed to load link targets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update preview URL when link config changes
  useEffect(() => {
    updatePreviewUrl()
  }, [linkConfig])

  const updatePreviewUrl = () => {
    let url = ''
    switch (linkConfig.type) {
      case 'page':
        url = `/${linkConfig.target}`
        break
      case 'section':
        url = `${window.location.pathname}${linkConfig.target}`
        break
      case 'data':
        url = `/data/${linkConfig.target}`
        if (linkConfig.parameters?.id) {
          url += `/${linkConfig.parameters.id}`
        }
        break
      case 'custom':
        url = linkConfig.target
        // Replace parameters
        if (linkConfig.parameters) {
          Object.entries(linkConfig.parameters).forEach(([key, value]) => {
            url = url.replace(`[${key}]`, String(value))
          })
        }
        break
      case 'external':
        url = linkConfig.target
        break
      case 'action':
        url = `Action: ${linkConfig.target}`
        break
    }
    setPreviewUrl(url)
  }

  const handleLinkConfigChange = (updates: Partial<LinkConfig>) => {
    setLinkConfig(prev => ({ ...prev, ...updates }))
  }

  const handleParameterChange = (key: string, value: string) => {
    setLinkConfig(prev => ({
      ...prev,
      parameters: { ...prev.parameters, [key]: value }
    }))
  }

  const handleSave = () => {
    onSelect?.(linkConfig)
    onClose?.()
  }

  const renderPagesTab = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {pages
          .filter(page => 
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.slug.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(page => (
            <div
              key={page.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                linkConfig.type === 'page' && linkConfig.target === page.slug
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
              onClick={() => handleLinkConfigChange({ type: 'page', target: page.slug, label: page.title })}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{page.title}</p>
                  <p className="text-xs text-muted-foreground">/{page.slug}</p>
                </div>
              </div>
              {page.is_homepage && (
                <Badge variant="secondary" className="text-xs">Home</Badge>
              )}
            </div>
          ))}
      </div>

      {/* Quick Templates */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Quick Links</Label>
        <div className="grid grid-cols-2 gap-2">
          {LINK_TEMPLATES.navigation.map(template => {
            const Icon = template.icon
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleLinkConfigChange({
                  type: template.type as any,
                  target: template.target,
                  label: template.label
                })}
              >
                <Icon className="w-4 h-4" />
                {template.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderSectionsTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Page Sections</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sections.map(section => (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                linkConfig.type === 'section' && linkConfig.target === `#${section.id}`
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
              onClick={() => handleLinkConfigChange({
                type: 'section',
                target: `#${section.id}`,
                label: section.label
              })}
            >
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{section.label}</p>
                <p className="text-xs text-muted-foreground">#{section.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Section Templates */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Common Sections</Label>
        <div className="grid grid-cols-2 gap-2">
          {LINK_TEMPLATES.sections.map(template => {
            const Icon = template.icon
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleLinkConfigChange({
                  type: 'section',
                  target: template.target,
                  label: template.label
                })}
              >
                <Icon className="w-4 h-4" />
                {template.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Custom Section ID */}
      <div>
        <Label className="text-sm font-medium m