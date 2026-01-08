'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Plus, Search, MoreHorizontal, Globe, Eye, Settings, Trash2, Copy, ExternalLink, 
  TrendingUp, Users, MousePointer, Clock, Zap, Database, Activity, AlertCircle,
  CheckCircle, Play, Pause, BarChart3, Workflow, Bot, Layers, GitBranch,
  Calendar, Bell, Shield, Rocket, Target, Sparkles, Upload, Image, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useGetAppsQuery } from '@/store/api/apiSlice'
import { MediaManager } from '@/components/admin/media-manager'

const stats = [
  { label: 'Total Apps', value: '12', change: '+2', icon: Globe, color: 'bg-blue-500' },
  { label: 'Active Automations', value: '34', change: '+8', icon: Zap, color: 'bg-purple-500' },
  { label: 'Data Sources', value: '18', change: '+3', icon: Database, color: 'bg-green-500' },
  { label: 'Monthly Executions', value: '2.4K', change: '+15%', icon: Activity, color: 'bg-orange-500' }
]

const recentActivity = [
  { id: 1, type: 'automation', title: 'Welcome Email Flow', status: 'completed', time: '2 min ago', executions: 12 },
  { id: 2, type: 'data_source', title: 'Weather API', status: 'connected', time: '5 min ago', executions: 0 },
  { id: 3, type: 'automation', title: 'Order Processing', status: 'running', time: '10 min ago', executions: 3 },
  { id: 4, type: 'app', title: 'E-commerce Store', status: 'published', time: '1 hour ago', executions: 0 },
]

const automationTemplates = [
  { id: 'welcome', name: 'Welcome Email Series', description: 'Onboard new users with email sequence', category: 'Marketing', icon: Bot },
  { id: 'order', name: 'Order Processing', description: 'Automate order fulfillment workflow', category: 'E-commerce', icon: Workflow },
  { id: 'lead', name: 'Lead Nurturing', description: 'Follow up with potential customers', category: 'Sales', icon: Target },
  { id: 'support', name: 'Support Ticket', description: 'Auto-assign and track support requests', category: 'Support', icon: Shield },
]

const integrationSpotlight = [
  { name: 'Google Sheets', icon: Database, status: 'available', category: 'Productivity' },
  { name: 'Airtable', icon: Database, status: 'available', category: 'Database' },
  { name: 'Notion', icon: Database, status: 'available', category: 'Productivity' },
  { name: 'Discord', icon: Bell, status: 'available', category: 'Communication' },
  { name: 'Slack', icon: Bell, status: 'connected', category: 'Communication' },
  { name: 'Trello', icon: Layers, status: 'available', category: 'Project Management' },
]

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showMediaManager, setShowMediaManager] = useState(false)
  const { data, isLoading } = useGetAppsQuery({ page: 1, perPage: 20 })
  
  const apps = data?.apps || []
  const filteredApps = apps.filter((app: any) => 
    app.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running': return <Play className="w-4 h-4 text-blue-500" />
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'published': return <Globe className="w-4 h-4 text-blue-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                WebCraft Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Build, automate, and scale your applications</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/templates">
                  <Rocket className="w-4 h-4 mr-2" />
                  Templates
                </Link>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMediaManager(true)}
              >
                <Image className="w-4 h-4 mr-2" />
                Media
              </Button>
              <Button asChild>
                <Link href="/apps/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New App
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="automations">Automations</TabsTrigger>
            <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="apps">Apps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-2xl font-bold mt-1">{stat.value}</p>
                          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stat.change}
                          </p>
                        </div>
                        <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(activity.status)}
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activity.executions > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {activity.executions} runs
                            </Badge>
                          )}
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Automation Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Automation Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {automationTemplates.map((template) => (
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

            {/* Integration Spotlight */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Popular Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {integrationSpotlight.map((integration) => (
                    <div key={integration.name} className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-2">
                        <integration.icon className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-sm text-center">{integration.name}</p>
                      <p className="text-xs text-muted-foreground text-center">{integration.category}</p>
                      {integration.status === 'connected' && (
                        <Badge variant="default" className="mt-2 text-xs">Connected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Automations</h2>
                <p className="text-sm text-muted-foreground">Manage your workflow automations</p>
              </div>
              <Button asChild>
                <Link href="/automations/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Automation
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Automation Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Avg. Execution Time</span>
                        <span>2.3s</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Workflows</span>
                        <span>12/15</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Zap className="w-4 h-4 mr-2" />
                      Create Automation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Bot className="w-4 h-4 mr-2" />
                      Browse Templates
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Triggers
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Executions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Welcome Email</span>
                      </div>
                      <span className="text-xs text-muted-foreground">2m ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Order Processing</span>
                      </div>
                      <span className="text-xs text-muted-foreground">5m ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Lead Nurturing</span>
                      </div>
                      <span className="text-xs text-muted-foreground">10m ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data-sources" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Data Sources</h2>
                <p className="text-sm text-muted-foreground">Connect external APIs and scrapers</p>
              </div>
              <Button asChild>
                <Link href="/data-sources/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Data Source
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Refresh Rate</span>
                      <span className="text-sm text-muted-foreground">5min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span className="text-sm">Google Sheets</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Weather API</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span className="text-sm">Airtable</span>
                      </div>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>API Calls</span>
                        <span>1.2K/5K</span>
                      </div>
                      <Progress value={24} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Scraper Runs</span>
                        <span>45/100</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cache Hit Rate</span>
                        <span>87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apps" className="space-y-6">
            {/* Apps Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Apps</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search apps..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No apps yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first app to get started</p>
                    <Link href="/apps/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create App
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApps.map((app: any, i: number) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                          <div className="absolute inset-0 bg-black/20" />
                          <div className="absolute bottom-3 left-3">
                            <Badge variant={app.is_published ? 'default' : 'secondary'}>
                              {app.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{app.name}</h3>
                              <p className="text-sm text-muted-foreground">{app.app_type}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/apps/${app.id}/deploy`}>
                                    <Globe className="w-4 h-4 mr-2" />
                                    Deploy
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Automations
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Database className="w-4 h-4 mr-2" />
                                  Data Sources
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/apps/${app.id}/export`}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <Link href={`/editor/${app.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/apps/${app.id}/deploy`}>
                              <Button variant="outline" size="sm">
                                <Globe className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/apps/${app.id}/automations`}>
                              <Button variant="ghost" size="sm">
                                <Zap className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/apps/${app.id}/data-sources`}>
                              <Button variant="ghost" size="sm">
                                <Database className="w-4 h-4" />
                              </Button>
                            </Link>
                            {app.is_published && (
                              <Button 
                                variant="ghost" 
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
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Media Manager */}
        <MediaManager
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onSelect={(file) => {
            console.log('Selected media file:', file)
            // Handle media selection here
          }}
          allowMultiple={true}
          appId="dashboard"
        />
      </main>
    </div>
  )
}
