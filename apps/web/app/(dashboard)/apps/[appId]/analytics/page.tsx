'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { m } from \'framer-motion\'
import {
  BarChart3, Users, Eye, Clock, TrendingUp, TrendingDown, Globe,
  Monitor, Smartphone, Tablet, Chrome, ArrowUpRight, ArrowDownRight,
  RefreshCw, Download, Calendar, Filter, Zap, Target, MousePointer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface MetricCard {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  icon: any
}

export default function AnalyticsPage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [timeRange, setTimeRange] = useState('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  const [traffic, setTraffic] = useState<any>(null)
  const [pages, setPages] = useState<any>(null)
  const [sources, setSources] = useState<any>(null)
  const [geography, setGeography] = useState<any>(null)
  const [devices, setDevices] = useState<any>(null)
  const [realtime, setRealtime] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [appId, timeRange])

  useEffect(() => {
    // Fetch realtime data every 30 seconds
    const interval = setInterval(fetchRealtime, 30000)
    return () => clearInterval(interval)
  }, [appId])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const [overviewRes, trafficRes, pagesRes, sourcesRes, geoRes, devicesRes, perfRes] = await Promise.all([
        apiClient.get(`/apps/${appId}/analytics/overview?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/traffic?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/pages?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/sources?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/geography?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/devices?time_range=${timeRange}`),
        apiClient.get(`/apps/${appId}/analytics/performance?time_range=${timeRange}`)
      ])
      
      setOverview(overviewRes.data)
      setTraffic(trafficRes.data)
      setPages(pagesRes.data)
      setSources(sourcesRes.data)
      setGeography(geoRes.data)
      setDevices(devicesRes.data)
      setPerformance(perfRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRealtime = async () => {
    try {
      const res = await apiClient.get(`/apps/${appId}/analytics/realtime`)
      setRealtime(res.data)
    } catch (error) {
      console.error('Failed to fetch realtime:', error)
    }
  }

  const metrics: MetricCard[] = overview ? [
    {
      title: 'Page Views',
      value: overview.metrics.page_views.value.toLocaleString(),
      change: overview.metrics.page_views.change,
      trend: overview.metrics.page_views.trend,
      icon: Eye
    },
    {
      title: 'Unique Visitors',
      value: overview.metrics.unique_visitors.value.toLocaleString(),
      change: overview.metrics.unique_visitors.change,
      trend: overview.metrics.unique_visitors.trend,
      icon: Users
    },
    {
      title: 'Sessions',
      value: overview.metrics.sessions.value.toLocaleString(),
      change: overview.metrics.sessions.change,
      trend: overview.metrics.sessions.trend,
      icon: MousePointer
    },
    {
      title: 'Bounce Rate',
      value: `${overview.metrics.bounce_rate.value}%`,
      change: overview.metrics.bounce_rate.change,
      trend: overview.metrics.bounce_rate.trend,
      icon: TrendingDown
    },
    {
      title: 'Avg. Session Duration',
      value: formatDuration(overview.metrics.avg_session_duration.value),
      change: overview.metrics.avg_session_duration.change,
      trend: overview.metrics.avg_session_duration.trend,
      icon: Clock
    },
    {
      title: 'Pages / Session',
      value: overview.metrics.pages_per_session.value.toFixed(1),
      change: overview.metrics.pages_per_session.change,
      trend: overview.metrics.pages_per_session.trend,
      icon: BarChart3
    }
  ] : []

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your app's performance and user behavior</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="this_year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Realtime Banner */}
      {realtime && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-900">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active users right now</p>
                  <p className="text-3xl font-bold text-green-600">{realtime.active_users}</p>
                </div>
              </div>
              <div className="flex gap-8">
                {realtime.active_pages?.slice(0, 3).map((page: any, i: number) => (
                  <div key={i} className="text-right">
                    <p className="text-sm text-muted-foreground">{page.title}</p>
                    <p className="font-semibold">{page.users} users</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, i) => (
          <m.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <Badge 
                    variant={metric.trend === 'up' ? 'default' : 'secondary'}
                    className={cn(
                      "text-xs",
                      metric.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}
                  >
                    {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(metric.change)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.title}</p>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Over Time</CardTitle>
              <CardDescription>Page views and visitors trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {traffic?.data?.slice(-30).map((point: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${(point.page_views / 600) * 100}%` }}
                    />
                    <div 
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(point.unique_visitors / 600) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 rounded" />
                  <span className="text-sm">Page Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded" />
                  <span className="text-sm">Unique Visitors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pages?.pages?.map((page: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{page.title}</p>
                      <p className="text-sm text-muted-foreground">{page.path}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{page.page_views.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{page.bounce_rate}%</p>
                      <p className="text-xs text-muted-foreground">bounce</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatDuration(page.avg_time_on_page)}</p>
                      <p className="text-xs text-muted-foreground">avg time</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sources?.sources?.channels?.map((channel: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{channel.name}</span>
                        <span className="text-muted-foreground">{channel.sessions.toLocaleString()} ({channel.percentage}%)</span>
                      </div>
                      <Progress value={channel.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sources?.sources?.referrers?.map((ref: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{ref.domain}</span>
                      </div>
                      <span className="text-muted-foreground">{ref.sessions.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitors by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  {geography?.countries?.slice(0, 10).map((country: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(country.code)}</span>
                          {country.name}
                        </span>
                        <span className="text-muted-foreground">{country.sessions.toLocaleString()} ({country.percentage}%)</span>
                      </div>
                      <Progress value={country.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">World Map Visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices?.devices?.map((device: any, i: number) => {
                    const Icon = device.type === 'Desktop' ? Monitor : device.type === 'Mobile' ? Smartphone : Tablet
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span>{device.type}</span>
                            <span className="text-muted-foreground">{device.percentage}%</span>
                          </div>
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {devices?.browsers?.map((browser: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{browser.name}</span>
                      <Badge variant="secondary">{browser.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {devices?.operating_systems?.map((os: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{os.name}</span>
                      <Badge variant="secondary">{os.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance?.core_web_vitals && Object.entries(performance.core_web_vitals).map(([key, data]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="font-medium uppercase text-sm">{key}</p>
                        <p className="text-2xl font-bold">{data.value}{data.unit}</p>
                      </div>
                      <Badge className={cn(
                        data.rating === 'good' ? 'bg-green-500' : data.rating === 'needs_improvement' ? 'bg-yellow-500' : 'bg-red-500'
                      )}>
                        {data.rating}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lighthouse Scores</CardTitle>
                <CardDescription>Overall site quality scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {performance?.lighthouse_scores && Object.entries(performance.lighthouse_scores).map(([key, value]: [string, any]) => (
                    <div key={key} className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl",
                        value >= 90 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      )}>
                        {value}
                      </div>
                      <p className="text-sm capitalize">{key.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', CA: '🇨🇦', FR: '🇫🇷',
    AU: '🇦🇺', IN: '🇮🇳', BR: '🇧🇷', NL: '🇳🇱', JP: '🇯🇵'
  }
  return flags[code] || '🌍'
}
