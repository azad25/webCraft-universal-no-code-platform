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
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart, type: 'page', target: 'checkout' }
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
        <Label className="text-sm font-medium mb-2 block">Custom Section</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="section-id"
              value={linkConfig.type === 'section' ? linkConfig.target.replace('#', '') : ''}
              onChange={(e) => handleLinkConfigChange({
                type: 'section',
                target: `#${e.target.value}`,
                label: `${e.target.value} section`
              })}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Data Sources</Label>
        <div className="space-y-2">
          {dataSources.map(source => (
            <div
              key={source.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                linkConfig.type === 'data' && linkConfig.target === source.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
              onClick={() => handleLinkConfigChange({
                type: 'data',
                target: source.id,
                label: source.label
              })}
            >
              <Database className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{source.label}</p>
                <p className="text-xs text-muted-foreground">{source.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Parameters */}
      {linkConfig.type === 'data' && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Parameters</Label>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Record ID</Label>
              <Input
                placeholder="e.g., 123 or [dynamic]"
                value={linkConfig.parameters?.id || ''}
                onChange={(e) => handleParameterChange('id', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Filter</Label>
              <Input
                placeholder="e.g., category=featured"
                value={linkConfig.parameters?.filter || ''}
                onChange={(e) => handleParameterChange('filter', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderCustomTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Custom Route</Label>
        <Input
          placeholder="/custom/path/[id]"
          value={linkConfig.target}
          onChange={(e) => handleLinkConfigChange({ type: 'custom', target: e.target.value })}
        />
      </div>

      {/* Route Patterns */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Common Patterns</Label>
        <div className="space-y-2">
          {ROUTE_PATTERNS.map((pattern, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded border hover:bg-muted cursor-pointer"
              onClick={() => handleLinkConfigChange({ type: 'custom', target: pattern.pattern })}
            >
              <div>
                <p className="font-mono text-sm">{pattern.pattern}</p>
                <p className="text-xs text-muted-foreground">{pattern.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">{pattern.example}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters for custom routes */}
      {linkConfig.target.includes('[') && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Route Parameters</Label>
          <div className="space-y-2">
            {linkConfig.target.match(/\[([^\]]+)\]/g)?.map(param => {
              const paramName = param.replace(/[\[\]]/g, '')
              return (
                <div key={paramName}>
                  <Label className="text-xs">{paramName}</Label>
                  <Input
                    placeholder={`Value for ${paramName}`}
                    value={linkConfig.parameters?.[paramName] || ''}
                    onChange={(e) => handleParameterChange(paramName, e.target.value)}
                    className="mt-1"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* E-commerce Templates */}
      <div>
        <Label className="text-sm font-medium mb-2 block">E-commerce Routes</Label>
        <div className="grid grid-cols-1 gap-2">
          {LINK_TEMPLATES.ecommerce.map(template => {
            const Icon = template.icon
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleLinkConfigChange({
                  type: 'custom',
                  target: template.target,
                  label: template.label
                })}
              >
                <Icon className="w-4 h-4" />
                {template.label}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {template.target}
                </Badge>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderExternalTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">External URL</Label>
        <Input
          placeholder="https://example.com"
          value={linkConfig.target}
          onChange={(e) => handleLinkConfigChange({ type: 'external', target: e.target.value })}
        />
      </div>

      {/* Action Templates */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
        <div className="grid grid-cols-1 gap-2">
          {LINK_TEMPLATES.actions.map(template => {
            const Icon = template.icon
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => handleLinkConfigChange({
                  type: 'external',
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

      {/* Protocol helpers */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Protocols</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLinkConfigChange({ type: 'external', target: 'mailto:' })}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLinkConfigChange({ type: 'external', target: 'tel:' })}
          >
            <Phone className="w-4 h-4 mr-2" />
            Phone
          </Button>
        </div>
      </div>
    </div>
  )

  const renderActionsTab = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Action Type</Label>
        <Select
          value={linkConfig.target}
          onValueChange={(value) => handleLinkConfigChange({ type: 'action', target: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scroll-to-top">Scroll to Top</SelectItem>
            <SelectItem value="scroll-to-bottom">Scroll to Bottom</SelectItem>
            <SelectItem value="open-modal">Open Modal</SelectItem>
            <SelectItem value="close-modal">Close Modal</SelectItem>
            <SelectItem value="toggle-menu">Toggle Menu</SelectItem>
            <SelectItem value="submit-form">Submit Form</SelectItem>
            <SelectItem value="download-file">Download File</SelectItem>
            <SelectItem value="copy-text">Copy Text</SelectItem>
            <SelectItem value="share-page">Share Page</SelectItem>
            <SelectItem value="print-page">Print Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Parameters */}
      {linkConfig.target && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Action Parameters</Label>
          <Textarea
            placeholder="Additional parameters (JSON format)"
            value={JSON.stringify(linkConfig.parameters || {}, null, 2)}
            onChange={(e) => {
              try {
                const params = JSON.parse(e.target.value)
                handleLinkConfigChange({ parameters: params })
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            rows={4}
          />
        </div>
      )}
    </div>
  )

  const content = (
    <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Link Manager</DialogTitle>
        <DialogDescription>
          Configure links and actions for your {elementType}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pages" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            <span className="hidden sm:inline">Sections</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">External</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mt-4">
          <TabsContent value="pages" className="mt-0">
            {renderPagesTab()}
          </TabsContent>

          <TabsContent value="sections" className="mt-0">
            {renderSectionsTab()}
          </TabsContent>

          <TabsContent value="data" className="mt-0">
            {renderDataTab()}
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            {renderCustomTab()}
          </TabsContent>

          <TabsContent value="external" className="mt-0">
            {renderExternalTab()}
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            {renderActionsTab()}
          </TabsContent>
        </div>
      </Tabs>

      {/* Link Configuration */}
      <div className="border-t pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Link Label</Label>
            <Input
              placeholder="Optional display text"
              value={linkConfig.label || ''}
              onChange={(e) => handleLinkConfigChange({ label: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              checked={linkConfig.openInNewTab || false}
              onCheckedChange={(checked) => handleLinkConfigChange({ openInNewTab: checked })}
            />
            <Label className="text-sm">Open in new tab</Label>
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="bg-muted rounded-lg p-3">
            <Label className="text-sm font-medium mb-1 block">Preview</Label>
            <div className="flex items-center gap-2 text-sm font-mono">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{previewUrl}</span>
              {linkConfig.openInNewTab && (
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!linkConfig.target}>
            Apply Link
          </Button>
        </div>
      </div>
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {content}
      </Dialog>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Add Link
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4">
          <h4 className="font-semibold mb-4">Quick Link</h4>
          <div className="space-y-3">
            <Input
              placeholder="Enter URL or select from options..."
              value={linkConfig.target}
              onChange={(e) => handleLinkConfigChange({ target: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!linkConfig.target}>
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}