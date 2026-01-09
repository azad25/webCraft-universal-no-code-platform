'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Clock,
  ArrowRight,
  Zap,
  Eye,
  Settings,
  ExternalLink,
  Activity,
  Calendar,
  FileText,
  ShoppingCart,
  Briefcase,
  Camera,
  Star,
  ChevronRight,
  Layers,
  Palette,
  Code,
  Smartphone,
  Database,
  Bot,
  Target,
  Shield,
  CheckCircle,
  Play,
  Bell,
  Image,
  Workflow
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useGetAppsQuery } from '@/store/api/apiSlice'
import { MediaManager } from '@/components/admin/media-manager'

const QUICK_ACTIONS = [
  {
    id: 'new-app',
    title: 'Create New App',
    description: 'Start building with templates or from scratch',
    icon: Plus,
    color: 'from-blue-500 to-purple-600',
    href: '/dashboard/apps/new',
  },
  {
    id: 'templates',
    title: 'Browse Templates',
    description: 'Professional templates for every use case',
    icon: Layers,
    color: 'from-green-500 to-teal-600',
    href: '/dashboard/templates',
  },
  {
    id: 'automations',
    title: 'Automations',
    description: 'Build powerful workflow automations',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    href: '/dashboard/automations',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track performance and user engagement',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-600',
    href: '/dashboard/analytics',
  },
]

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Visual Editor',
    description: 'Drag-and-drop interface with 60+ widgets',
    icon: Palette,
    stats: '60+ Widgets',
  },
  {
    title: 'AI Assistant',
    description: 'Generate content and get design suggestions',
    icon: Sparkles,
    stats: 'AI Powered',
  },
  {
    title: 'Mobile Ready',
    description: 'Responsive design and mobile SDKs',
    icon: Smartphone,
    stats: 'iOS & Android',
  },
  {
    title: 'Export Options',
    description: 'Static sites, PWAs, and native apps',
    icon: Code,
    stats: 'Multiple Formats',
  },
]

const APP_TYPE_ICONS = {
  website: Globe,
  ecommerce: ShoppingCart,
  business: Briefcase,
  portfolio: Camera,
  blog: FileText,
  landing: Sparkles,
  crm: Users,
  dashboard: BarChart3,
}

const STATS_DATA = [
  { label: 'Total Apps', value: '12', change: '+2', icon: Globe, color: 'bg-blue-500' },
  { label: 'Active Automations', value: '34', change: '+8', icon: Zap, color: 'bg-purple-500' },
  { label: 'Data Sources', value: '18', change: '+3', icon: Database, color: 'bg-green-500' },
  { label: 'Monthly Executions', value: '2.4K', change: '+15%', icon: Activity, color: 'bg-orange-500' }
]

const RECENT_ACTIVITY = [
  { id: 1, type: 'automation', title: 'Welcome Email Flow', status: 'completed', time: '2 min ago', executions: 12 },
  { id: 2, type: 'data_source', title: 'Weather API', status: 'connected', time: '5 min ago', executions: 0 },
  { id: 3, type: 'automation', title: 'Order Processing', status: 'running', time: '10 min ago', executions: 3 },
  { id: 4, type: 'app', title: 'E-commerce Store', status: 'published', time: '1 hour ago', executions: 0 },
]

const AUTOMATION_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email Series', description: 'Onboard new users with email sequence', category: 'Marketing', icon: Bot },
  { id: 'order', name: 'Order Processing', description: 'Automate order fulfillment workflow', category: 'E-commerce', icon: Workflow },
  { id: 'lead', name: 'Lead Nurturing', description: 'Follow up with potential customers', category: 'Sales', icon: Target },
  { id: 'support', name: 'Support Ticket', description: 'Auto-assign and track support requests', category: 'Support', icon: Shield },
]

