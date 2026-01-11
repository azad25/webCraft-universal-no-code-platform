'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Clock, 
  CheckCircle, XCircle, AlertTriangle, Zap, Target,
  Calendar, Filter, RefreshCw, Download, Settings
} from 'lucide-react'

interface PerformanceMetrics {
  totalExecutions: number
  successRate: number
  averageDuration: number
  failureRate: number
  executionsToday: number
  executionsThisWeek: number
  topPerformingAutomations: Array<{
    id: string
    name: string
    successRate: number
    executions: number
    avgDuration: number
  }>
  recentFailures: Array<{
    id: string
    automationName: string
    error: string
    timestamp: string
  }>
  performanceTrends: Array<{
    date: string
    executions: number
    successRate: number
    avgDuration: number
  }>
}

interface PerformanceDashboardProps {
  appId: string
}

export function PerformanceDashboard({ appId }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchMetrics()
  }, [appId, timeRange])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockMetrics: PerformanceMetrics = {
        totalExecutions: 1247,
        successRate: 94.2,
        averageDuration: 2340,
        failureRate: 5.8,
        executionsToday: 23,
        executionsThisWeek: 156,
        topPerformingAutomations: [
          { id: '1', name: 'Welcome Email Flow', successRate: 98.5, executions: 234, avgDuration: 1200 },
          { id: '2', name: 'Order Processing', successRate: 96.8, executions: 189, avgDuration: 3400 },
          { id: '3', name: 'Lead Nurturing', successRate: 92.1, executions: 145, avgDuration: 2100 },
          { id: '4', name: 'Support Ticket Triage', successRate: 89.3, executions: 98, avgDuration: 4200 },
        ],
        recentFailures: [
          { id: '1', automationName: 'Order Processing', error: 'API timeout', timestamp: '2024-01-09T10:30:00Z' },
          { id: '2', automationName: 'Email Campaign', error: 'Invalid email address', timestamp: '2024-01-09T09:15:00Z' },
          { id: '3', automationName: 'Data Sync', error: 'Connection refused', timestamp: '2024-01-09T08:45:00Z' },
        ],
        performanceTrends: [
          { date: '2024-01-03', executions: 45, successRate: 92.1, avgDuration: 2100 },
          { date: '2024-01-04', executions: 52, successRate: 94.3, avgDuration: 2050 },
          { date: '2024-01-05', executions: 38, successRate: 96.8, avgDuration: 1980 },
          { date: '2024-01-06', executions: 61, successRate: 93.4, avgDuration: 2200 },
          { date: '2024-01-07', executions: 47, successRate: 95.7, avgDuration: 2010 },
          { date: '2024-01-08', executions: 55, successRate: 94.5, avgDuration: 2150 },
          { date: '2024-01-09', executions: 23, successRate: 97.2, avgDuration: 1890 },
        ]
      }
      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchMetrics()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) return 'default'
    if (rate >= 90) return 'secondary'
    return 'destructive'
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load metrics</h3>
        <p className="text-muted-foreground mb-4">Unable to fetch performance data</p>
        <Button onClick={fetchMetrics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Performance Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor automation performance and health</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</p>
                  <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +{metrics.executionsThisWeek} this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
                    {metrics.successRate}%
                  </p>
                  <div className="mt-2">
                    <Progress value={metrics.successRate} className="h-2" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{formatDuration(metrics.averageDuration)}</p>
                  <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    Per execution
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failure Rate</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.failureRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.recentFailures.length} recent failures
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performing Automations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Performing Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topPerformingAutomations.map((automation, index) => (
                <div key={automation.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{automation.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {automation.executions} executions • {formatDuration(automation.avgDuration)} avg
                      </p>
                    </div>
                  </div>
                  <Badge variant={getSuccessRateBadge(automation.successRate)}>
                    {automation.successRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Failures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentFailures.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent failures</p>
                </div>
              ) : (
                metrics.recentFailures.map((failure) => (
                  <div key={failure.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-200 dark:border-red-900">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{failure.automationName}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{failure.error}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(failure.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple trend visualization */}
            <div className="grid grid-cols-7 gap-2">
              {metrics.performanceTrends.map((trend, index) => (
                <div key={trend.date} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatDate(trend.date)}
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 bg-muted rounded flex items-end justify-center">
                      <div 
                        className="w-full bg-primary rounded-b"
                        style={{ height: `${(trend.executions / 70) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium">{trend.executions}</div>
                    <div className={`text-xs ${getSuccessRateColor(trend.successRate)}`}>
                      {trend.successRate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span>Executions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span>Success Rate</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}