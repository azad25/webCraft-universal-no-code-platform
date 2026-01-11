'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { m } from \'framer-motion\'
import {
  Plug, Search, Plus, Check, X, Settings, Trash2, RefreshCw,
  ExternalLink, Key, Shield, Zap, CreditCard, Mail, MessageSquare,
  BarChart3, Users, ShoppingBag, Database, Cloud, Image, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface Integration {
  id: string
  provider: string
  name: string
  category: string
  icon: string
  is_connected: boolean
  is_enabled: boolean
  last_sync: string | null
  created_at: string
}

interface AvailableIntegration {
  id: string
  name: string
  category: string
  description: string
  auth_type: string
  fields?: string[]
  icon: string
}

const CATEGORY_ICONS: Record<string, any> = {
  payment: CreditCard,
  email: Mail,
  communication: MessageSquare,
  analytics: BarChart3,
  crm: Users,
  ecommerce: ShoppingBag,
  database: Database,
  storage: Cloud,
  media: Image,
  productivity: Calendar,
  marketing: Zap,
  automation: Zap
}

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'bg-purple-500',
  paypal: 'bg-blue-500',
  google_analytics: 'bg-orange-500',
  mailchimp: 'bg-yellow-500',
  sendgrid: 'bg-blue-400',
  twilio: 'bg-red-500',
  slack: 'bg-purple-600',
  hubspot: 'bg-orange-600',
  shopify: 'bg-green-500',
  google_sheets: 'bg-green-600',
  airtable: 'bg-cyan-500',
  zapier: 'bg-orange-500',
  aws_s3: 'bg-orange-400',
  cloudinary: 'bg-blue-600'
}

export default function IntegrationsPage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [connectedIntegrations, setConnectedIntegrations] = useState<Integration[]>([])
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  
  // Connect dialog
  const [showConnect, setShowConnect] = useState<AvailableIntegration | null>(null)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [isConnecting, setIsConnecting] = useState(false)

  const fetchIntegrations = useCallback(async () => {
    try {
      const [connectedRes, availableRes, categoriesRes] = await Promise.all([
        apiClient.get(`/integrations/apps/${appId}/integrations`),
        apiClient.get('/integrations/available'),
        apiClient.get('/integrations/categories')
      ])
      
      setConnectedIntegrations(connectedRes.data.integrations || [])
      setAvailableIntegrations(availableRes.data.integrations || [])
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    }
  }, [appId])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchIntegrations()
      setIsLoading(false)
    }
    loadData()
  }, [fetchIntegrations])

  const handleConnect = async () => {
    if (!showConnect) return
    
    setIsConnecting(true)
    try {
      await apiClient.post(`/integrations/apps/${appId}/integrations/connect`, {
        provider: showConnect.id,
        credentials,
        config: {}
      })
      
      setShowConnect(null)
      setCredentials({})
      await fetchIntegrations()
    } catch (error) {
      console.error('Failed to connect integration:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return
    
    try {
      await apiClient.delete(`/integrations/apps/${appId}/integrations/${integrationId}`)
      await fetchIntegrations()
    } catch (error) {
      console.error('Failed to disconnect integration:', error)
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      await apiClient.post(`/integrations/apps/${appId}/integrations/${integrationId}/sync`)
      await fetchIntegrations()
    } catch (error) {
      console.error('Failed to sync integration:', error)
    }
  }

  const handleTest = async (integrationId: string) => {
    try {
      const res = await apiClient.post(`/integrations/apps/${appId}/integrations/${integrationId}/test`)
      alert(res.data.message)
    } catch (error) {
      console.error('Failed to test integration:', error)
    }
  }

  const filteredAvailable = availableIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase()) ||
                         integration.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || integration.category === category
    const notConnected = !connectedIntegrations.some(c => c.provider === integration.id)
    return matchesSearch && matchesCategory && notConnected
  })

  const getIcon = (categoryName: string) => {
    return CATEGORY_ICONS[categoryName] || Plug
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect your favorite tools and services</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {connectedIntegrations.length} Connected
        </Badge>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Connected</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedIntegrations.map((integration, i) => {
              const Icon = getIcon(integration.category)
              return (
                <m.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-green-200 dark:border-green-900">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                            PROVIDER_COLORS[integration.provider] || 'bg-gray-500'
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {integration.name}
                              <Check className="w-4 h-4 text-green-500" />
                            </h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {integration.category}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {integration.last_sync && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Last synced: {new Date(integration.last_sync).toLocaleString()}
                        </p>
                      )}
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSync(integration.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(integration.id)}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Integrations</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="capitalize">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={category} className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAvailable.map((integration, i) => {
                const Icon = getIcon(integration.category)
                return (
                  <m.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center text-white",
                            PROVIDER_COLORS[integration.id] || 'bg-gray-500'
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {integration.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <Badge variant="secondary" className="capitalize">
                            {integration.category}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setShowConnect(integration)
                              setCredentials({})
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </m.div>
                )
              })}
            </div>

            {filteredAvailable.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Plug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No integrations found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!showConnect} onOpenChange={() => setShowConnect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                showConnect && PROVIDER_COLORS[showConnect.id] || 'bg-gray-500'
              )}>
                {showConnect && (() => {
                  const Icon = getIcon(showConnect.category)
                  return <Icon className="w-5 h-5" />
                })()}
              </div>
              Connect {showConnect?.name}
            </DialogTitle>
            <DialogDescription>
              {showConnect?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {showConnect?.auth_type === 'api_key' && (
              <>
                {showConnect.fields?.map(field => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field.replace('_', ' ')}</Label>
                    <Input
                      type={field.includes('secret') || field.includes('key') || field.includes('token') ? 'password' : 'text'}
                      placeholder={`Enter your ${field.replace('_', ' ')}`}
                      value={credentials[field] || ''}
                      onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                    />
                  </div>
                ))}
              </>
            )}

            {showConnect?.auth_type === 'oauth' && (
              <div className="text-center py-4">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  You'll be redirected to {showConnect.name} to authorize access
                </p>
                <Button className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Authorize with {showConnect.name}
                </Button>
              </div>
            )}

            {showConnect?.auth_type === 'webhook' && (
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://hooks.example.com/..."
                  value={credentials.webhook_url || ''}
                  onChange={(e) => setCredentials({ ...credentials, webhook_url: e.target.value })}
                />
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Your credentials are secure</p>
                  <p className="text-muted-foreground">
                    We encrypt all credentials and never share them with third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConnect(null)}>
              Cancel
            </Button>
            {showConnect?.auth_type !== 'oauth' && (
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
