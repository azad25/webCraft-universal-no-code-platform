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
      { id: 'video-call', name: 'Video Call', icon: Vid