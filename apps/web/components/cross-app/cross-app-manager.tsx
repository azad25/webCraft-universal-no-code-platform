'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

import {
  Plus,
  Link,
  Share2,
  MessageSquare,
  Database,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  ArrowRight,
  Sync,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react'

import { apiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

interface CrossAppManagerProps {
  appId: string
  appName: string
}

interface SharedCollection {
  id: string
  name: string
  description: string
  app_name: string
  app_id: string
  owner_name: string
  visibility: string
  permissions: string[]
  shared_at: string
}

interface AppConnection {
  id: string
  connected_app: {
    id: string
    name: string
    app_type: string
  }
  connection_type: string
  direction: string
  config: Record<string, any>
  created_at: string
}

interface AppMessage {
  id: string
  from_app: {
    id: string
    name: string
  }
  message_type: string
  subject: string
  payload: Record<string, any>
  is_read: boolean
  created_at: string
}

interface DiscoverableApp {
  id: string
  name: string
  description: string
  app_type: string
  collection_count: number
  shared_collections: number
  created_at: string
}

export function CrossAppManager({ appId, appName }: CrossAppManagerProps) {
  const [activeTab, setActiveTab] = useState('connections')
  const [isLoading, setIsLoading] = useState(false)
  
  // State for different sections
  const [sharedCollections, setSharedCollections] = useState<SharedCollection[]>([])
  const [connections, setConnections] = useState<AppConnection[]>([])
  const [messages, setMessages] = useState<AppMessage[]>([])
  const [discoverableApps, setDiscoverableApps] = useState<DiscoverableApp[]>([])
  
  // Dialog states
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  
  // Form states
  const [selectedCollection, setSelectedCollection] = useState('')
  const [shareVisibility, setShareVisibility] = useState('shared')
  const [selectedTargetApp, setSelectedTargetApp] = useState('')
  const [connectionType, setConnectionType] = useState('event_trigger')

  useEffect(() => {
    loadData()
  }, [appId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadSharedCollections(),
        loadConnections(),
        loadMessages(),
        loadDiscoverableApps()
      ])
    } catch (error) {
      console.error('Failed to load cross-app data:', error)
      toast.error('Failed to load cross-app data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSharedCollections = async () => {
    try {
      const response = await apiClient.get(`/api/cross-app/apps/${appId}/collections/shared`)
      setSharedCollections(response.data.shared_collections || [])
    } catch (error) {
      console.error('Failed to load shared collections:', error)
    }
  }

  const loadConnections = async () => {
    try {
      const response = await apiClient.get(`/api/cross-app/apps/${appId}/connections`)
      setConnections(response.data.connections || [])
    } catch (error) {
      console.error('Failed to load connections:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await apiClient.get(`/api/cross-app/apps/${appId}/messages`)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const loadDiscoverableApps = async () => {
    try {
      const response = await apiClient.get(`/api/cross-app/apps/${appId}/discover`)
      setDiscoverableApps(response.data.apps || [])
    } catch (error) {
      console.error('Failed to load discoverable apps:', error)
    }
  }

  const handleShareCollection = async () => {
    if (!selectedCollection) return

    try {
      await apiClient.post(`/api/cross-app/apps/${appId}/collections/share`, {
        collection_id: selectedCollection,
        visibility: shareVisibility,
        allowed_apps: shareVisibility === 'shared' ? [selectedTargetApp] : [],
        permissions: {
          [selectedTargetApp]: ['read', 'write']
        }
      })

      toast.success('Collection shared successfully')
      setShowShareDialog(false)
      loadSharedCollections()
    } catch (error) {
      console.error('Failed to share collection:', error)
      toast.error('Failed to share collection')
    }
  }

  const handleCreateConnection = async () => {
    if (!selectedTargetApp) return

    try {
      await apiClient.post(`/api/cross-app/apps/${appId}/connections`, {
        target_app_id: selectedTargetApp,
        connection_type: connectionType,
        config: {}
      })

      toast.success('Connection created successfully')
      setShowConnectDialog(false)
      loadConnections()
    } catch (error) {
      console.error('Failed to create connection:', error)
      toast.error('Failed to create connection')
    }
  }

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await apiClient.put(`/api/cross-app/apps/${appId}/messages/${messageId}/read`)
      loadMessages()
    } catch (error) {
      console.error('Failed to mark message as read:', error)
    }
  }

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'webhook': return <Link className="w-4 h-4" />
      case 'data_sync': return <Sync className="w-4 h-4" />
      case 'event_trigger': return <Zap className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />
      case 'shared': return <Users className="w-4 h-4" />
      case 'private': return <Lock className="w-4 h-4" />
      default: return <Lock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cross-App Communication</h2>
          <p className="text-muted-foreground">
            Connect {appName} with other apps to share data and trigger actions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogTrigger asChild>
              <Button>
                <Share2 className="w-4 h-4 mr-2" />
                Share Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Collection</DialogTitle>
                <DialogDescription>
                  Make a collection available to other apps
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Collection</Label>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection to share" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection1">Products</SelectItem>
                      <SelectItem value="collection2">Customers</SelectItem>
                      <SelectItem value="collection3">Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select value={shareVisibility} onValueChange={setShareVisibility}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can access</SelectItem>
                      <SelectItem value="shared">Shared - Specific apps only</SelectItem>
                      <SelectItem value="private">Private - Only this app</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {shareVisibility === 'shared' && (
                  <div>
                    <Label>Target App</Label>
                    <Select value={selectedTargetApp} onValueChange={setSelectedTargetApp}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select app to share with" />
                      </SelectTrigger>
                      <SelectContent>
                        {discoverableApps.map(app => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.name} ({app.app_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleShareCollection}>
                    Share Collection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Connect App
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect to App</DialogTitle>
                <DialogDescription>
                  Create a connection to enable communication with another app
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Target App</Label>
                  <Select value={selectedTargetApp} onValueChange={setSelectedTargetApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select app to connect to" />
                    </SelectTrigger>
                    <SelectContent>
                      {discoverableApps.map(app => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name} ({app.app_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Connection Type</Label>
                  <Select value={connectionType} onValueChange={setConnectionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_trigger">Event Trigger - Send events to app</SelectItem>
                      <SelectItem value="data_sync">Data Sync - Synchronize data</SelectItem>
                      <SelectItem value="webhook">Webhook - HTTP callbacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateConnection}>
                    Create Connection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">
            <Link className="w-4 h-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="shared">
            <Share2 className="w-4 h-4 mr-2" />
            Shared Data
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {messages.filter(m => !m.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {messages.filter(m => !m.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Search className="w-4 h-4 mr-2" />
            Discover
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Link className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Connections</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Connect to other apps to enable cross-app communication
                  </p>
                  <Button onClick={() => setShowConnectDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Connection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              connections.map(connection => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getConnectionTypeIcon(connection.connection_type)}
                          <div>
                            <h3 className="font-semibold">{connection.connected_app.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {connection.connected_app.app_type} • {connection.connection_type}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={connection.direction === 'outgoing' ? 'default' : 'secondary'}>
                          {connection.direction}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Shared Data Tab */}
        <TabsContent value="shared" className="space-y-4">
          <div className="grid gap-4">
            {sharedCollections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Shared Collections</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Share collections to allow other apps to access your data
                  </p>
                  <Button onClick={() => setShowShareDialog(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share First Collection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sharedCollections.map(collection => (
                <Card key={collection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getVisibilityIcon(collection.visibility)}
                          <div>
                            <h3 className="font-semibold">{collection.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {collection.app_name} • Shared by {collection.owner_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{collection.visibility}</Badge>
                        <Badge variant="secondary">
                          {collection.permissions.join(', ')}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Messages</h3>
                  <p className="text-muted-foreground text-center">
                    Messages from other apps will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              messages.map(message => (
                <Card key={message.id} className={cn(!message.is_read && "border-primary")}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{message.subject}</h3>
                          {!message.is_read && (
                            <Badge variant="default" className="h-5">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {message.from_app.name} • {message.message_type}
                        </p>
                        <p className="text-sm">
                          {JSON.stringify(message.payload, null, 2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!message.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkMessageRead(message.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          <div className="grid gap-4">
            {discoverableApps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Apps Found</h3>
                  <p className="text-muted-foreground text-center">
                    Create more apps to enable cross-app communication
                  </p>
                </CardContent>
              </Card>
            ) : (
              discoverableApps.map(app => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{app.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{app.app_type}</span>
                          <span>{app.collection_count} collections</span>
                          <span>{app.shared_collections} shared</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedTargetApp(app.id)
                          setShowConnectDialog(true)
                        }}
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}