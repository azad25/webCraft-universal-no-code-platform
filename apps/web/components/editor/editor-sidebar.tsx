'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
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
  Scan, QrCode, Barcode, Fingerprint, FaceId, Unlock, LockOpen,
  UserPlus, Briefcase, PresentationChart, Megaphone, Handshake,
  Menu, Minus, PanelLeft, PanelRight, Square
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
import { DataSourceSelector } from '@/components/data-sources/data-source-selector'
import { getCollections, getDataSources } from '@/lib/data-source-api'
import { CustomCodeManager } from './custom-code-manager'
import { version } from 'os'
import { Content } from '@radix-ui/react-select'

// Universal Widget Categories - Compatible with Actions, Data Flow, Events & Integrations
const WIDGET_CATEGORIES = {
  // Core UI Elements - All support actions, events, and data binding
  elements: {
    name: 'UI Elements',
    icon: Layers,
    color: 'bg-blue-500',
    widgets: [
      { 
        id: 'button', 
        name: 'Button', 
        icon: MousePointer2, 
        description: 'Interactive button with actions & events', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'focus'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'enhanced-button', 
        name: 'Enhanced Button', 
        icon: MousePointer2, 
        description: 'Advanced button with animations & workflows', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'focus', 'timer'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'form', 
        name: 'Form', 
        icon: FormInput, 
        description: 'Data collection form with validation', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['submit', 'change', 'focus', 'blur'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'input', 
        name: 'Input Field', 
        icon: FormInput, 
        description: 'Text input with validation & data binding', 
        defaultHeight: 60,
        supportsActions: true,
        supportsEvents: ['change', 'focus', 'blur', 'submit'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'select', 
        name: 'Dropdown', 
        icon: ChevronRight, 
        description: 'Selection dropdown with data source', 
        defaultHeight: 60,
        supportsActions: true,
        supportsEvents: ['change', 'focus', 'blur'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'checkbox', 
        name: 'Checkbox', 
        icon: CheckSquare, 
        description: 'Boolean selection with actions', 
        defaultHeight: 40,
        supportsActions: true,
        supportsEvents: ['change', 'click'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'radio', 
        name: 'Radio Group', 
        icon: Target, 
        description: 'Single choice selection', 
        defaultHeight: 120,
        supportsActions: true,
        supportsEvents: ['change', 'click'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'slider', 
        name: 'Slider', 
        icon: Gauge, 
        description: 'Range input with real-time updates', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['change', 'input'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'switch', 
        name: 'Toggle Switch', 
        icon: Settings, 
        description: 'On/off toggle with actions', 
        defaultHeight: 60,
        supportsActions: true,
        supportsEvents: ['change', 'click'],
        supportsDataBinding: true,
        category: 'interactive'
      },
      { 
        id: 'rating', 
        name: 'Star Rating', 
        icon: Star, 
        description: 'Rating input/display with data', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['change', 'click', 'hover'],
        supportsDataBinding: true,
        category: 'interactive'
      }
    ]
  },

  // Content & Media - All support dynamic content and media management
  content: {
    name: 'Content & Media',
    icon: Type,
    color: 'bg-green-500',
    widgets: [
      { 
        id: 'heading', 
        name: 'Heading', 
        icon: Type, 
        description: 'Dynamic headings with data binding', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['click', 'hover'],
        supportsDataBinding: true,
        category: 'content'
      },
      { 
        id: 'text', 
        name: 'Text', 
        icon: Type, 
        description: 'Rich text with dynamic content', 
        defaultHeight: 100,
        supportsActions: true,
        supportsEvents: ['click', 'hover'],
        supportsDataBinding: true,
        category: 'content'
      },
      { 
        id: 'paragraph', 
        name: 'Paragraph', 
        icon: FileText, 
        description: 'Paragraph with data integration', 
        defaultHeight: 120,
        supportsActions: true,
        supportsEvents: ['click', 'hover'],
        supportsDataBinding: true,
        category: 'content'
      },
      { 
        id: 'image', 
        name: 'Image', 
        icon: Image, 
        description: 'Responsive image with media manager', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'load'],
        supportsDataBinding: true,
        category: 'media'
      },
      { 
        id: 'gallery', 
        name: 'Gallery', 
        icon: Image, 
        description: 'Image gallery with data source', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'change'],
        supportsDataBinding: true,
        category: 'media'
      },
      { 
        id: 'video', 
        name: 'Video', 
        icon: Video, 
        description: 'Video player with events', 
        defaultHeight: 450,
        supportsActions: true,
        supportsEvents: ['play', 'pause', 'ended', 'click'],
        supportsDataBinding: true,
        category: 'media'
      },
      { 
        id: 'audio', 
        name: 'Audio', 
        icon: Volume2, 
        description: 'Audio player with controls', 
        defaultHeight: 100,
        supportsActions: true,
        supportsEvents: ['play', 'pause', 'ended'],
        supportsDataBinding: true,
        category: 'media'
      },
      { 
        id: 'list', 
        name: 'List', 
        icon: List, 
        description: 'Dynamic list from data source', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['click', 'hover'],
        supportsDataBinding: true,
        category: 'content'
      },
      { 
        id: 'accordion', 
        name: 'Accordion', 
        icon: List, 
        description: 'Collapsible content with data', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['click', 'expand', 'collapse'],
        supportsDataBinding: true,
        category: 'content'
      },
      { 
        id: 'tabs', 
        name: 'Tabs', 
        icon: Grid, 
        description: 'Tabbed content with dynamic data', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['click', 'change'],
        supportsDataBinding: true,
        category: 'content'
      }
    ]
  },

  // Data & Analytics - Advanced data visualization and management
  data: {
    name: 'Data & Analytics',
    icon: Database,
    color: 'bg-purple-500',
    widgets: [
      { 
        id: 'data-table', 
        name: 'Data Table', 
        icon: Table, 
        description: 'Advanced table with sorting, filtering, actions', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['click', 'sort', 'filter', 'select'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'data-grid', 
        name: 'Data Grid', 
        icon: Grid, 
        description: 'Responsive grid with real-time updates', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'select'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'data-cards', 
        name: 'Data Cards', 
        icon: CreditCard, 
        description: 'Card layout with actions per item', 
        defaultHeight: 600,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'select'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'chart', 
        name: 'Chart', 
        icon: BarChart, 
        description: 'Interactive charts with real-time data', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['click', 'hover', 'data-change'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'kpi-metric', 
        name: 'KPI Metric', 
        icon: TrendingUp, 
        description: 'Key performance indicators with alerts', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['click', 'threshold', 'data-change'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'progress-bar', 
        name: 'Progress Bar', 
        icon: BarChart3, 
        description: 'Progress visualization with data', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['complete', 'change'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'data-filter', 
        name: 'Data Filter', 
        icon: Filter, 
        description: 'Advanced filtering controls', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['change', 'apply', 'reset'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'search-box', 
        name: 'Search Box', 
        icon: Search, 
        description: 'Search with auto-complete and actions', 
        defaultHeight: 60,
        supportsActions: true,
        supportsEvents: ['search', 'select', 'change'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'pagination', 
        name: 'Pagination', 
        icon: ArrowRight, 
        description: 'Data pagination with navigation', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['page-change', 'click'],
        supportsDataBinding: true,
        category: 'data'
      },
      { 
        id: 'dashboard', 
        name: 'Dashboard', 
        icon: PresentationChart, 
        description: 'Complete dashboard with widgets', 
        defaultHeight: 600,
        supportsActions: true,
        supportsEvents: ['refresh', 'filter', 'drill-down'],
        supportsDataBinding: true,
        category: 'data'
      }
    ]
  },

  // Business & E-commerce - Complete business functionality
  business: {
    name: 'Business & E-commerce',
    icon: ShoppingCart,
    color: 'bg-green-600',
    widgets: [
      { 
        id: 'product-card', 
        name: 'Product Card', 
        icon: Package, 
        description: 'Product display with cart actions', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['add-to-cart', 'view-details', 'favorite'],
        supportsDataBinding: true,
        category: 'ecommerce'
      },
      { 
        id: 'shopping-cart', 
        name: 'Shopping Cart', 
        icon: ShoppingCart, 
        description: 'Cart with checkout workflow', 
        defaultHeight: 600,
        supportsActions: true,
        supportsEvents: ['add', 'remove', 'update', 'checkout'],
        supportsDataBinding: true,
        category: 'ecommerce'
      },
      { 
        id: 'checkout-form', 
        name: 'Checkout Form', 
        icon: CreditCard, 
        description: 'Payment form with validation', 
        defaultHeight: 800,
        supportsActions: true,
        supportsEvents: ['submit', 'validate', 'payment'],
        supportsDataBinding: true,
        category: 'ecommerce'
      },
      { 
        id: 'payment-button', 
        name: 'Payment Button', 
        icon: DollarSign, 
        description: 'Payment processing with providers', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['click', 'payment-success', 'payment-error'],
        supportsDataBinding: true,
        category: 'ecommerce'
      },
      { 
        id: 'invoice', 
        name: 'Invoice', 
        icon: Receipt, 
        description: 'Invoice generation and management', 
        defaultHeight: 600,
        supportsActions: true,
        supportsEvents: ['generate', 'send', 'pay'],
        supportsDataBinding: true,
        category: 'business'
      },
      { 
        id: 'pricing-table', 
        name: 'Pricing Table', 
        icon: Package2, 
        description: 'Subscription pricing with actions', 
        defaultHeight: 600,
        supportsActions: true,
        supportsEvents: ['select-plan', 'upgrade', 'downgrade'],
        supportsDataBinding: true,
        category: 'business'
      },
      { 
        id: 'booking-calendar', 
        name: 'Booking Calendar', 
        icon: Calendar, 
        description: 'Appointment booking system', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['book', 'cancel', 'reschedule'],
        supportsDataBinding: true,
        category: 'business'
      },
      { 
        id: 'crm-contact', 
        name: 'CRM Contact', 
        icon: Users, 
        description: 'Contact management with actions', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['create', 'update', 'delete', 'call'],
        supportsDataBinding: true,
        category: 'business'
      },
      { 
        id: 'inventory-tracker', 
        name: 'Inventory Tracker', 
        icon: Package, 
        description: 'Stock management with alerts', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['low-stock', 'reorder', 'update'],
        supportsDataBinding: true,
        category: 'business'
      },
      { 
        id: 'order-status', 
        name: 'Order Status', 
        icon: Truck, 
        description: 'Order tracking with updates', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['status-change', 'track', 'notify'],
        supportsDataBinding: true,
        category: 'business'
      }
    ]
  },

  // Actions & Workflows - Automation and process management
  actions: {
    name: 'Actions & Workflows',
    icon: Zap,
    color: 'bg-orange-500',
    widgets: [
      { 
        id: 'action-button', 
        name: 'Action Button', 
        icon: Play, 
        description: 'Button with custom action sequences', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['click', 'complete', 'error'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'workflow-trigger', 
        name: 'Workflow Trigger', 
        icon: Workflow, 
        description: 'Trigger automation workflows', 
        defaultHeight: 120,
        supportsActions: true,
        supportsEvents: ['trigger', 'complete', 'error'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'api-caller', 
        name: 'API Caller', 
        icon: Globe, 
        description: 'Make API calls with response handling', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['call', 'success', 'error'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'form-handler', 
        name: 'Form Handler', 
        icon: Send, 
        description: 'Process form submissions with workflows', 
        defaultHeight: 100,
        supportsActions: true,
        supportsEvents: ['submit', 'validate', 'process'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'notification-center', 
        name: 'Notification Center', 
        icon: Bell, 
        description: 'Manage and display notifications', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['notify', 'read', 'dismiss'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'email-sender', 
        name: 'Email Sender', 
        icon: Mail, 
        description: 'Send emails with templates', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['send', 'delivered', 'opened'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'sms-sender', 
        name: 'SMS Sender', 
        icon: MessageSquare, 
        description: 'Send SMS messages', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['send', 'delivered', 'failed'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'scheduler', 
        name: 'Scheduler', 
        icon: Clock, 
        description: 'Schedule actions and workflows', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['schedule', 'execute', 'complete'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'condition-gate', 
        name: 'Condition Gate', 
        icon: GitBranch, 
        description: 'Conditional logic for workflows', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['evaluate', 'true', 'false'],
        supportsDataBinding: true,
        category: 'action'
      },
      { 
        id: 'data-transformer', 
        name: 'Data Transformer', 
        icon: RefreshCw, 
        description: 'Transform data between formats', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['transform', 'complete', 'error'],
        supportsDataBinding: true,
        category: 'action'
      }
    ]
  },

  // Authentication & Security - Complete auth system
  auth: {
    name: 'Auth & Security',
    icon: Shield,
    color: 'bg-red-500',
    widgets: [
      { 
        id: 'login-form', 
        name: 'Login Form', 
        icon: Lock, 
        description: 'User authentication with providers', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['login', 'success', 'error'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'signup-form', 
        name: 'Signup Form', 
        icon: UserPlus, 
        description: 'User registration with validation', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['signup', 'verify', 'complete'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'profile-manager', 
        name: 'Profile Manager', 
        icon: User, 
        description: 'User profile management', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['update', 'save', 'delete'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'password-reset', 
        name: 'Password Reset', 
        icon: Key, 
        description: 'Password recovery workflow', 
        defaultHeight: 250,
        supportsActions: true,
        supportsEvents: ['request', 'verify', 'reset'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'two-factor-auth', 
        name: 'Two-Factor Auth', 
        icon: Shield, 
        description: '2FA authentication system', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['enable', 'verify', 'disable'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'role-manager', 
        name: 'Role Manager', 
        icon: Users, 
        description: 'Role-based access control', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['assign', 'revoke', 'check'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'session-monitor', 
        name: 'Session Monitor', 
        icon: Activity, 
        description: 'Monitor user sessions', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['login', 'logout', 'timeout'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'oauth-connector', 
        name: 'OAuth Connector', 
        icon: Link, 
        description: 'Social login integration', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['connect', 'authorize', 'callback'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'captcha', 
        name: 'CAPTCHA', 
        icon: Shield, 
        description: 'Bot protection system', 
        defaultHeight: 120,
        supportsActions: true,
        supportsEvents: ['verify', 'success', 'fail'],
        supportsDataBinding: true,
        category: 'auth'
      },
      { 
        id: 'audit-log', 
        name: 'Audit Log', 
        icon: FileText, 
        description: 'Security audit logging', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['log', 'alert', 'export'],
        supportsDataBinding: true,
        category: 'auth'
      }
    ]
  },

  // Integrations & APIs - External service connections
  integrations: {
    name: 'Integrations & APIs',
    icon: Link,
    color: 'bg-indigo-500',
    widgets: [
      { 
        id: 'webhook-receiver', 
        name: 'Webhook Receiver', 
        icon: Webhook, 
        description: 'Receive and process webhooks', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['receive', 'process', 'error'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'api-connector', 
        name: 'API Connector', 
        icon: Globe, 
        description: 'Connect to external APIs', 
        defaultHeight: 250,
        supportsActions: true,
        supportsEvents: ['connect', 'sync', 'error'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'database-sync', 
        name: 'Database Sync', 
        icon: Database, 
        description: 'Sync with external databases', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['sync', 'complete', 'conflict'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'file-sync', 
        name: 'File Sync', 
        icon: Cloud, 
        description: 'Cloud file synchronization', 
        defaultHeight: 180,
        supportsActions: true,
        supportsEvents: ['upload', 'download', 'sync'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'payment-gateway', 
        name: 'Payment Gateway', 
        icon: CreditCard, 
        description: 'Payment processor integration', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['charge', 'refund', 'webhook'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'social-media', 
        name: 'Social Media', 
        icon: Share2, 
        description: 'Social platform integration', 
        defaultHeight: 150,
        supportsActions: true,
        supportsEvents: ['post', 'share', 'like'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'analytics-tracker', 
        name: 'Analytics Tracker', 
        icon: BarChart, 
        description: 'Analytics and tracking integration', 
        defaultHeight: 100,
        supportsActions: true,
        supportsEvents: ['track', 'event', 'conversion'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'crm-connector', 
        name: 'CRM Connector', 
        icon: Briefcase, 
        description: 'CRM system integration', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['create-lead', 'update-contact', 'sync'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'email-service', 
        name: 'Email Service', 
        icon: Mail, 
        description: 'Email service provider integration', 
        defaultHeight: 180,
        supportsActions: true,
        supportsEvents: ['send', 'bounce', 'open'],
        supportsDataBinding: true,
        category: 'integration'
      },
      { 
        id: 'calendar-sync', 
        name: 'Calendar Sync', 
        icon: Calendar, 
        description: 'Calendar service integration', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['create-event', 'update', 'reminder'],
        supportsDataBinding: true,
        category: 'integration'
      }
    ]
  },

  // Advanced Features - AI, Real-time, and Complex Functionality
  advanced: {
    name: 'Advanced Features',
    icon: Cpu,
    color: 'bg-gray-600',
    widgets: [
      { 
        id: 'ai-chatbot', 
        name: 'AI Chatbot', 
        icon: MessageCircle, 
        description: 'AI-powered chat interface', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['message', 'response', 'escalate'],
        supportsDataBinding: true,
        category: 'ai'
      },
      { 
        id: 'image-recognition', 
        name: 'Image Recognition', 
        icon: Eye, 
        description: 'AI image analysis and tagging', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['analyze', 'detect', 'classify'],
        supportsDataBinding: true,
        category: 'ai'
      },
      { 
        id: 'text-analyzer', 
        name: 'Text Analyzer', 
        icon: FileText, 
        description: 'AI text processing and insights', 
        defaultHeight: 250,
        supportsActions: true,
        supportsEvents: ['analyze', 'sentiment', 'extract'],
        supportsDataBinding: true,
        category: 'ai'
      },
      { 
        id: 'recommendation-engine', 
        name: 'Recommendation Engine', 
        icon: Target, 
        description: 'AI-powered recommendations', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['recommend', 'click', 'feedback'],
        supportsDataBinding: true,
        category: 'ai'
      },
      { 
        id: 'real-time-chat', 
        name: 'Real-time Chat', 
        icon: MessageSquare, 
        description: 'Live chat with WebSocket', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['message', 'typing', 'join', 'leave'],
        supportsDataBinding: true,
        category: 'realtime'
      },
      { 
        id: 'live-updates', 
        name: 'Live Updates', 
        icon: RefreshCw, 
        description: 'Real-time data synchronization', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['update', 'sync', 'conflict'],
        supportsDataBinding: true,
        category: 'realtime'
      },
      { 
        id: 'collaboration-board', 
        name: 'Collaboration Board', 
        icon: Users, 
        description: 'Multi-user collaboration space', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['join', 'edit', 'cursor-move'],
        supportsDataBinding: true,
        category: 'realtime'
      },
      { 
        id: 'video-conference', 
        name: 'Video Conference', 
        icon: Video, 
        description: 'Video calling integration', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['join', 'leave', 'mute', 'share'],
        supportsDataBinding: true,
        category: 'realtime'
      },
      { 
        id: 'screen-share', 
        name: 'Screen Share', 
        icon: Monitor, 
        description: 'Screen sharing functionality', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['start', 'stop', 'request'],
        supportsDataBinding: true,
        category: 'realtime'
      },
      { 
        id: 'digital-whiteboard', 
        name: 'Digital Whiteboard', 
        icon: Paintbrush, 
        description: 'Collaborative drawing and notes', 
        defaultHeight: 500,
        supportsActions: true,
        supportsEvents: ['draw', 'erase', 'save', 'share'],
        supportsDataBinding: true,
        category: 'realtime'
      }
    ]
  },

  // Layout & Structure - Foundation elements
  layout: {
    name: 'Layout & Structure',
    icon: Layout,
    color: 'bg-slate-500',
    widgets: [
      { 
        id: 'container', 
        name: 'Container', 
        icon: Box, 
        description: 'Flexible container with responsive design', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['resize', 'scroll'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'section', 
        name: 'Section', 
        icon: Layers, 
        description: 'Full-width section with background', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['scroll', 'intersect'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'columns', 
        name: 'Columns', 
        icon: Grid, 
        description: 'Multi-column responsive layout', 
        defaultHeight: 250,
        supportsActions: true,
        supportsEvents: ['resize', 'reorder'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'navbar', 
        name: 'Navigation Bar', 
        icon: Menu, 
        description: 'Navigation with dynamic menu items', 
        defaultHeight: 80,
        supportsActions: true,
        supportsEvents: ['navigate', 'toggle', 'scroll'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'footer', 
        name: 'Footer', 
        icon: Minus, 
        description: 'Page footer with links and content', 
        defaultHeight: 200,
        supportsActions: true,
        supportsEvents: ['click', 'subscribe'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'sidebar', 
        name: 'Sidebar', 
        icon: PanelLeft, 
        description: 'Collapsible sidebar navigation', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['toggle', 'navigate', 'resize'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'modal', 
        name: 'Modal Dialog', 
        icon: Square, 
        description: 'Modal popup with actions', 
        defaultHeight: 300,
        supportsActions: true,
        supportsEvents: ['open', 'close', 'submit'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'drawer', 
        name: 'Drawer', 
        icon: PanelRight, 
        description: 'Slide-out drawer panel', 
        defaultHeight: 400,
        supportsActions: true,
        supportsEvents: ['open', 'close', 'swipe'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'breadcrumb', 
        name: 'Breadcrumb', 
        icon: ChevronRight, 
        description: 'Navigation breadcrumb trail', 
        defaultHeight: 50,
        supportsActions: true,
        supportsEvents: ['navigate', 'click'],
        supportsDataBinding: true,
        category: 'layout'
      },
      { 
        id: 'spacer', 
        name: 'Spacer', 
        icon: Move, 
        description: 'Flexible spacing element', 
        defaultHeight: 60,
        supportsActions: false,
        supportsEvents: [],
        supportsDataBinding: false,
        category: 'layout'
      }
    ]
  }
}

// Action Templates for Universal App Building
const ACTION_TEMPLATES = {
  'user-registration': {
    name: 'User Registration Flow',
    description: 'Complete user signup with email verification',
    icon: UserPlus,
    category: 'authentication',
    actions: [
      { type: 'validate-form', config: { required: ['email', 'password', 'name'] } },
      { type: 'create-record', config: { collection: 'users' } },
      { type: 'send-email', config: { template: 'welcome-verification' } },
      { type: 'redirect', config: { url: '/verify-email' } }
    ]
  },
  'ecommerce-order': {
    name: 'E-commerce Order Processing',
    description: 'Complete order workflow with payment',
    icon: ShoppingCart,
    category: 'ecommerce',
    actions: [
      { type: 'validate-cart', config: {} },
      { type: 'process-payment', config: { provider: 'stripe' } },
      { type: 'create-record', config: { collection: 'orders' } },
      { type: 'update-inventory', config: {} },
      { type: 'send-email', config: { template: 'order-confirmation' } },
      { type: 'trigger-workflow', config: { workflow: 'fulfillment' } }
    ]
  },
  'lead-capture': {
    name: 'Lead Capture & CRM',
    description: 'Capture leads and sync with CRM',
    icon: Target,
    category: 'marketing',
    actions: [
      { type: 'create-record', config: { collection: 'leads' } },
      { type: 'api-call', config: { endpoint: 'crm-sync' } },
      { type: 'trigger-workflow', config: { workflow: 'lead-nurture' } },
      { type: 'send-notification', config: { message: 'New lead captured!' } }
    ]
  },
  'support-ticket': {
    name: 'Support Ticket System',
    description: 'Create and manage support tickets',
    icon: HelpCircle,
    category: 'support',
    actions: [
      { type: 'create-record', config: { collection: 'tickets' } },
      { type: 'send-email', config: { template: 'ticket-created', to: 'support@company.com' } },
      { type: 'send-email', config: { template: 'ticket-confirmation', to: '{{user.email}}' } },
      { type: 'trigger-workflow', config: { workflow: 'ticket-assignment' } }
    ]
  },
  'content-approval': {
    name: 'Content Approval Workflow',
    description: 'Multi-step content approval process',
    icon: CheckCircle,
    category: 'workflow',
    actions: [
      { type: 'update-record', config: { collection: 'content', status: 'pending' } },
      { type: 'send-notification', config: { role: 'editor', message: 'Content ready for review' } },
      { type: 'create-task', config: { assignee: 'editor', type: 'review' } }
    ]
  },
  'data-sync': {
    name: 'Data Synchronization',
    description: 'Sync data between systems',
    icon: RefreshCw,
    category: 'integration',
    actions: [
      { type: 'fetch-data', config: { source: 'external-api' } },
      { type: 'transform-data', config: { mapping: 'api-to-collection' } },
      { type: 'upsert-records', config: { collection: 'synced-data' } },
      { type: 'log-activity', config: { message: 'Data sync completed' } }
    ]
  }
}

// Event Types for Universal Interactions
const EVENT_TYPES = [
  { id: 'click', name: 'Click', icon: MousePointer2, description: 'User clicks element', category: 'user' },
  { id: 'submit', name: 'Form Submit', icon: Send, description: 'Form is submitted', category: 'form' },
  { id: 'change', name: 'Value Change', icon: Edit, description: 'Input value changes', category: 'form' },
  { id: 'load', name: 'Page Load', icon: RefreshCw, description: 'Page finishes loading', category: 'lifecycle' },
  { id: 'scroll', name: 'Scroll', icon: ArrowRight, description: 'User scrolls page', category: 'user' },
  { id: 'hover', name: 'Hover', icon: MousePointer2, description: 'Mouse hovers over element', category: 'user' },
  { id: 'focus', name: 'Focus', icon: Target, description: 'Element receives focus', category: 'form' },
  { id: 'blur', name: 'Blur', icon: Eye, description: 'Element loses focus', category: 'form' },
  { id: 'timer', name: 'Timer', icon: Clock, description: 'Time-based trigger', category: 'system' },
  { id: 'data-change', name: 'Data Change', icon: Database, description: 'Data source updates', category: 'data' },
  { id: 'api-response', name: 'API Response', icon: Globe, description: 'API call completes', category: 'integration' },
  { id: 'payment-success', name: 'Payment Success', icon: CheckCircle, description: 'Payment processed successfully', category: 'ecommerce' },
  { id: 'payment-failed', name: 'Payment Failed', icon: XCircle, description: 'Payment processing failed', category: 'ecommerce' },
  { id: 'user-login', name: 'User Login', icon: Lock, description: 'User successfully logs in', category: 'auth' },
  { id: 'user-logout', name: 'User Logout', icon: Unlock, description: 'User logs out', category: 'auth' },
  { id: 'threshold-reached', name: 'Threshold Reached', icon: AlertTriangle, description: 'Metric reaches threshold', category: 'analytics' },
  { id: 'file-upload', name: 'File Upload', icon: Upload, description: 'File upload completes', category: 'media' },
  { id: 'workflow-complete', name: 'Workflow Complete', icon: CheckCircle2, description: 'Automation workflow finishes', category: 'workflow' },
  { id: 'error-occurred', name: 'Error Occurred', icon: AlertTriangle, description: 'System error happens', category: 'system' },
  { id: 'custom', name: 'Custom Event', icon: Zap, description: 'User-defined custom event', category: 'custom' }
]

// Integration Templates for Universal Connectivity
const INTEGRATION_TEMPLATES = [
  { id: 'stripe-payments', name: 'Stripe Payments', icon: CreditCard, description: 'Payment processing', category: 'payments' },
  { id: 'sendgrid-email', name: 'SendGrid Email', icon: Mail, description: 'Email delivery service', category: 'communication' },
  { id: 'twilio-sms', name: 'Twilio SMS', icon: MessageSquare, description: 'SMS messaging', category: 'communication' },
  { id: 'google-analytics', name: 'Google Analytics', icon: BarChart, description: 'Web analytics', category: 'analytics' },
  { id: 'salesforce-crm', name: 'Salesforce CRM', icon: Briefcase, description: 'Customer relationship management', category: 'crm' },
  { id: 'hubspot-crm', name: 'HubSpot CRM', icon: Users, description: 'Marketing and sales platform', category: 'crm' },
  { id: 'slack-notifications', name: 'Slack Notifications', icon: MessageCircle, description: 'Team communication', category: 'communication' },
  { id: 'google-sheets', name: 'Google Sheets', icon: Table, description: 'Spreadsheet integration', category: 'productivity' },
  { id: 'airtable', name: 'Airtable', icon: Database, description: 'Database and collaboration', category: 'productivity' },
  { id: 'notion', name: 'Notion', icon: FileText, description: 'Workspace and documentation', category: 'productivity' },
  { id: 'zapier', name: 'Zapier', icon: Zap, description: 'Automation platform', category: 'automation' },
  { id: 'aws-s3', name: 'AWS S3', icon: Cloud, description: 'Cloud file storage', category: 'storage' },
  { id: 'cloudinary', name: 'Cloudinary', icon: Image, description: 'Media management', category: 'media' },
  { id: 'auth0', name: 'Auth0', icon: Shield, description: 'Authentication service', category: 'auth' },
  { id: 'firebase', name: 'Firebase', icon: Database, description: 'Backend as a service', category: 'backend' }
]

// Enhanced Draggable Widget Component with Universal Capabilities and Error Handling
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
      defaultStyle: widget.defaultStyle || {},
      // Universal capabilities
      supportsActions: widget.supportsActions || false,
      supportsEvents: widget.supportsEvents || [],
      supportsDataBinding: widget.supportsDataBinding || false,
      widgetCategory: widget.category || 'general'
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  // Safe icon handling with fallback
  const IconComponent = widget.icon || Package // Fallback icon
  const categoryData = WIDGET_CATEGORIES[category as keyof typeof WIDGET_CATEGORIES]

  // Error boundary for widget rendering
  if (!widget || !widget.name) {
    return (
      <div className="p-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-red-800">Invalid Widget</p>
            <p className="text-xs text-red-600">Widget data is missing or corrupted</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <m.div
      ref={drag as any}
      className={cn(
        "group p-4 rounded-xl border-2 border-dashed border-transparent hover:border-primary/30 cursor-grab active:cursor-grabbing transition-all duration-200",
        "bg-card hover:bg-accent/30 hover:shadow-sm",
        isDragging && "opacity-50 scale-95 shadow-lg"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
          categoryData?.color || 'bg-gray-500'
        )}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{widget.name}</p>
          <p className="text-xs text-muted-foreground truncate leading-relaxed">{widget.description}</p>
          
          {/* Universal Capability Indicators */}
          <div className="flex items-center gap-1 mt-2">
            {widget.supportsActions && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
                <Zap className="w-2 h-2 mr-1" />
                Actions
              </Badge>
            )}
            {widget.supportsDataBinding && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
                <Database className="w-2 h-2 mr-1" />
                Data
              </Badge>
            )}
            {widget.supportsEvents && widget.supportsEvents.length > 0 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">
                <Activity className="w-2 h-2 mr-1" />
                Events
              </Badge>
            )}
          </div>
        </div>
      </div>
    </m.div>
  )
}

export function EditorSidebar({ 
  appId, 
  onAddElement, 
  currentPageId, 
  selectedElement 
}: { 
  appId?: string
  onAddElement?: (element: any) => void
  currentPageId?: string
  selectedElement?: any
}) {
  const [activeTab, setActiveTab] = useState('elements')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showActionBuilder, setShowActionBuilder] = useState(false)
  const [selectedActionTemplate, setSelectedActionTemplate] = useState<string | null>(null)
  
  // Get current page info from editor context with error handling
  let currentPage, pages
  try {
    const editorContext = useEditor()
    currentPage = editorContext.currentPage
    pages = editorContext.pages
  } catch (error) {
    console.warn('Editor context not available:', error)
    currentPage = null
    pages = []
  }

  // Enhanced filter for universal widgets with capabilities
  const filteredWidgets = useMemo(() => {
    const filtered: any = {}
    
    Object.entries(WIDGET_CATEGORIES).forEach(([categoryKey, category]) => {
      filtered[categoryKey] = category.widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.category && widget.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
    
    return filtered
  }, [searchQuery])

  // Enhanced element addition with universal capabilities
  const handleAddElement = useCallback((element: any) => {
    if (!currentPageId) {
      alert('Please select a page before adding elements')
      return
    }

    // Enhanced element configuration with universal capabilities
    const elementConfig = {
      id: `${element.widgetType || element.type}-${Date.now()}`,
      type: element.widgetType || element.type,
      position: { x: 0, y: 0 },
      size: { 
        width: element.defaultWidth || 1440,
        height: element.defaultHeight || 200 
      },
      props: {
        ...element.defaultProps,
        title: element.name || `New ${element.type}`,
        category: element.widgetCategory || 'general'
      },
      style: element.defaultStyle || {},
      children: [],
      // Universal capabilities
      capabilities: {
        supportsActions: element.supportsActions || false,
        supportsEvents: element.supportsEvents || [],
        supportsDataBinding: element.supportsDataBinding || false,
        category: element.widgetCategory || 'general'
      },
      // Initialize empty configurations for universal features
      actions: element.supportsActions ? [] : undefined,
      events: element.supportsEvents && element.supportsEvents.length > 0 ? {} : undefined,
      dataBinding: element.supportsDataBinding ? null : undefined,
      // Integration readiness
      integrations: [],
      workflows: [],
      permissions: null
    }
    
    if (onAddElement) {
      onAddElement(elementConfig)
    }
  }, [onAddElement, currentPageId])

  return (
    <div className="w-80 h-full bg-background border-r flex flex-col overflow-hidden shadow-sm">
      {/* Enhanced Header with Universal Builder Branding */}
      <div className="p-4 border-b bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">Universal Builder</h2>
            <p className="text-xs text-muted-foreground">Drag & Drop • Actions • Data</p>
          </div>
        </div>
        
        {/* Page Selection Warning */}
        {!currentPageId && (
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-3 text-yellow-800 mb-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Select a Page First</span>
            </div>
            <p className="text-sm text-yellow-700 leading-relaxed">
              Choose a page from the <strong>Pages</strong> tab in the right panel to start building your app.
            </p>
          </div>
        )}
        
        {/* Current Page Indicator with Enhanced Info */}
        {currentPageId && currentPage && (
          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3 text-green-800 mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Editing: {currentPage.title}</span>
                  {currentPage.is_homepage && <span className="text-lg">🏠</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-green-700">
              <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-md">
                <Zap className="w-3 h-3" />
                Actions Ready
              </span>
              <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md">
                <Database className="w-3 h-3" />
                Data Binding
              </span>
              <span className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-md">
                <Activity className="w-3 h-3" />
                Events
              </span>
            </div>
          </div>
        )}
        
        {/* Enhanced Search with Capability Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets, actions, integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background border-2 focus:border-primary/50"
              disabled={!currentPageId}
            />
          </div>
          
          {/* Quick Capability Filters */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium"
              onClick={() => setSearchQuery('supportsActions')}
            >
              <Zap className="w-3 h-3 mr-1" />
              Actions
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium"
              onClick={() => setSearchQuery('supportsDataBinding')}
            >
              <Database className="w-3 h-3 mr-1" />
              Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium"
              onClick={() => setSearchQuery('ecommerce')}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              E-com
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs with Better Organization */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4">
          {/* Primary Tabs - Most Used */}
          <TabsList className="grid w-full grid-cols-4 mb-2 h-10">
            <TabsTrigger value="elements" className="text-sm font-medium">
              <Layers className="w-4 h-4 mr-1" />
              Elements
            </TabsTrigger>
            <TabsTrigger value="widgets" className="text-sm font-medium">
              <Component className="w-4 h-4 mr-1" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-sm font-medium">
              <Zap className="w-4 h-4 mr-1" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="data" className="text-sm font-medium">
              <Database className="w-4 h-4 mr-1" />
              Data
            </TabsTrigger>
          </TabsList>
          
          {/* Secondary Tabs - Advanced Features */}
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="integrations" className="text-sm font-medium">
              <Link className="w-4 h-4 mr-1" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-sm font-medium">
              <Package className="w-4 h-4 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-1" />
              AI
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Elements Tab - Pre-built Elements */}
        <TabsContent value="elements" className="flex-1 mt-6 overflow-hidden">
          <ElementLibraryContent onAddElement={handleAddElement} />
        </TabsContent>

        {/* Universal Widgets Tab */}
        <TabsContent value="widgets" className="flex-1 mt-6 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 space-y-6 pb-6">
              {Object.entries(WIDGET_CATEGORIES).map(([categoryKey, category]) => {
                const widgets = filteredWidgets[categoryKey] || []
                if (widgets.length === 0) return null

                const IconComponent = category.icon

                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shadow-sm",
                        category.color
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-sm">{category.name}</h3>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {widgets.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
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

        {/* Actions & Workflows Tab */}
        <TabsContent value="actions" className="flex-1 mt-6 overflow-hidden">
          <ActionsTab 
            appId={appId || ''} 
            onAddElement={handleAddElement}
            actionTemplates={ACTION_TEMPLATES}
            eventTypes={EVENT_TYPES}
          />
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data" className="flex-1 mt-6 overflow-hidden">
          <DataTabContent appId={currentPage?.app_id || appId || ''} onAddElement={handleAddElement} />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="flex-1 mt-6 overflow-hidden">
          <IntegrationsTab 
            appId={appId || ''} 
            integrationTemplates={INTEGRATION_TEMPLATES}
            onAddElement={handleAddElement}
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 mt-6 overflow-hidden">
          <TemplatesTab appId={appId || ''} onAddElement={handleAddElement} />
        </TabsContent>

        {/* AI Generate Tab */}
        <TabsContent value="ai" className="flex-1 mt-6 overflow-hidden">
          <AIGenerationTab appId={appId || ''} onAddElement={handleAddElement} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Actions Tab Component - Universal Action Management
function ActionsTab({ 
  appId, 
  onAddElement, 
  actionTemplates, 
  eventTypes 
}: { 
  appId: string
  onAddElement: (element: any) => void
  actionTemplates: any
  eventTypes: any[]
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-6 pb-4">
        {/* Quick Action Templates */}
        <div>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Action Templates
          </h3>
          <div className="space-y-2">
            {Object.entries(actionTemplates).map(([key, template]: [string, any]) => (
              <Card key={key} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                    <template.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
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
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Event Triggers
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {eventTypes.map((event) => (
              <Card key={event.id} className="p-2 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <event.icon className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-xs">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Action Builder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Custom Actions
            </h3>
            <Button size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Build Action
            </Button>
          </div>
          <Card className="p-4 border-dashed">
            <div className="text-center text-muted-foreground">
              <Workflow className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Create custom workflows</p>
              <p className="text-xs">Combine multiple actions into powerful sequences</p>
            </div>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// Integrations Tab Component - Universal Integration Management
function IntegrationsTab({ 
  appId, 
  integrationTemplates, 
  onAddElement 
}: { 
  appId: string
  integrationTemplates: any[]
  onAddElement: (element: any) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Integrations', count: integrationTemplates.length },
    { id: 'payments', name: 'Payments', count: integrationTemplates.filter(i => i.category === 'payments').length },
    { id: 'communication', name: 'Communication', count: integrationTemplates.filter(i => i.category === 'communication').length },
    { id: 'crm', name: 'CRM', count: integrationTemplates.filter(i => i.category === 'crm').length },
    { id: 'productivity', name: 'Productivity', count: integrationTemplates.filter(i => i.category === 'productivity').length },
    { id: 'analytics', name: 'Analytics', count: integrationTemplates.filter(i => i.category === 'analytics').length }
  ]

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrationTemplates 
    : integrationTemplates.filter(i => i.category === selectedCategory)

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-6 pb-4">
        {/* Integration Categories */}
        <div>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Link className="w-4 h-4" />
            Integration Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-between text-xs h-8"
                onClick={() => setSelectedCategory(category.id)}
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Available Integrations */}
        <div>
          <h3 className="font-medium text-sm mb-3">Available Integrations</h3>
          <div className="space-y-2">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                    <integration.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {integration.category}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Integration Status */}
        <div>
          <h3 className="font-medium text-sm mb-3">Connected Services</h3>
          <Card className="p-4 border-dashed">
            <div className="text-center text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No integrations connected</p>
              <p className="text-xs">Connect services to unlock powerful features</p>
            </div>
          </Card>
        </div>
      </div>
    </ScrollArea>
  )
}

// Templates Tab Component - Universal App Templates
function TemplatesTab({ 
  appId, 
  onAddElement 
}: { 
  appId: string
  onAddElement: (element: any) => void
}) {
  const templates = [
    {
      id: 'saas-dashboard',
      name: 'SaaS Dashboard',
      description: 'Complete SaaS application with user management',
      category: 'SaaS',
      features: ['User Auth', 'Billing', 'Analytics', 'API'],
      complexity: 'Advanced'
    },
    {
      id: 'ecommerce-store',
      name: 'E-commerce Store',
      description: 'Full-featured online store with cart and payments',
      category: 'E-commerce',
      features: ['Product Catalog', 'Shopping Cart', 'Payments', 'Orders'],
      complexity: 'Advanced'
    },
    {
      id: 'crm-system',
      name: 'CRM System',
      description: 'Customer relationship management platform',
      category: 'Business',
      features: ['Contact Management', 'Sales Pipeline', 'Reports', 'Tasks'],
      complexity: 'Advanced'
    },
    {
      id: 'blog-platform',
      name: 'Blog Platform',
      description: 'Content management and publishing system',
      category: 'Content',
      features: ['Post Editor', 'Comments', 'SEO', 'Analytics'],
      complexity: 'Intermediate'
    },
    {
      id: 'booking-system',
      name: 'Booking System',
      description: 'Appointment and reservation management',
      category: 'Business',
      features: ['Calendar', 'Payments', 'Notifications', 'Reports'],
      complexity: 'Intermediate'
    },
    {
      id: 'portfolio-site',
      name: 'Portfolio Website',
      description: 'Professional portfolio with project showcase',
      category: 'Portfolio',
      features: ['Gallery', 'Contact Form', 'Blog', 'SEO'],
      complexity: 'Beginner'
    }
  ]

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-4 pb-4">
        <div className="text-center py-4">
          <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
            <Package className="w-5 h-5" />
            Universal App Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Start with complete solutions for any industry or use case
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
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Badge 
                      variant={template.complexity === 'Advanced' ? 'destructive' : 
                              template.complexity === 'Intermediate' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {template.complexity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.features.length} features
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {template.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.features.length - 3} more
                      </Badge>
                    )}
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

// AI Generation Tab Component - AI-Powered Universal Builder
function AIGenerationTab({ 
  appId, 
  onAddElement 
}: { 
  appId: string
  onAddElement: (element: any) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const suggestions = [
    { text: 'Create a user dashboard with analytics charts', category: 'Dashboard' },
    { text: 'Build an e-commerce product page with reviews', category: 'E-commerce' },
    { text: 'Design a contact form with validation', category: 'Forms' },
    { text: 'Generate a pricing table with features', category: 'Business' },
    { text: 'Create a blog post layout with comments', category: 'Content' },
    { text: 'Build a login form with social auth', category: 'Authentication' },
    { text: 'Design a team member showcase', category: 'About' },
    { text: 'Create a booking calendar interface', category: 'Booking' }
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      // AI generation logic would go here
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      // For now, create a placeholder element
      onAddElement({
        type: 'ai-generated',
        name: 'AI Generated Component',
        description: `Generated from: "${prompt}"`,
        supportsActions: true,
        supportsEvents: ['click', 'load'],
        supportsDataBinding: true,
        category: 'ai'
      })
      
      setPrompt('')
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-6 pb-4">
        {/* AI Generation Interface */}
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-semibold mb-2">AI Universal Builder</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Describe any app component and AI will create it with full functionality
          </p>
          
          <div className="space-y-3">
            <div className="relative">
              <Input 
                placeholder="Describe what you want to build..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="pr-12"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <Button 
                size="sm" 
                className="absolute right-1 top-1 h-8"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              <span>Includes actions, events, and data binding</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* AI Suggestions */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quick Suggestions
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-3 px-3"
                onClick={() => setPrompt(suggestion.text)}
              >
                <div className="flex items-start gap-2 w-full">
                  <Sparkles className="w-3 h-3 mt-0.5 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{suggestion.text}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {suggestion.category}
                    </Badge>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* AI Capabilities */}
        <div>
          <h4 className="font-medium text-sm mb-3">AI Capabilities</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Generates functional components</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Includes data binding setup</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Configures actions and events</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Applies best practices</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Responsive design ready</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
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
          error: apiError?.message || 'Unknown error',
          status: apiError?.response?.status || 'No status',
          statusText: apiError?.response?.statusText || 'No status text',
          data: apiError?.response?.data || 'No response data',
          errorType: apiError?.constructor?.name || 'Unknown type',
          isAxiosError: apiError?.isAxiosError || false,
          code: apiError?.code || 'No code'
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
                <m.div
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
                </m.div>
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

// Data Tab Content Component
function DataTabContent({ appId, onAddElement }: { appId: string; onAddElement: (element: any) => void }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<{
    sourceId: string;
    endpointId?: string;
    sourceType?: 'api' | 'scraper' | 'collection';
  } | null>(null);

  useEffect(() => {
    if (appId) {
      loadData();
    }
  }, [appId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collectionsData, dataSourcesData] = await Promise.all([
        getCollections(appId).catch(() => []),
        getDataSources(appId).catch(() => [])
      ]);
      
      setCollections(collectionsData);
      setDataSources(dataSourcesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceSelect = (sourceId: string, endpointId?: string, sourceType?: 'api' | 'scraper' | 'collection') => {
    setSelectedDataSource({ sourceId, endpointId, sourceType });
  };

  const handleAddDataWidget = (widgetType: string, dataConfig?: any) => {
    const widgetId = `${widgetType}-${Date.now()}`;
    
    onAddElement({
      id: widgetId,
      type: widgetType,
      props: {
        title: `${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
        dataSource: selectedDataSource,
        ...dataConfig
      },
      style: {
        width: '100%',
        minHeight: '300px'
      }
    });
  };

  const dataWidgets = [
    { id: 'collection-list', name: 'Collection List', icon: Layers, description: 'Display collection records' },
    { id: 'collection-grid', name: 'Collection Grid', icon: Grid, description: 'Grid of collection items' },
    { id: 'collection-cards', name: 'Collection Cards', icon: CreditCard, description: 'Card layout for records' },
    { id: 'data-table', name: 'Data Table', icon: Table, description: 'Advanced data table' },
    { id: 'api-data', name: 'API Data', icon: Zap, description: 'External API data' },
    { id: 'dynamic-content', name: 'Dynamic Content', icon: Sparkles, description: 'Content from data' }
  ];

  return (
    <ScrollArea className="h-full">
      <div className="px-4 space-y-6 pb-4">
        {/* Data Source Selection */}
        <div>
          <h3 className="font-medium text-sm mb-3">Data Source</h3>
          <DataSourceSelector
            appId={appId}
            selectedSourceId={selectedDataSource?.sourceId}
            selectedEndpointId={selectedDataSource?.endpointId}
            onSelect={handleDataSourceSelect}
          />
          
          {selectedDataSource && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Data source connected</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Data Widgets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-xs bg-cyan-500">
              <Database className="w-3 h-3" />
            </div>
            <h3 className="font-medium text-sm">Data Widgets</h3>
            <Badge variant="secondary" className="text-xs">
              {dataWidgets.length}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {dataWidgets.map((widget) => {
              const IconComponent = widget.icon;
              return (
                <m.div
                  key={widget.id}
                  className={cn(
                    "group p-3 rounded-lg border-2 border-dashed border-transparent hover:border-primary/50 cursor-pointer transition-all duration-200",
                    "bg-card hover:bg-accent/50",
                    !selectedDataSource && "opacity-50 cursor-not-allowed"
                  )}
                  whileHover={selectedDataSource ? { scale: 1.02 } : {}}
                  whileTap={selectedDataSource ? { scale: 0.98 } : {}}
                  onClick={() => selectedDataSource && handleAddDataWidget(widget.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm bg-cyan-500">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{widget.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </div>
          
          {!selectedDataSource && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Select a data source first</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Stats */}
        <div>
          <h3 className="font-medium text-sm mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold">{collections.length}</div>
                <div className="text-xs text-muted-foreground">Collections</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold">{dataSources.length}</div>
                <div className="text-xs text-muted-foreground">Data Sources</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(`/dashboard/apps/${appId}/data`, '_blank')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Collection
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(`/dashboard/apps/${appId}/data`, '_blank')}
            >
              <Database className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.open(`/dashboard/apps/${appId}/data`, '_blank')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Data
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}