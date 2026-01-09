'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrag } from 'react-dnd'
import { 
  Search, Plus, Grid, Type, Image, MousePointer2, FormInput, 
  CreditCard, List, BarChart, Video, Map, Share2, ShoppingCart, 
  Calendar, Users, FileText, Settings, Sparkles, Layers, Package, 
  Zap, Clock, Mail, MessageSquare, ArrowRight, CheckSquare, 
  GitBranch, Eye, Heart, Volume2, ExternalLink, Star, Database, 
  TrendingUp, ChevronRight, Table, CheckCircle, Workflow,
  Code, Webhook, Bell, Lock, DollarSign, Globe, Smartphone,
  Filter, SortAsc, RefreshCw, Play, Pause, MoreHorizontal,
  Link, Target, Activity, Cpu, Cloud, Shield, Key, Palette,
  Layout, Boxes, Component, Wrench, Gauge, LineChart, PieChart,
  BarChart3, Radar, Scatter, TrendingDown, Calculator, Hash,
  Calendar as CalendarIcon, Clock as ClockIcon, MapPin, Phone,
  AtSign, User, Building, Tag, Flag, Bookmark, Archive, Folder,
  Upload, Download, Copy, Move, Trash2, Edit, Save, Send,
  MessageCircle, ThumbsUp, Share, Repeat, Forward, Reply,
  AlertTriangle, Info, HelpCircle, CheckCircle2, XCircle,
  Loader, Spinner, Timer, Stopwatch, Hourglass, FastForward,
  Rewind, SkipBack, SkipForward, Volume, VolumeX, Mic, MicOff,
  Camera, Video as VideoIcon, Image as ImageIcon, Film, Music,
  Headphones, Radio, Tv, Monitor, Laptop, Tablet, Watch,
  Gamepad2, Joystick, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6,
  Trophy, Award, Medal, Crown, Gem, Diamond, Coins, Banknote,
  Wallet, CreditCard as CreditCardIcon, Receipt, ShoppingBag,
  Store, Storefront, Truck, Package2, Box, Container, Warehouse,
  Factory, Home, Building2, School, Hospital, Church, Bank,
  Hotel, Restaurant, Cafe, Car, Bus, Train, Plane, Ship, Bike,
  Footprints, Navigation, Compass, Route, RoadHorizon, Traffic,
  Construction, Hammer, Wrench as WrenchIcon, Screwdriver, Drill,
  Paintbrush, Scissors, Ruler, Pencil, Pen, Eraser, Highlighter,
  BookOpen, Book, Newspaper, FileText as FileTextIcon, File,
  Files, FolderOpen, FolderClosed, Archive as ArchiveIcon,
  Paperclip, Link2, Unlink, Chain, Anchor, Pin, PinOff,
  Maximize, Minimize, Expand, Shrink, ZoomIn, ZoomOut, Focus,
  Scan, QrCode, Barcode, Fingerprint, FaceId, Unlock, LockOpen
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
import { useEditor } from '@/contexts/editor-context'

// Enhanced Widget Categories with Actions, Events, and Data Flow
const ENHANCED_CATEGORIES = {
  // Core UI Elements
  elements: {
    name: 'UI Elements',
    icon: Layers,
    color: 'bg-blue-500',
    widgets: [
      { id: 'button', name: 'Button', icon: MousePointer2, description: 'Interactive button with actions', category: 'interactive' },
      { id: 'form', name: 'Form', icon: FormInput, description: 'Data collection form', category: 'interactive' },
      { id: 'input', name: 'Input Field', icon: FormInput, description: 'Text input with validation', category: 'interactive' },
      { id: 'select', name: 'Dropdown', icon: ChevronRight, description: 'Selection dropdown', category: 'interactive' },
      { id: 'checkbox', name: 'Checkbox', icon: CheckSquare, description: 'Boolean selection', category: 'interactive' },
      { id: 'radio', name: 'Radio Group', icon: Target, description: 'Single choice selection', category: 'interactive' },
      { id: 'slider', name: 'Slider', icon: Gauge, description: 'Range input slider', category: 'interactive' },
      { id: 'switch', name: 'Toggle Switch', icon: Settings, description: 'On/off toggle', category: 'interactive' },
      { id: 'rating', name: 'Star Rating', icon: Star, description: 'Rating input/display', category: 'interactive' },
      { id: 'file-upload', name: 'File Upload', icon: Upload, description: 'File upload with preview', category: 'interactive' }
    ]
  },

  // Data & Content
  data: {
    name: 'Data & Content',
    icon: Database,
    color: 'bg-purple-500',
    widgets: [
      { id: 'data-table', name: 'Data Table', icon: Table, description: 'Advanced data table with sorting/filtering', category: 'data' },
      { id: 'data-grid', name: 'Data Grid', icon: Grid, description: 'Responsive data grid', category: 'data' },
      { id: 'data-list', name: 'Data List', icon: List, description: 'Dynamic list from data source', category: 'data' },
      { id: 'data-cards', name: 'Data Cards', icon: CreditCard, description: 'Card layout for data', category: 'data' },
      { id: 'chart', name: 'Chart', icon: BarChart, description: 'Data visualization charts', category: 'data' },
      { id: 'kpi-metric', name: 'KPI Metric', icon: TrendingUp, description: 'Key performance indicator', category: 'data' },
      { id: 'progress-bar', name: 'Progress Bar', icon: BarChart3, description: 'Progress visualization', category: 'data' },
      { id: 'data-filter', name: 'Data Filter', icon: Filter, description: 'Filter controls for data', category: 'data' },
      { id: 'search-box', name: 'Search Box', icon: Search, description: 'Search functionality', category: 'data' },
      { id: 'pagination', name: 'Pagination', icon: ArrowRight, description: 'Data pagination controls', category: 'data' }
    ]
  },

  // Actions & Workflows
  actions: {
    name: 'Actions & Events',
    icon: Zap,
    color: 'bg-orange-500',
    widgets: [
      { id: 'action-button', name: 'Action Button', icon: Play, description: 'Button with custom actions', category: 'action' },
      { id: 'workflow-trigger', name: 'Workflow Trigger', icon: Workflow, description: 'Trigger automation workflows', category: 'action' },
      { id: 'api-caller', name: 'API Caller', icon: Globe, description: 'Make API calls on events', category: 'action' },
      { id: 'form-handler', name: 'Form Handler', icon: Send, description: 'Process form submissions', category: 'action' },
      { id: 'data-creator', name: 'Data Creator', icon: Plus, description: 'Create new records', category: 'action' },
      { id: 'data-updater', name: 'Data Updater', icon: Edit, description: 'Update existing records', category: 'action' },
      { id: 'email-sender', name: 'Email Sender', icon: Mail, description: 'Send email notifications', category: 'action' },
      { id: 'notification', name: 'Notification', icon: Bell, description: 'Show user notifications', category: 'action' },
      { id: 'redirect', name: 'Page Redirect', icon: ExternalLink, description: 'Navigate to other pages', category: 'action' },
      { id: 'modal-trigger', name: 'Modal Trigger', icon: Maximize, description: 'Open modal dialogs', category: 'action' }
    ]
  },

  // Business & E-commerce
  business: {
    name: 'Business & E-commerce',
    icon: ShoppingCart,
    color: 'bg-green-500',
    widgets: [
      { id: 'product-card', name: 'Product Card', icon: Package, description: 'E-commerce product display', category: 'ecommerce' },
      { id: 'shopping-cart', name: 'Shopping Cart', icon: ShoppingCart, description: 'Cart functionality', category: 'ecommerce' },
      { id: 'checkout-form', name: 'Checkout Form', icon: CreditCard, description: 'Payment checkout process', category: 'ecommerce' },
      { id: 'payment-button', name: 'Payment Button', icon: DollarSign, description: 'Payment processing', category: 'ecommerce' },
      { id: 'invoice', name: 'Invoice', icon: Receipt, description: 'Invoice generation', category: 'business' },
      { id: 'pricing-table', name: 'Pricing Table', icon: Package2, description: 'Subscription pricing', category: 'business' },
      { id: 'contact-form', name: 'Contact Form', icon: MessageSquare, description: 'Customer contact form', category: 'business' },
      { id: 'booking-calendar', name: 'Booking Calendar', icon: Calendar, description: 'Appointment booking', category: 'business' },
      { id: 'review-system', name: 'Review System', icon: Star, description: 'Customer reviews', category: 'business' },
      { id: 'loyalty-program', name: 'Loyalty Program', icon: Award, description: 'Customer loyalty features', category: 'business' }
    ]
  },

  // Authentication & Security
  auth: {
    name: 'Auth & Security',
    icon: Shield,
    color: 'bg-red-500',
    widgets: [
      { id: 'login-form', name: 'Login Form', icon: Lock, description: 'User authentication', category: 'auth' },
      { id: 'signup-form', name: 'Signup Form', icon: UserPlus, description: 'User registration', category: 'auth' },
      { id: 'profile-form', name: 'Profile Form', icon: User, description: 'User profile management', category: 'auth' },
      { id: 'password-reset', name: 'Password Reset', icon: Key, description: 'Password recovery', category: 'auth' },
      { id: 'two-factor', name: 'Two-Factor Auth', icon: Shield, description: '2FA authentication', category: 'auth' },
      { id: 'role-guard', name: 'Role Guard', icon: Lock, description: 'Role-based access control', category: 'auth' },
      { id: 'permission-check', name: 'Permission Check', icon: CheckCircle, description: 'Permission validation', category: 'auth' },
      { id: 'session-manager', name: 'Session Manager', icon: Clock, description: 'Session management', category: 'auth' },
      { id: 'oauth-login', name: 'OAuth Login', icon: Globe, description: 'Social login integration', category: 'auth' },
      { id: 'captcha', name: 'CAPTCHA', icon: Shield, description: 'Bot protection', category: 'auth' }
    ]
  },

  // Integrations & APIs
  integrations: {
    name: 'Integrations',
    icon: Link,
    color: 'bg-indigo-500',
    widgets: [
      { id: 'webhook-receiver', name: 'Webhook Receiver', icon: Webhook, description: 'Receive webhook data', category: 'integration' },
      { id: 'api-connector', name: 'API Connector', icon: Globe, description: 'Connect to external APIs', category: 'integration' },
      { id: 'database-sync', name: 'Database Sync', icon: Database, description: 'Sync with external databases', category: 'integration' },
      { id: 'file-sync', name: 'File Sync', icon: Cloud, description: 'Cloud file synchronization', category: 'integration' },
      { id: 'email-integration', name: 'Email Integration', icon: Mail, description: 'Email service integration', category: 'integration' },
      { id: 'sms-integration', name: 'SMS Integration', icon: MessageSquare, description: 'SMS service integration', category: 'integration' },
      { id: 'social-media', name: 'Social Media', icon: Share2, description: 'Social platform integration', category: 'integration' },
      { id: 'analytics', name: 'Analytics', icon: BarChart, description: 'Analytics tracking', category: 'integration' },
      { id: 'crm-sync', name: 'CRM Sync', icon: Users, description: 'CRM system integration', category: 'integration' },
      { id: 'calendar-sync', name: 'Calendar Sync', icon: Calendar, description: 'Calendar integration', category: 'integration' }
    ]
  },

  // Advanced Features
  advanced: {
    name: 'Advanced',
    icon: Cpu,
    color: 'bg-gray-600',
    widgets: [
      { id: 'ai-chatbot', name: 'AI Chatbot', icon: MessageCircle, description: 'AI-powered chat interface', category: 'ai' },
      { id: 'image-recognition', name: 'Image Recognition', icon: Eye, description: 'AI image analysis', category: 'ai' },
      { id: 'text-analysis', name: 'Text Analysis', icon: FileText, description: 'AI text processing', category: 'ai' },
      { id: 'recommendation', name: 'Recommendation Engine', icon: Target, description: 'AI recommendations', category: 'ai' },
      { id: 'real-time-chat', name: 'Real-time Chat', icon: MessageSquare, description: 'Live chat functionality', category: 'realtime' },
      { id: 'live-updates', name: 'Live Updates', icon: RefreshCw, description: 'Real-time data updates', category: 'realtime' },
      { id: 'collaboration', name: 'Collaboration', icon: Users, description: 'Multi-user collaboration', category: 'realtime' },
      { id: 'video-call', name: 'Video Call', icon: Video, description: 'Video conferencing', category: 'realtime' },
      { id: 'screen-share', name: 'Screen Share', icon: Monitor, description: 'Screen sharing', category: 'realtime' },
      { id: 'whiteboard', name: 'Whiteboard', icon: Paintbrush, description: 'Collaborative whiteboard', category: 'realtime' }
    ]
  }
}

// Action Templates for quick setup
const ACTION_TEMPLATES = {
  'create-user': {
    name: 'Create User Account',
    description: 'Register a new user with email verification',
    actions: [
      { type: 'validate-form', config: { required: ['email', 'password'] } },
      { type: 'create-record', config: { collection: 'users' } },
      { type: 'send-email', config: { template: 'welcome' } },
      { type: 'redirect', config: { url: '/dashboard' } }
    ]
  },
  'process-order': {
    name: 'Process E-commerce Order',
    description: 'Handle order creation and payment processing',
    actions: [
      { type: 'validate-cart', config: {} },
      { type: 'process-payment', config: { provider: 'stripe' } },
      { type: 'create-record', config: { collection: 'orders' } },
      { type: 'update-inventory', config: {} },
      { type: 'send-email', config: { template: 'order-confirmation' } }
    ]
  },
  'lead-capture': {
    name: 'Lead Capture & Nurture',
    description: 'Capture leads and start nurturing sequence',
    actions: [
      { type: 'create-record', config: { collection: 'leads' } },
      { type: 'add-to-crm', config: {} },
      { type: 'trigger-workflow', config: { workflow: 'lead-nurture' } },
      { type: 'send-notification', config: { message: 'New lead captured!' } }
    ]
  }
}

// Event Types for dynamic interactions
const EVENT_TYPES = [
  { id: 'click', name: 'Click', icon: MousePointer2, description: 'User clicks element' },
  { id: 'submit', name: 'Form Submit', icon: Send, description: 'Form is submitted' },
  { id: 'change', name: 'Value Change', icon: Edit, description: 'Input value changes' },
  { id: 'load', name: 'Page Load', icon: RefreshCw, description: 'Page finishes loading' },
  { id: 'scroll', name: 'Scroll', icon: ArrowRight, description: 'User scrolls page' },
  { id: 'hover', name: 'Hover', icon: MousePointer2, description: 'Mouse hovers over element' },
  { id: 'focus', name: 'Focus', icon: Target, description: 'Element receives focus' },
  { id: 'blur', name: 'Blur', icon: Eye, description: 'Element loses focus' },
  { id: 'timer', name: 'Timer', icon: Clock, description: 'Time-based trigger' },
  { id: 'data-change', name: 'Data Change', icon: Database, description: 'Data source updates' }
]

interface EnhancedSidebarProps {
  appId: string
  onAddElement: (element: any) => void
  currentPageId?: string
  selectedElement?: any
}

export function EnhancedEditorSidebar({ 
  appId, 
  onAddElement, 
  currentPageId, 
  selectedElement 
}: EnhancedSidebarProps) {
  const [activeTab, setActiveTab] = useState('elements')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showActionBuilder, setShowActionBuilder] = useState(false)
  const [selectedActionTemplate, setSelectedActionTemplate] = useState<string | null>(null)

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    const filtered: any = {}
    
    Object.entries(ENHANCED_CATEGORIES).forEach(([categoryKey, category]) => {
      filtered[categoryKey] = category.widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    
    return filtered
  }, [searchQuery])

  const handleAddWidget = useCallback((widget: any, categoryKey: string) => {
    if (!currentPageId) {
      alert('Please select a page before adding elements')
      return
    }

    const elementConfig = {
      type: widget.id,
      position: { x: 0, y: 0 },
      size: { 
        width: 1440,
        height: widget.defaultHeight || 200 
      },
      props: {
        ...widget.defaultProps,
        title: widget.name,
        category: widget.category
      },
      style: widget.defaultStyle || {},
      children: [],
      // Enhanced properties for actions and events
      actions: widget.category === 'action' ? [] : undefined,
      events: {},
      dataBinding: widget.category === 'data' ? {} : undefined
    }
    
    onAddElement(elementConfig)
  }, [onAddElement, currentPageId])

  return (
    <div className="w-full h-full bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-semibold">App Builder</h2>
        </div>
        
        {/* Page Selection Warning */}
        {!currentPageId && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Select a page first</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Choose a page from the Pages tab to start building.
            </p>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={!currentPageId}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          </TabsList>
        </div>

        {/* Elements Tab - Enhanced UI Components */}
        <TabsContent value="elements" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-6 pb-4">
              {Object.entries(ENHANCED_CATEGORIES).map(([categoryKey, category]) => {
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
                    
                    <div className="grid grid-cols-1 gap-2">
                      {widgets.map((widget: any) => (
                        <DraggableWidget
                          key={widget.id}
                          widget={widget}
                          category={categoryKey}
                          onAdd={() => handleAddWidget(widget, categoryKey)}
                          disabled={!currentPageId}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Actions Tab - Action Builder & Event Management */}
        <TabsContent value="actions" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-6 pb-4">
              {/* Quick Action Templates */}
              <div>
                <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {Object.entries(ACTION_TEMPLATES).map(([key, template]) => (
                    <Card key={key} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Event Types */}
              <div>
                <h3 className="font-medium text-sm mb-3">Event Triggers</h3>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((event) => (
                    <Card key={event.id} className="p-2 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <event.icon className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-xs">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom Action Builder */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">Custom Actions</h3>
                  <Button size="sm" onClick={() => setShowActionBuilder(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Build Action
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Create custom action sequences for complex workflows
                </p>
                <Card className="p-3 border-dashed">
                  <div className="text-center text-muted-foreground">
                    <Workflow className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No custom actions yet</p>
                    <p className="text-xs">Click "Build Action" to create one</p>
                  </div>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Data Tab - Enhanced Data Management */}
        <TabsContent value="data" className="flex-1 mt-4 overflow-hidden">
          <DataManagementTab appId={appId} onAddElement={onAddElement} />
        </TabsContent>

        {/* Templates Tab - Pre-built Solutions */}
        <TabsContent value="templates" className="flex-1 mt-4 overflow-hidden">
          <TemplatesTab appId={appId} onAddElement={onAddElement} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Draggable Widget Component
function DraggableWidget({ 
  widget, 
  category, 
  onAdd, 
  disabled 
}: { 
  widget: any
  category: string
  onAdd: () => void
  disabled: boolean
}) {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: {
      type: 'widget',
      widgetType: widget.id,
      category,
      widget
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const IconComponent = widget.icon
  const categoryColor = ENHANCED_CATEGORIES[category as keyof typeof ENHANCED_CATEGORIES]?.color || 'bg-gray-500'

  return (
    <motion.div
      ref={drag as any}
      className={cn(
        "group p-3 rounded-lg border cursor-pointer transition-all duration-200",
        "bg-card hover:bg-accent/50 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        isDragging && "opacity-50 scale-95"
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onAdd : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center text-white text-sm",
          categoryColor
        )}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{widget.name}</p>
          <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
          {widget.category && (
            <Badge variant="outline" className="mt-1 text-xs">
              {widget.category}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Data Management Tab Component
function DataManagementTab({ appId, onAddElement }: { appId: string; onAddElement: (element: any) => void }) {
  const [dataSources, setDataSources] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDataSources()
  }, [appId])

  const loadDataSources = async () => {
    setLoading(true)
    try {
      // Load data sources and collections
      const [sourcesRes, collectionsRes] = await Promise.all([
        apiClient.get(`/data-sources?app_id=${appId}`).catch(() => ({ data: { data_sources: [] } })),
        apiClient.get(`/apps/${appId}/collections`).catch(() => ({ data: { collections: [] } }))
      ])
      
      setDataSources(sourcesRes.data.data_sources || [])
      setCollections(collectionsRes.data.collections || [])
    } catch (error) {
      console.error('Failed to load data sources:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-6 pb-4">
        {/* Data Sources */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Data Sources</h3>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              Add Source
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          ) : dataSources.length > 0 ? (
            <div className="space-y-2">
              {dataSources.map((source) => (
                <Card key={source.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.base_url}</p>
                    </div>
                    <Badge variant={source.is_connected ? 'default' : 'destructive'}>
                      {source.is_connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 border-dashed">
              <div className="text-center text-muted-foreground">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No data sources</p>
                <p className="text-xs">Connect APIs and databases</p>
              </div>
            </Card>
          )}
        </div>

        <Separator />

        {/* Collections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Collections</h3>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3 mr-1" />
              New Collection
            </Button>
          </div>
          {collections.length > 0 ? (
            <div className="space-y-2">
              {collections.map((collection) => (
                <Card key={collection.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                         style={{ backgroundColor: collection.color }}>
                      <Table className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{collection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collection.record_count} records
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 border-dashed">
              <div className="text-center text-muted-foreground">
                <Table className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No collections</p>
                <p className="text-xs">Create data tables</p>
              </div>
            </Card>
          )}
        </div>

        <Separator />

        {/* Data Widgets */}
        <div>
          <h3 className="font-medium text-sm mb-3">Data Widgets</h3>
          <div className="grid grid-cols-2 gap-2">
            {ENHANCED_CATEGORIES.data.widgets.map((widget) => (
              <Card key={widget.id} className="p-2 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <widget.icon className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="font-medium text-xs">{widget.name}</p>
                    <p className="text-xs text-muted-foreground">{widget.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

// Templates Tab Component
function TemplatesTab({ appId, onAddElement }: { appId: string; onAddElement: (element: any) => void }) {
  const templates = [
    {
      id: 'ecommerce-store',
      name: 'E-commerce Store',
      description: 'Complete online store with cart and checkout',
      category: 'E-commerce',
      elements: ['product-grid', 'shopping-cart', 'checkout-form', 'payment-button']
    },
    {
      id: 'crm-dashboard',
      name: 'CRM Dashboard',
      description: 'Customer relationship management interface',
      category: 'Business',
      elements: ['data-table', 'kpi-metrics', 'contact-form', 'activity-feed']
    },
    {
      id: 'blog-platform',
      name: 'Blog Platform',
      description: 'Content management and publishing system',
      category: 'Content',
      elements: ['article-list', 'rich-editor', 'comment-system', 'social-share']
    },
    {
      id: 'booking-system',
      name: 'Booking System',
      description: 'Appointment and reservation management',
      category: 'Business',
      elements: ['booking-calendar', 'time-slots', 'customer-form', 'payment-integration']
    }
  ]

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-4 pb-4">
        <div className="text-center py-4">
          <h3 className="font-semibold mb-2">Pre-built Templates</h3>
          <p className="text-sm text-muted-foreground">
            Start with complete solutions for common use cases
          </p>
        </div>

        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className="p-4 cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.elements.length} components
                    </span>
                  </div>
                </div>
                <Button size="sm">
                  <Plus className="w-3 h-3 mr-1" />
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}