'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Filter, Grid, List, Star, Download, Eye, 
  Rocket, Briefcase, ShoppingCart, Building, FileText,
  Utensils, Calendar, Cloud, Palette, Home, Layout,
  ChevronRight, X, Check, Sparkles, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

// Template categories with icons
const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Layout, count: 0 },
  { id: 'landing', name: 'Landing Pages', icon: Rocket, count: 0 },
  { id: 'portfolio', name: 'Portfolio', icon: Briefcase, count: 0 },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart, count: 0 },
  { id: 'business', name: 'Business', icon: Building, count: 0 },
  { id: 'blog', name: 'Blog', icon: FileText, count: 0 },
  { id: 'restaurant', name: 'Restaurant', icon: Utensils, count: 0 },
  { id: 'event', name: 'Events', icon: Calendar, count: 0 },
  { id: 'saas', name: 'SaaS', icon: Cloud, count: 0 },
  { id: 'agency', name: 'Agency', icon: Palette, count: 0 },
  { id: 'real-estate', name: 'Real Estate', icon: Home, count: 0 },
  { id: 'erp', name: 'ERP System', icon: Building, count: 0 },
  { id: 'lms', name: 'LMS / Education', icon: FileText, count: 0 },
  { id: 'crm', name: 'CRM', icon: Briefcase, count: 0 },
  { id: 'management', name: 'Management', icon: Layout, count: 0 },
  { id: 'shop', name: 'Shop / Retail', icon: ShoppingCart, count: 0 },
  { id: 'hr', name: 'HR System', icon: Briefcase, count: 0 },
  { id: 'booking', name: 'Booking', icon: Calendar, count: 0 },
  { id: 'healthcare', name: 'Healthcare', icon: Building, count: 0 },
  { id: 'fitness', name: 'Fitness', icon: Rocket, count: 0 },
  { id: 'hospitality', name: 'Hospitality', icon: Home, count: 0 },
  { id: 'education', name: 'School', icon: FileText, count: 0 },
  { id: 'beauty', name: 'Salon & Spa', icon: Palette, count: 0 },
]

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  tags: string[]
  pages: any[]
  downloads?: number
  rating?: number
  isPremium?: boolean
}

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void
  mode?: 'browse' | 'select'
}

