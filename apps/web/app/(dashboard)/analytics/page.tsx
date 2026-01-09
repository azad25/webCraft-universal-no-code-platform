'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  MousePointer,
  Calendar
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ANALYTICS_STATS = [
  { label: 'Total Views', value: '24.5K', change: '+12%', trend: 'up', icon: Eye, color: 'bg-blue-500' },
  { label: 'Unique Visitors', value: '8.2K', change: '+8%', trend: 'up', icon: Users, color: 'bg-green-500' },
  { label: 'Avg. Session', value: '3m 24s', change: '+15%', trend: 'up', icon: Clock, color: 'bg-purple-500' },
  { label: 'Bounce Rate', value: '32%', change: '-5%', trend: 'down', icon: Target, color: 'bg-orange-500' },
  { label: 'Conversion Rate', value: '4.2%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'bg-cyan-500' },
  { label: 'Page Load Time', value: '1.2s', change: '-0.3s', trend: 'down', icon: Activity, color: 'bg-indigo-500' }
]

const TOP_PAGES = [
  { path: '/home', views: 5420, change: '+12%' },
  { path: '/products', views: 3210, change: '+8%' },
  { path: '/about', views: 2150, change: '+15%' },
  { path: '/contact', views: 1890, change: '+5%' },
  { path: '/blog', views: 1650, change: '+22%' }
]

const TRAFFIC_SOURCES = [
  { source: 'Direct', percentage: 45, visitors: 3690, color: 'bg-blue-500' },
  { source: 'Google', percentage: 32, visitors: 2624, color: 'bg-green-500' },
  { source: 'Social Media', percentage: 15, visitors: 1230, color: 'bg-purple-500' },
  { source: 'Referrals', percentage: 8, visitors: 656, color: 'bg-orange-500' }
]

const DEVICE_STATS = [
  { device: 'Desktop', percentage: 58, icon: Monitor },
  { device: 'Mobile', percentage: 35, icon: Smartphone },
  { device: 'Tablet', percentage: 7, icon: Smartphone }
]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track performance and user engagement across your apps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {ANALYTICS_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <div className={`text-xs flex items-center gap-1 justify-end ${
                          stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.trend === 'up' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {stat.change}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {TOP_PAGES.map((page, index) => (
                    <div key={page.path} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{page.path}</p>
                          <p className="text-sm text-muted-foreground">
                            {page.views.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        {page.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>Visitor device breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DEVICE_STATS.map((device) => {
                  const Icon = device.icon
                  return (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{device.percentage}%</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {TRAFFIC_SOURCES.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{source.source}</span>
                      <span className="text-sm text-muted-foreground">
                        {source.visitors.toLocaleString()} visitors
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={source.percentage} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-12">{source.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Geographic Data */}
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Visitor locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { country: 'United States', percentage: 35, flag: '🇺🇸' },
                  { country: 'United Kingdom', percentage: 18, flag: '🇬🇧' },
                  { country: 'Canada', percentage: 12, flag: '🇨🇦' },
                  { country: 'Germany', percentage: 10, flag: '🇩🇪' },
                  { country: 'France', percentage: 8, flag: '🇫🇷' }
                ].map((country) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <span className="font-semibold">{country.percentage}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Flow</CardTitle>
                <CardDescription>How users navigate your app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">User flow visualization</p>
                    <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>User interaction patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Pages per Session</span>
                    <span>2.4</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Return Visitors</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Time on Page</span>
                    <span>2m 15s</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Track user conversion steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: 'Landing Page', users: 10000, rate: 100 },
                    { step: 'Product View', users: 6500, rate: 65 },
                    { step: 'Add to Cart', users: 2600, rate: 26 },
                    { step: 'Checkout', users: 1300, rate: 13 },
                    { step: 'Purchase', users: 420, rate: 4.2 }
                  ].map((step, index) => (
                    <div key={step.step} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="font-medium">{step.step}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{step.users.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{step.rate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Completions</CardTitle>
                <CardDescription>Track your conversion goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { goal: 'Newsletter Signup', completions: 245, rate: 12.3 },
                  { goal: 'Contact Form', completions: 89, rate: 4.5 },
                  { goal: 'Download', completions: 156, rate: 7.8 },
                  { goal: 'Account Creation', completions: 67, rate: 3.4 }
                ].map((goal) => (
                  <div key={goal.goal} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{goal.goal}</p>
                      <p className="text-sm text-muted-foreground">
                        {goal.completions} completions
                      </p>
                    </div>
                    <Badge variant="outline">{goal.rate}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}