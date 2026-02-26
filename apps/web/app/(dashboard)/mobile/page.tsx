'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Smartphone,
  Download,
  Code,
  Play,
  Apple,
  Chrome,
  Github,
  ExternalLink,
  QrCode,
  Settings,
  Zap,
  Package,
  FileCode,
  Monitor,
  Tablet,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

const MOBILE_APPS = [
  {
    id: 1,
    name: 'E-commerce Store',
    platform: 'iOS',
    status: 'published',
    version: '1.2.0',
    downloads: 2450,
    lastBuild: '2 hours ago',
    icon: Apple,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'E-commerce Store',
    platform: 'Android',
    status: 'published',
    version: '1.2.0',
    downloads: 3210,
    lastBuild: '2 hours ago',
    icon: Chrome,
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: 'Portfolio App',
    platform: 'React Native',
    status: 'building',
    version: '1.0.0',
    downloads: 0,
    lastBuild: '5 min ago',
    icon: Code,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Blog Reader',
    platform: 'Flutter',
    status: 'draft',
    version: '0.9.0',
    downloads: 0,
    lastBuild: '1 day ago',
    icon: Code,
    color: 'bg-orange-500'
  }
]

const SDK_OPTIONS = [
  {
    id: 'ios',
    name: 'iOS SDK',
    description: 'Native iOS app with Swift',
    icon: Apple,
    color: 'bg-blue-500',
    features: ['Native Performance', 'App Store Ready', 'iOS Widgets', 'Push Notifications'],
    badge: 'Popular'
  },
  {
    id: 'android',
    name: 'Android SDK',
    description: 'Native Android app with Kotlin',
    icon: Chrome,
    color: 'bg-green-500',
    features: ['Material Design', 'Google Play Ready', 'Android Widgets', 'Background Sync'],
    badge: 'Popular'
  },
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Cross-platform with React Native',
    icon: Code,
    color: 'bg-purple-500',
    features: ['Cross Platform', 'Hot Reload', 'Native Modules', 'Code Sharing']
  },
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Cross-platform with Flutter',
    icon: Code,
    color: 'bg-orange-500',
    features: ['Single Codebase', 'Fast Performance', 'Custom UI', 'Hot Reload']
  }
]

const STATS = [
  { label: 'Mobile Apps', value: '8', icon: Smartphone, color: 'bg-blue-500' },
  { label: 'Total Downloads', value: '12.4K', icon: Download, color: 'bg-green-500' },
  { label: 'Active Builds', value: '3', icon: Package, color: 'bg-purple-500' },
  { label: 'SDK Versions', value: '4', icon: Code, color: 'bg-orange-500' }
]

const BUILD_HISTORY = [
  {
    id: 1,
    app: 'E-commerce Store',
    platform: 'iOS',
    version: '1.2.0',
    status: 'success',
    duration: '4m 32s',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    app: 'E-commerce Store',
    platform: 'Android',
    version: '1.2.0',
    status: 'success',
    duration: '3m 45s',
    timestamp: '2 hours ago'
  },
  {
    id: 3,
    app: 'Portfolio App',
    platform: 'React Native',
    version: '1.0.0',
    status: 'building',
    duration: '2m 15s',
    timestamp: '5 min ago'
  },
  {
    id: 4,
    app: 'Blog Reader',
    platform: 'Flutter',
    version: '0.9.0',
    status: 'failed',
    duration: '1m 23s',
    timestamp: '1 day ago'
  }
]

export default function MobilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('apps')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'building': return <Clock className="w-4 h-4 text-blue-500" />
      case 'draft': return <Clock className="w-4 h-4 text-gray-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      building: 'secondary',
      draft: 'outline',
      success: 'default',
      failed: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            Mobile SDKs
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate native mobile apps from your web applications
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/mobile/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Generate SDK
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="apps">Mobile Apps</TabsTrigger>
          <TabsTrigger value="sdks">SDK Options</TabsTrigger>
          <TabsTrigger value="builds">Build History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <m.div
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
              </m.div>
            ))}
          </div>

          {/* Mobile Apps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOBILE_APPS.map((app, index) => {
              const Icon = app.icon
              return (
                <m.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{app.name}</CardTitle>
                            <CardDescription className="capitalize">{app.platform}</CardDescription>
                          </div>
                        </div>
                        {getStatusIcon(app.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version</span>
                        <Badge variant="outline">{app.version}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Downloads</span>
                        <span className="font-medium">{app.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Build</span>
                        <span className="text-muted-foreground">{app.lastBuild}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SDK_OPTIONS.map((sdk, index) => {
              const Icon = sdk.icon
              return (
                <m.div
                  key={sdk.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${sdk.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{sdk.name}</CardTitle>
                            <CardDescription>{sdk.description}</CardDescription>
                          </div>
                        </div>
                        {sdk.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {sdk.badge}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Features</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {sdk.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        <Zap className="w-4 h-4 mr-2" />
                        Generate SDK
                      </Button>
                    </CardContent>
                  </Card>
                </m.div>
              )
            })}
          </div>

          {/* SDK Information */}
          <Card>
            <CardHeader>
              <CardTitle>SDK Generation Process</CardTitle>
              <CardDescription>How mobile SDKs are generated from your web apps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Monitor className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Web App Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    We analyze your web app structure, components, and functionality
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">2. Native Code Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate optimized native code for your chosen platform
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">3. App Package</h4>
                  <p className="text-sm text-muted-foreground">
                    Build and package your app ready for distribution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Build History</CardTitle>
              <CardDescription>Recent SDK generation and build attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {BUILD_HISTORY.map((build) => (
                  <div key={build.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(build.status)}
                      <div>
                        <h4 className="font-medium">{build.app}</h4>
                        <p className="text-sm text-muted-foreground">
                          {build.platform} • v{build.version}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(build.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {build.duration} • {build.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Build Configuration</CardTitle>
                <CardDescription>Default settings for SDK generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Platform</label>
                  <p className="text-sm text-muted-foreground">React Native</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Build Environment</label>
                  <p className="text-sm text-muted-foreground">Production</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Auto-build on Deploy</label>
                  <p className="text-sm text-muted-foreground">Enabled</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
                <CardDescription>App store and distribution settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">App Store Connect</label>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Google Play Console</label>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Code Signing</label>
                  <p className="text-sm text-muted-foreground">Not configured</p>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Setup Distribution
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}