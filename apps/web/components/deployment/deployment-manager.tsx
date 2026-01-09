'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  ExternalLink, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  Eye,
  Rocket,
  Link as LinkIcon,
  Shield,
  Zap,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api-client'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'

interface DeploymentManagerProps {
  appId: string
  app: {
    id: string
    name: string
    slug: string
    is_published: boolean
    custom_domain?: string
    subdomain?: string
    config?: any
  }
  onDeploymentChange?: () => void
}

interface DeploymentStatus {
  status: 'not_deployed' | 'deploying' | 'deployed' | 'error'
  live_url?: string
  subdomain_url?: string
  custom_domain?: string
  ssl_enabled?: boolean
  deployed_at?: string
  error?: string
}

export function DeploymentManager({ appId, app, onDeploymentChange }: DeploymentManagerProps) {
  const dispatch = useAppDispatch()
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: app.is_published ? 'deployed' : 'not_deployed'
  })
  const [customDomain, setCustomDomain] = useState(app.custom_domain || '')
  const [subdomain, setSubdomain] = useState(app.subdomain || app.slug)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deploymentConfig, setDeploymentConfig] = useState({
    platform: 'kubernetes',
    enableCDN: true,
    enableSSL: true,
    enableAnalytics: true
  })

  useEffect(() => {
    loadDeploymentStatus()
  }, [appId])

  const loadDeploymentStatus = async () => {
    try {
      const response = await apiClient.get(`/api/v1/apps/${appId}/deployment/status`)
      setDeploymentStatus(response.data)
    } catch (error) {
      console.error('Failed to load deployment status:', error)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploymentStatus({ status: 'deploying' })

    try {
      const deploymentData = {
        custom_domain: customDomain || undefined,
        subdomain: subdomain || undefined,
        platform: deploymentConfig.platform,
        options: {
          enable_cdn: deploymentConfig.enableCDN,
          enable_ssl: deploymentConfig.enableSSL,
          enable_analytics: deploymentConfig.enableAnalytics
        }
      }

      const response = await apiClient.post(`/api/v1/apps/${appId}/publish`, deploymentData)
      
      if (response.data.success) {
        setDeploymentStatus({
          status: 'deployed',
          live_url: response.data.url,
          subdomain_url: response.data.subdomain ? `https://${response.data.subdomain}.webcraft.dev` : undefined,
          custom_domain: response.data.custom_domain,
          ssl_enabled: response.data.ssl_enabled,
          deployed_at: response.data.deployed_at
        })
        
        dispatch(addToast({
          type: 'success',
          title: 'App deployed successfully!',
          message: `Your app is now live at ${response.data.url}`
        }))
        
        onDeploymentChange?.()
      } else {
        throw new Error(response.data.error || 'Deployment failed')
      }
    } catch (error: any) {
      console.error('Deployment failed:', error)
      setDeploymentStatus({
        status: 'error',
        error: error.response?.data?.detail || error.message || 'Deployment failed'
      })
      
      dispatch(addToast({
        type: 'error',
        title: 'Deployment failed',
        message: error.response?.data?.detail || error.message || 'An error occurred during deployment'
      }))
    } finally {
      setIsDeploying(false)
    }
  }

  const handleUnpublish = async () => {
    try {
      await apiClient.post(`/api/v1/apps/${appId}/unpublish`)
      setDeploymentStatus({ status: 'not_deployed' })
      dispatch(addToast({
        type: 'success',
        title: 'App unpublished successfully',
        message: 'Your app is no longer publicly accessible'
      }))
      onDeploymentChange?.()
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to unpublish app',
        message: error.response?.data?.detail || error.message || 'An error occurred while unpublishing'
      }))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    dispatch(addToast({
      type: 'success',
      title: 'Copied to clipboard',
      duration: 2000
    }))
  }

  const getStatusIcon = () => {
    switch (deploymentStatus.status) {
      case 'deployed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'deploying':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Globe className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (deploymentStatus.status) {
      case 'deployed':
        return 'Live'
      case 'deploying':
        return 'Deploying...'
      case 'error':
        return 'Error'
      default:
        return 'Not Deployed'
    }
  }

  const getStatusColor = () => {
    switch (deploymentStatus.status) {
      case 'deployed':
        return 'bg-green-100 text-green-800'
      case 'deploying':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <CardTitle className="text-lg">{app.name}</CardTitle>
                <CardDescription>
                  <Badge className={getStatusColor()}>
                    {getStatusText()}
                  </Badge>
                  {deploymentStatus.deployed_at && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Deployed {new Date(deploymentStatus.deployed_at).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            
            {deploymentStatus.status === 'deployed' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deploymentStatus.live_url, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Live
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnpublish}
                >
                  Unpublish
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {deploymentStatus.status === 'deployed' && (
          <CardContent>
            <div className="space-y-4">
              {/* Live URLs */}
              <div className="space-y-3">
                {deploymentStatus.live_url && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Live URL:</span>
                      <a 
                        href={deploymentStatus.live_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-700 hover:underline"
                      >
                        {deploymentStatus.live_url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(deploymentStatus.live_url!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(deploymentStatus.live_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {deploymentStatus.subdomain_url && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Subdomain:</span>
                      <a 
                        href={deploymentStatus.subdomain_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {deploymentStatus.subdomain_url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(deploymentStatus.subdomain_url!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(deploymentStatus.subdomain_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {deploymentStatus.ssl_enabled && (
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>SSL Enabled</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>CDN Enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {deploymentStatus.status === 'error' && (
          <CardContent>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Deployment Error</span>
              </div>
              <p className="text-red-700 text-sm">{deploymentStatus.error}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Deployment Configuration */}
      {deploymentStatus.status !== 'deployed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Deploy Your App
            </CardTitle>
            <CardDescription>
              Configure your deployment settings and make your app live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="domain">Domain</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="subdomain"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        placeholder="my-app"
                      />
                      <span className="text-sm text-muted-foreground">.webcraft.dev</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your app will be available at https://{subdomain || 'my-app'}.webcraft.dev
                    </p>
                  </div>

                  <Button 
                    onClick={handleDeploy} 
                    disabled={isDeploying || !subdomain}
                    className="w-full"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy App
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="domain" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-domain">Custom Domain</Label>
                    <Input
                      id="custom-domain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="johspizza.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use your own domain name (requires DNS configuration)
                    </p>
                  </div>

                  {customDomain && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">DNS Configuration Required</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        To use your custom domain, add these DNS records:
                      </p>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <span>CNAME: {customDomain} → apps.webcraft.dev</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${customDomain} CNAME apps.webcraft.dev`)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleDeploy} 
                    disabled={isDeploying}
                    className="w-full"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy with Custom Domain
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Static Site Export</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Export your app as static HTML/CSS/JS files that can be hosted anywhere.
                    </p>
                    <div className="text-xs text-blue-600">
                      <p>✓ Works with any hosting provider</p>
                      <p>✓ No server required</p>
                      <p>✓ Fast loading times</p>
                      <p>✓ SEO optimized</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => window.open(`/apps/${appId}/export`, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Open Export Manager
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>CDN & Caching</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable global CDN for faster loading
                        </p>
                      </div>
                      <Switch
                        checked={deploymentConfig.enableCDN}
                        onCheckedChange={(checked) => 
                          setDeploymentConfig(prev => ({ ...prev, enableCDN: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SSL Certificate</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatic HTTPS with Let's Encrypt
                        </p>
                      </div>
                      <Switch
                        checked={deploymentConfig.enableSSL}
                        onCheckedChange={(checked) => 
                          setDeploymentConfig(prev => ({ ...prev, enableSSL: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Analytics</Label>
                        <p className="text-xs text-muted-foreground">
                          Built-in analytics and performance monitoring
                        </p>
                      </div>
                      <Switch
                        checked={deploymentConfig.enableAnalytics}
                        onCheckedChange={(checked) => 
                          setDeploymentConfig(prev => ({ ...prev, enableAnalytics: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleDeploy} 
                    disabled={isDeploying}
                    className="w-full"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy App
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}