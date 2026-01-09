'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Webhook,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Settings,
  Trash2,
  Copy,
  ExternalLink,
  Activity,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const WEBHOOKS = [
  {
    id: 1,
    name: 'Order Created',
    url: 'https://api.example.com/webhooks/order-created',
    events: ['order.created', 'order.updated'],
    status: 'active',
    lastTriggered: '2 min ago',
    successRate: 98.5,
    totalCalls: 1247
  },
  {
    id: 2,
    name: 'User Registration',
    url: 'https://api.example.com/webhooks/user-registered',
    events: ['user.created'],
    status: 'active',
    lastTriggered: '15 min ago',
    successRate: 100,
    totalCalls: 89
  },
  {
    id: 3,
    name: 'Payment Failed',
    url: 'https://api.example.com/webhooks/payment-failed',
    events: ['payment.failed'],
    status: 'error',
    lastTriggered: '2 hours ago',
    successRate: 45.2,
    totalCalls: 23
  },
  {
    id: 4,
    name: 'Content Updated',
    url: 'https://api.example.com/webhooks/content-updated',
    events: ['content.updated', 'content.published'],
    status: 'paused',
    lastTriggered: '1 day ago',
    successRate: 92.1,
    totalCalls: 456
  }
]

const WEBHOOK_EVENTS = [
  { event: 'user.created', description: 'When a new user registers' },
  { event: 'user.updated', description: 'When user profile is updated' },
  { event: 'order.created', description: 'When a new order is placed' },
  { event: 'order.updated', description: 'When order status changes' },
  { event: 'payment.succeeded', description: 'When payment is successful' },
  { event: 'payment.failed', description: 'When payment fails' },
  { event: 'content.published', description: 'When content is published' },
  { event: 'content.updated', description: 'When content is modified' }
]

const STATS = [
  { label: 'Active Webhooks', value: '8', icon: Webhook, color: 'bg-blue-500' },
  { label: 'Total Deliveries', value: '12.4K', icon: Activity, color: 'bg-green-500' },
  { label: 'Success Rate', value: '94.2%', icon: TrendingUp, color: 'bg-purple-500' },
  { label: 'Avg Response Time', value: '245ms', icon: Zap, color: 'bg-orange-500' }
]

const RECENT_DELIVERIES = [
  {
    id: 1,
    webhook: 'Order Created',
    event: 'order.created',
    status: 'success',
    timestamp: '2 min ago',
    responseTime: '120ms'
  },
  {
    id: 2,
    webhook: 'User Registration',
    event: 'user.created',
    status: 'success',
    timestamp: '5 min ago',
    responseTime: '89ms'
  },
  {
    id: 3,
    webhook: 'Payment Failed',
    event: 'payment.failed',
    status: 'failed',
    timestamp: '10 min ago',
    responseTime: '2.1s'
  },
  {
    id: 4,
    webhook: 'Order Created',
    event: 'order.created',
    status: 'success',
    timestamp: '15 min ago',
    responseTime: '156ms'
  }
]

export default function WebhooksPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('webhooks')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      error: 'destructive',
      paused: 'secondary',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getDeliveryStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications about events
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/webhooks/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
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

          {/* Webhooks List */}
          <div className="space-y-4">
            {WEBHOOKS.map((webhook) => (
              <Card key={webhook.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Webhook className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{webhook.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(webhook.status)}
                          {getStatusBadge(webhook.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {webhook.totalCalls.toLocaleString()} calls • {webhook.successRate}% success
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last: {webhook.lastTriggered}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Play className="w-4 h-4 mr-2" />
                            Test Webhook
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
              <CardDescription>Latest webhook delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_DELIVERIES.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getDeliveryStatusIcon(delivery.status)}
                      <div>
                        <h4 className="font-medium">{delivery.webhook}</h4>
                        <p className="text-sm text-muted-foreground">
                          Event: <code className="bg-muted px-1 rounded">{delivery.event}</code>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{delivery.timestamp}</p>
                      <p className="text-xs text-muted-foreground">
                        Response: {delivery.responseTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Events</CardTitle>
              <CardDescription>Events that can trigger webhooks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.event} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <code className="font-mono text-sm font-medium">{event.event}</code>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-green-600 mb-2">94.2%</div>
                  <p className="text-muted-foreground">Overall success rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Average</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95th percentile</span>
                    <span className="font-medium">1.2s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">99th percentile</span>
                    <span className="font-medium">3.4s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}