export function TemplateLibrary({ onSelectTemplate, mode = 'browse' }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [appName, setAppName] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch templates
  useEffect(() => {
    fetchTemplates()
  }, [])

  // Filter templates
  useEffect(() => {
    let filtered = templates

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredTemplates(filtered)
  }, [templates, selectedCategory, searchQuery])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        
        // Update category counts
        CATEGORIES.forEach(cat => {
          if (cat.id === 'all') {
            cat.count = data.templates?.length || 0
          } else {
            cat.count = data.templates?.filter((t: Template) => t.category === cat.id).length || 0
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      // Use mock data for demo
      setTemplates(MOCK_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleUseTemplate = (template: Template) => {
    if (mode === 'select' && onSelectTemplate) {
      onSelectTemplate(template)
    } else {
      setSelectedTemplate(template)
      setAppName(template.name)
      setShowInstallDialog(true)
    }
  }

  const handleInstall = async () => {
    if (!selectedTemplate || !appName) return

    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_name: appName })
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = `/editor/${data.app_id}`
      }
    } catch (error) {
      console.error('Failed to install template:', error)
    }

    setShowInstallDialog(false)
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId)
    return category?.icon || Layout
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="mb-4">
          <h2 className="font-semibold text-lg mb-2">Templates</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {CATEGORIES.find(c => c.id === selectedCategory)?.name || 'All Templates'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} templates available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Templates Grid/List */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/3] bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            )}>
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    viewMode={viewMode}
                    onPreview={() => handlePreview(template)}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        template={selectedTemplate}
        open={showPreview}
        onOpenChange={setShowPreview}
        onUse={() => {
          setShowPreview(false)
          handleUseTemplate(selectedTemplate!)
        }}
      />

      {/* Install Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from Template</DialogTitle>
            <DialogDescription>
              Create a new project using the "{selectedTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={!appName}>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// Template Card Component
function TemplateCard({
  template,
  viewMode,
  onPreview,
  onUse
}: {
  template: Template
  viewMode: 'grid' | 'list'
  onPreview: () => void
  onUse: () => void
}) {
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="flex overflow-hidden hover:shadow-lg transition-shadow">
          <div className="w-64 aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layout className="w-12 h-12 text-primary/50" />
          </div>
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              {template.isPremium && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>{template.downloads || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{template.rating || 4.5}</span>
              </div>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button size="sm" onClick={onUse}>
                Use Template
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
          <Layout className="w-16 h-16 text-primary/30" />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button size="sm" onClick={onUse}>
              Use
            </Button>
          </div>

          {template.isPremium && (
            <Badge className="absolute top-2 right-2 bg-amber-500">
              Premium
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1">{template.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {template.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {template.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {template.downloads || 0}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {template.rating || 4.5}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {template.pages?.length || 1} page{(template.pages?.length || 1) > 1 ? 's' : ''}
          </span>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Template Preview Dialog
function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUse
}: {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: () => void
}) {
  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription>{template.description}</DialogDescription>
            </div>
            <Button onClick={onUse}>
              <Sparkles className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-muted rounded-lg overflow-hidden">
          {/* Preview iframe or component preview */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Layout className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Template Preview</p>
              <p className="text-sm text-muted-foreground mt-2">
                {template.pages?.length || 1} page(s) included
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {template.downloads || 0} downloads
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {template.rating || 4.5} rating
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mock templates for demo
const MOCK_TEMPLATES: Template[] = [
  {
    id: 'landing-startup',
    name: 'Startup Landing Page',
    description: 'Modern landing page for startups with hero, features, pricing, and CTA sections',
    category: 'landing',
    thumbnail: '/templates/landing-startup.png',
    tags: ['startup', 'saas', 'modern'],
    pages: [{ name: 'Home', slug: 'home' }],
    downloads: 1250,
    rating: 4.8
  },
  {
    id: 'portfolio-creative',
    name: 'Creative Portfolio',
    description: 'Stunning portfolio for designers, photographers, and creatives',
    category: 'portfolio',
    thumbnail: '/templates/portfolio-creative.png',
    tags: ['portfolio', 'creative', 'designer'],
    pages: [{ name: 'Home', slug: 'home' }],
    downloads: 890,
    rating: 4.7
  },
  {
    id: 'ecommerce-store',
    name: 'Modern E-commerce Store',
    description: 'Complete online store with product listings, cart, and checkout',
    category: 'ecommerce',
    thumbnail: '/templates/ecommerce-store.png',
    tags: ['ecommerce', 'store', 'shop'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Shop', slug: 'shop' }],
    downloads: 2100,
    rating: 4.9,
    isPremium: true
  },
  {
    id: 'business-corporate',
    name: 'Corporate Business',
    description: 'Professional business website for companies and agencies',
    category: 'business',
    thumbnail: '/templates/business-corporate.png',
    tags: ['business', 'corporate', 'professional'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'About', slug: 'about' }, { name: 'Contact', slug: 'contact' }],
    downloads: 1560,
    rating: 4.6
  },
  {
    id: 'erp-dashboard',
    name: 'ERP Dashboard',
    description: 'Complete ERP system with inventory, HR, finance, and reporting modules',
    category: 'erp',
    thumbnail: '/templates/erp-dashboard.png',
    tags: ['erp', 'enterprise', 'management'],
    pages: [{ name: 'Dashboard', slug: 'dashboard' }, { name: 'Inventory', slug: 'inventory' }, { name: 'HR', slug: 'hr' }, { name: 'Finance', slug: 'finance' }],
    downloads: 980,
    rating: 4.9,
    isPremium: true
  },
  {
    id: 'lms-platform',
    name: 'Learning Management System',
    description: 'Complete LMS with courses, students, instructors, and progress tracking',
    category: 'lms',
    thumbnail: '/templates/lms-platform.png',
    tags: ['lms', 'education', 'courses'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Dashboard', slug: 'dashboard' }, { name: 'Courses', slug: 'courses' }],
    downloads: 1450,
    rating: 4.8,
    isPremium: true
  },
  {
    id: 'restaurant-pos',
    name: 'Restaurant Management',
    description: 'Complete restaurant system with menu, orders, reservations, and POS',
    category: 'restaurant',
    thumbnail: '/templates/restaurant-pos.png',
    tags: ['restaurant', 'food', 'pos'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Menu', slug: 'menu' }, { name: 'Reservations', slug: 'reservations' }],
    downloads: 1120,
    rating: 4.7
  },
  {
    id: 'retail-shop',
    name: 'Retail Shop Management',
    description: 'Complete retail management with POS, inventory, customers, and reports',
    category: 'shop',
    thumbnail: '/templates/retail-shop.png',
    tags: ['shop', 'retail', 'pos'],
    pages: [{ name: 'Storefront', slug: 'home' }, { name: 'POS', slug: 'pos' }, { name: 'Inventory', slug: 'inventory' }],
    downloads: 890,
    rating: 4.6
  },
  {
    id: 'crm-system',
    name: 'CRM System',
    description: 'Customer relationship management with contacts, deals, and pipeline',
    category: 'crm',
    thumbnail: '/templates/crm-system.png',
    tags: ['crm', 'sales', 'customers'],
    pages: [{ name: 'Dashboard', slug: 'dashboard' }, { name: 'Contacts', slug: 'contacts' }, { name: 'Deals', slug: 'deals' }],
    downloads: 1340,
    rating: 4.8
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project tracking with tasks, teams, timelines, and reporting',
    category: 'management',
    thumbnail: '/templates/project-management.png',
    tags: ['project', 'tasks', 'team'],
    pages: [{ name: 'Dashboard', slug: 'dashboard' }, { name: 'Projects', slug: 'projects' }, { name: 'Tasks', slug: 'tasks' }],
    downloads: 1670,
    rating: 4.9
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Complete inventory system with stock tracking, orders, and suppliers',
    category: 'management',
    thumbnail: '/templates/inventory-management.png',
    tags: ['inventory', 'stock', 'warehouse'],
    pages: [{ name: 'Dashboard', slug: 'dashboard' }, { name: 'Products', slug: 'products' }, { name: 'Orders', slug: 'orders' }],
    downloads: 920,
    rating: 4.7
  },
  {
    id: 'hr-management',
    name: 'HR Management System',
    description: 'Human resources management with employees, payroll, and recruitment',
    category: 'hr',
    thumbnail: '/templates/hr-management.png',
    tags: ['hr', 'employees', 'payroll'],
    pages: [{ name: 'Dashboard', slug: 'dashboard' }, { name: 'Employees', slug: 'employees' }, { name: 'Recruitment', slug: 'recruitment' }],
    downloads: 780,
    rating: 4.6
  },
  {
    id: 'booking-system',
    name: 'Booking & Appointments',
    description: 'Online booking system for services, appointments, and reservations',
    category: 'booking',
    thumbnail: '/templates/booking-system.png',
    tags: ['booking', 'appointments', 'scheduling'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Book', slug: 'book' }],
    downloads: 1230,
    rating: 4.8
  },
  {
    id: 'clinic-management',
    name: 'Clinic Management',
    description: 'Healthcare management with patients, appointments, and medical records',
    category: 'healthcare',
    thumbnail: '/templates/clinic-management.png',
    tags: ['clinic', 'healthcare', 'medical'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Portal', slug: 'portal' }],
    downloads: 650,
    rating: 4.7,
    isPremium: true
  },
  {
    id: 'gym-management',
    name: 'Gym & Fitness Center',
    description: 'Fitness center management with memberships, classes, and trainers',
    category: 'fitness',
    thumbnail: '/templates/gym-management.png',
    tags: ['gym', 'fitness', 'membership'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Portal', slug: 'portal' }],
    downloads: 890,
    rating: 4.6
  },
  {
    id: 'hotel-management',
    name: 'Hotel & Resort',
    description: 'Hotel management with rooms, bookings, and guest services',
    category: 'hospitality',
    thumbnail: '/templates/hotel-management.png',
    tags: ['hotel', 'resort', 'hospitality'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Booking', slug: 'booking' }],
    downloads: 720,
    rating: 4.8,
    isPremium: true
  },
  {
    id: 'school-management',
    name: 'School Management System',
    description: 'Complete school management with students, teachers, and classes',
    category: 'education',
    thumbnail: '/templates/school-management.png',
    tags: ['school', 'education', 'students'],
    pages: [{ name: 'Home', slug: 'home' }, { name: 'Student Portal', slug: 'student' }, { name: 'Teacher Portal', slug: 'teacher' }],
    downloads: 1100,
    rating: 4.9,
    isPremium: true
  },
  {
    id: 'salon-spa',
    name: 'Salon & Spa',
    description: 'Beauty salon and spa management with services and bookings',
    category: 'beauty',
    thumbnail: '/templates/salon-spa.png',
    tags: ['salon', 'spa', 'beauty'],
    pages: [{ name: 'Home', slug: 'home' }],
    downloads: 560,
    rating: 4.5
  }
]

// Update category counts with mock data
CATEGORIES.forEach(cat => {
  if (cat.id === 'all') {
    cat.count = MOCK_TEMPLATES.length
  } else {
    cat.count = MOCK_TEMPLATES.filter(t => t.category === cat.id).length
  }
})