export default function DashboardPage() {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showMediaManager, setShowMediaManager] = useState(false)

  const { data: appsData, isLoading } = useGetAppsQuery({
    page: 1,
    perPage: 6
  })

  const apps = appsData?.apps || []
  const recentApps = apps.slice(0, 3)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getUsageProgress = () => {
    return {
      apps: { current: apps.length, limit: 10 },
      storage: { current: 2.4, limit: 10 },
      bandwidth: { current: 45, limit: 100 },
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success" />
      case 'running': return <Play className="w-4 h-4 text-primary" />
      case 'connected': return <CheckCircle className="w-4 h-4 text-success" />
      case 'published': return <Globe className="w-4 h-4 text-primary" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      running: 'secondary',
      connected: 'default',
      published: 'default',
      draft: 'outline',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const usage = getUsageProgress()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {greeting}! 👋
              </h1>
              <p className="text-xl text-muted-foreground">
                Ready to build something amazing?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowMediaManager(true)}
                className="hidden sm:flex"
              >
                <Image className="w-4 h-4 mr-2" />
                Media
              </Button>
              <Button
                onClick={() => router.push('/dashboard/apps/new')}
                className="btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="automations" className="data-[state=active]:bg-background">
              Automations
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="data-[state=active]:bg-background">
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="apps" className="data-[state=active]:bg-background">
              Apps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS_DATA.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold mt-2">{stat.value}</p>
                          <p className="text-sm text-success mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stat.change}
                          </p>
                        </div>
                        <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center`}>
                          <stat.icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_ACTIONS.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Card
                      key={action.id}
                      className="card-interactive group relative overflow-hidden"
                      onClick={() => router.push(action.href)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                      <CardHeader className="pb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-3">
                          {action.description}
                        </CardDescription>
                        <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Apps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Recent Apps</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('apps')}
                    className="text-primary hover:text-primary-hover"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg" />
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                              <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : recentApps.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No apps yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first app to get started
                      </p>
                      <Button onClick={() => router.push('/dashboard/apps/new')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create App
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {recentApps.map((app: any, index: number) => {
                      const Icon = APP_TYPE_ICONS[app.app_type as keyof typeof APP_TYPE_ICONS] || Globe
                      return (
                        <Card
                          key={app.id}
                          className="card-interactive group"
                          onClick={() => router.push(`/editor/${app.id}`)}
                        >
                          <CardHeader>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                                  {app.is_published && (
                                    <Badge variant="outline" className="text-xs">
                                      <Globe className="w-3 h-3 mr-1" />
                                      Live
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="capitalize">{app.app_type}</span>
                                  <span>•</span>
                                  <span>Updated {formatDate(app.updated_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                                Edit
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                {/* Usage Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Overview</CardTitle>
                    <CardDescription>Your current plan usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Apps</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.apps.current}/{usage.apps.limit}
                        </span>
                      </div>
                      <Progress value={(usage.apps.current / usage.apps.limit) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Storage</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.storage.current}GB/{usage.storage.limit}GB
                        </span>
                      </div>
                      <Progress value={(usage.storage.current / usage.storage.limit) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Bandwidth</span>
                        <span className="text-sm text-muted-foreground">
                          {usage.bandwidth.current}GB/{usage.bandwidth.limit}GB
                        </span>
                      </div>
                      <Progress value={(usage.bandwidth.current / usage.bandwidth.limit) * 100} className="h-2" />
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {RECENT_ACTIVITY.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3">
                          {getStatusIcon(activity.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          {activity.executions > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {activity.executions}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Highlights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Features</CardTitle>
                    <CardDescription>What you can build with WebCraft</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {FEATURE_HIGHLIGHTS.map((feature) => {
                      const Icon = feature.icon
                      return (
                        <div key={feature.title} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium">{feature.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {feature.stats}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="automations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Automations</h2>
                <p className="text-muted-foreground">Manage your workflow automations</p>
              </div>
              <Button onClick={() => router.push('/dashboard/automations/new')}>
                <Plus className="w-4 h-4 mr-2" />
                New Automation
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Success Rate</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Avg. Execution Time</span>
                      <span>2.3s</span>
                    </div>
                    <Progress value={76} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Active Workflows</span>
                      <span>12/15</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Templates */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Automation Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {AUTOMATION_TEMPLATES.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <template.icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Data Sources</h2>
                <p className="text-muted-foreground">Connect external APIs and scrapers</p>
              </div>
              <Button onClick={() => router.push('/dashboard/data-sources/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Data Source
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connected APIs</span>
                    <Badge variant="default">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Scrapers</span>
                    <Badge variant="secondary">6</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Connections</span>
                    <Badge variant="destructive">2</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>API Calls</span>
                      <span>1.2K/5K</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Scraper Runs</span>
                      <span>45/100</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cache Hit Rate</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm">Google Sheets</span>
                    </div>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Weather API</span>
                    </div>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm">Airtable</span>
                    </div>
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apps" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Your Apps</h2>
                <p className="text-muted-foreground">Manage and monitor your applications</p>
              </div>
              <Button onClick={() => router.push('/dashboard/apps')}>
                View All Apps
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-32 bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : apps.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No apps yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first app to get started</p>
                  <Button onClick={() => router.push('/dashboard/apps/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create App
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apps.map((app: any, i: number) => {
                  const Icon = APP_TYPE_ICONS[app.app_type as keyof typeof APP_TYPE_ICONS] || Globe
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="card-interactive group overflow-hidden">
                        <div className="h-32 bg-gradient-primary relative">
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="absolute bottom-3 left-3">
                            <Badge variant={app.is_published ? 'default' : 'secondary'}>
                              {app.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          <div className="absolute top-3 right-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-4">
                            <h3 className="font-semibold text-lg mb-1">{app.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{app.app_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/editor/${app.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/apps/${app.id}/deploy`)}
                            >
                              <Globe className="w-4 h-4" />
                            </Button>
                            {app.is_published && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = app.custom_domain 
                                    ? `https://${app.custom_domain}` 
                                    : `https://${app.subdomain || app.slug}.webcraft.dev`
                                  window.open(url, '_blank')
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Media Manager */}
        <MediaManager
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onSelect={(file) => {
            console.log('Selected media file:', file)
          }}
          allowMultiple={true}
          appId="dashboard"
        />
      </div>
    </div>
  )
}