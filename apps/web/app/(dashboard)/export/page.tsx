'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Download,
  Upload,
  Globe,
  Github,
  Zap,
  Cloud,
  Archive,
  Code,
  Smartphone,
  Monitor,
  FileText,
  Settings,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StaticExportManager } from '@/components/export/static-export-manager'
import { DeploymentManager } from '@/components/deployment/deployment-manager'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'

const EXPORT_OPTIONS = [
  {
    id: 'static',
    title: 'Static Site Export',
    description: 'Generate HTML/CSS/JS files for any hosting provider',
    icon: Archive,
    color: 'bg-blue-500',
    features: ['SEO Optimized', 'Fast Loading', 'CDN Ready', 'No Server Required'],
    badge: 'Popular'
  },
  {
    id: 'github',
    title: 'GitHub Pages',
    description: 'Deploy directly to GitHub with automatic builds',
    icon: Github,
    color: 'bg-gray-800',
    features: ['Free Hosting', 'Custom Domain', 'SSL Certificate', 'Version Control']
  },
  {
    id: 'netlify',
    title: 'Netlify',
    description: 'Deploy to Netlify with edge functions and forms',
    icon: Globe,
    color: 'bg-teal-500',
    features: ['Edge Functions', 'Form Handling', 'Split Testing', 'Analytics']
  },
  {
    id: 'vercel',
    title: 'Vercel',
    description: 'Deploy to Vercel with serverless functions',
    icon: Zap,
    color: 'bg-black',
    features: ['Serverless Functions', 'Edge Network', 'Preview Deployments', 'Analytics']
  },
  {
    id: 'aws',
    title: 'AWS S3',
    description: 'Deploy to Amazon S3 with CloudFront CDN',
    icon: Cloud,
    color: 'bg-orange-500',
    features: ['Global CDN', 'High Availability', 'Custom Domain', 'SSL Certificate']
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    description: 'Generate native mobile app SDKs',
    icon: Smartphone,
    color: 'bg-purple-500',
    features: ['iOS & Android', 'App Store Ready', 'Push Notifications', 'Offline Support'],
    badge: 'Pro'
  }
]

const STATS = [
  { label: 'Total Exports', value: '24', icon: Download, color: 'bg-blue-500' },
  { label: 'Static Sites', value: '18', icon: Archive, color: 'bg-green-500' },
  { label: 'Mobile Apps', value: '6', icon: Smartphone, color: 'bg-purple-500' },
  { label: 'Live Deployments', value: '12', icon: Globe, color: 'bg-orange-500' }
]

const RECENT_EXPORTS = [
  {
    id: 1,
    name: 'E-commerce Store',
    type: 'static',
    platform: 'Netlify',
    status: 'completed',
    size: '2.4 MB',
    timestamp: '2 hours ago',
    url: 'https://mystore.netlify.app'
  },
  {
    id: 2,
    name: 'Portfolio Site',
    type: 'github',
    platform: 'GitHub Pages',
    status: 'completed',
    size: '1.8 MB',
    timestamp: '1 day ago',
    url: 'https://john.github.io/portfolio'
  },
  {
    id: 3,
    name: 'Blog App',
    type: 'mobile',
    platform: 'React Native',
    status: 'building',
    size: '45 MB',
    timestamp: '5 min ago',
    url: null
  },
  {
    id: 4,
    name: 'Landing Page',
    type: 'static',
    platform: 'Vercel',
    status: 'failed',
    size: '0 MB',
    timestamp: '3 hours ago',
    url: null
  }
]

export default function ExportPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedApp, setSelectedApp] = useState<any>(null)

  // Mock app data - in real implementation, this would come from API
  const mockApp = {
    id: '1',
    name: 'My App',
    slug: 'my-app',
    is_published: false,
    custom_domain: '',
    subdomain: 'my-app'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'building': return <Clock className="w-4 h-4 text-blue-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Archive className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      building: 'secondary',
      failed: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'netlify': return <Globe className="w-4 h-4" />
      case 'github pages': return <Github className="w-4 h-4" />
      case 'vercel': return <Zap className="w-4 h-4" />
      case 'react native': return <Smartphone className="w-4 h-4" />
      default: return <Archive className="w-4 h-4" />
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            Export & Deploy
          </h1>
          <p className="text-muted-foreground mt-2">
            Export your apps as static sites or deploy to popular platforms
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/apps')}>
          <Settings className="w-4 h-4 mr-2" />
          Manage Apps
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="static-export">Static Export</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Export Options */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Export Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXPORT_OPTIONS.map((option, index) => {
                const Icon = option.icon
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {option.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{option.title}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {option.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full group-hover:bg-primary/90 transition-colors"
                          onClick={() => {
                            if (option.id === 'static') {
                              setActiveTab('static-export')
                            } else if (option.id === 'mobile') {
                              router.push('/dashboard/mobile')
                            } else {
                              setActiveTab('deployment')
                            }
                          }}
                        >
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Exports
              </CardTitle>
              <CardDescription>Your latest export and deployment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_EXPORTS.map((export_item) => (
                  <div key={export_item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(export_item.status)}
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(export_item.platform)}
                        <div>
                          <h4 className="font-medium">{export_item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {export_item.platform} • {export_item.size} • {export_item.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(export_item.status)}
                      {export_item.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(export_item.url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="static-export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Static Site Export
              </CardTitle>
              <CardDescription>
                Export your app as optimized static files that can be hosted anywhere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaticExportManager appId={mockApp.id} app={mockApp} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Live Deployment
              </CardTitle>
              <CardDescription>
                Deploy your app to our hosting platform with custom domains and SSL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeploymentManager 
                appId={mockApp.id} 
                app={mockApp}
                onDeploymentChange={() => {
                  // Refresh data
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>View and manage all your exports and deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_EXPORTS.map((export_item) => (
                  <div key={export_item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(export_item.status)}
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(export_item.platform)}
                        <div>
                          <h4 className="font-medium">{export_item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {export_item.platform} • {export_item.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {export_item.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {getStatusBadge(export_item.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {export_item.size}
                        </p>
                      </div>
                      {export_item.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(export_item.url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}