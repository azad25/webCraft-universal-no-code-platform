'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Plus,
  Database,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'

const DATA_SOURCES = [
  {
    id: 1,
    name: 'Google Sheets API',
    type: 'api',
    status: 'connected',
    lastSync: '2 min ago',
    records: 1250,
    icon: Database,
    color: 'bg-green-500'
  },
  {
    id: 2,
    name: 'Weather API',
    type: 'api',
    status: 'connected',
    lastSync: '5 min ago',
    records: 48,
    icon: Globe,
    color: 'bg-blue-500'
  },
  {
    id: 3,
    name: 'E-commerce Scraper',
    type: 'scraper',
    status: 'running',
    lastSync: '1 min ago',
    records: 3420,
    icon: Activity,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Airtable Base',
    type: 'database',
    status: 'error',
    lastSync: '2 hours ago',
    records: 0,
    icon: Database,
    color: 'bg-red-500'
  }
]

const STATS = [
  { label: 'Connected Sources', value: '12', change: '+3', icon: Database, color: 'bg-blue-500' },
  { label: 'API Calls Today', value: '1.2K', change: '+15%', icon: Activity, color: 'bg-green-500' },
  { label: 'Data Records', value: '45.2K', change: '+8%', icon: TrendingUp, color: 'bg-purple-500' },
  { label: 'Cache Hit Rate', value: '94%', change: '+2%', icon: Zap, color: 'bg-orange-500' }
]

export default function DataSourcesPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('overview')

  const handleCreateDataSource = () => {
    dispatch(addToast({
      type: 'info',
      title: 'Feature Coming Soon',
      message: 'Data source creation will be available in the next update'
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running': return <Play className="w-4 h-4 text-blue-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      connected: 'default',
      running: 'secondary',
      error: 'destructive',
      paused: 'outline',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground mt-2">
            Connect APIs, databases, and web scrapers to power your apps
          </p>
        </div>
        <Button onClick={handleCreateDataSource}>
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <m.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </m.div>
            ))}
          </div>

          {/* Recent Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Data Sources</CardTitle>
              <CardDescription>Your most recently active data connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {DATA_SOURCES.slice(0, 3).map((source) => {
                  const Icon = source.icon
                  return (
                    <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {source.records.toLocaleString()} records • Last sync {source.lastSync}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(source.status)}
                        {getStatusBadge(source.status)}
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid gap-4">
            {DATA_SOURCES.map((source) => {
              const Icon = source.icon
              return (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${source.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{source.name}</h3>
                          <p className="text-muted-foreground capitalize">{source.type}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {source.records.toLocaleString()} records • Last sync {source.lastSync}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(source.status)}
                        {getStatusBadge(source.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Limit</span>
                    <span>1.2K / 5K</span>
                  </div>
                  <Progress value={24} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Limit</span>
                    <span>45K / 100K</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
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
                    <span>Avg Response Time</span>
                    <span>245ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}