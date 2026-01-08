'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Globe, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeploymentManager } from '@/components/deployment/deployment-manager'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface App {
  id: string
  name: string
  slug: string
  description?: string
  app_type: string
  is_published: boolean
  custom_domain?: string
  subdomain?: string
  config?: any
  created_at: string
  updated_at: string
}

export default function DeployPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.id as string

  const [app, setApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadApp()
  }, [appId])

  const loadApp = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/apps/${appId}`)
      setApp(response.data)
    } catch (error: any) {
      console.error('Failed to load app:', error)
      setError(error.response?.data?.detail || 'Failed to load app')
      toast.error('Failed to load app')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploymentChange = () => {
    // Reload app data to get updated deployment status
    loadApp()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading app...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'App not found'}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/editor/${appId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Deploy App</h1>
            <p className="text-muted-foreground">
              Make your app live and accessible to the world
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/editor/${appId}`)}
          >
            Edit App
          </Button>
          {app.is_published && (
            <Button
              onClick={() => {
                const url = app.custom_domain 
                  ? `https://${app.custom_domain}` 
                  : `https://${app.subdomain || app.slug}.webcraft.dev`
                window.open(url, '_blank')
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          )}
        </div>
      </div>

      {/* App Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>{app.name}</CardTitle>
              <CardDescription>
                {app.description || `A ${app.app_type} application`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium capitalize">{app.app_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Slug:</span>
              <p className="font-medium">{app.slug}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <p className="font-medium">
                {new Date(app.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Manager */}
      <DeploymentManager
        appId={appId}
        app={app}
        onDeploymentChange={handleDeploymentChange}
      />

      {/* Deployment Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Deployment Guide</CardTitle>
          <CardDescription>
            Learn how to deploy and manage your app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Choose Your Domain</h4>
              <p className="text-sm text-muted-foreground">
                Use a free webcraft.dev subdomain or connect your own custom domain.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Configure DNS (Custom Domain)</h4>
              <p className="text-sm text-muted-foreground">
                For custom domains, add a CNAME record pointing to apps.webcraft.dev
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Deploy & Go Live</h4>
              <p className="text-sm text-muted-foreground">
                Your app will be deployed with SSL, CDN, and global edge caching automatically.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Monitor & Update</h4>
              <p className="text-sm text-muted-foreground">
                Track performance, update content, and manage your live app from the dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}