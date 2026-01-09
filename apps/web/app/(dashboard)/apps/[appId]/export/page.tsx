'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StaticExportManager } from '@/components/export/static-export-manager'
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

export default function ExportPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

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
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/apps/${appId}/deploy`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deploy
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Export Static Site</h1>
            <p className="text-muted-foreground">
              Generate and download static files for your app
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
          <Button
            variant="outline"
            onClick={() => router.push(`/apps/${appId}/deploy`)}
          >
            <Globe className="w-4 h-4 mr-2" />
            Deploy Live
          </Button>
        </div>
      </div>

      {/* App Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
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

      {/* Static Export Manager */}
      <StaticExportManager appId={appId} app={app} />

      {/* Export Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Static Export Guide</CardTitle>
          <CardDescription>
            Learn how to use your exported static site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Download Your Export</h4>
              <p className="text-sm text-muted-foreground">
                Generate and download a ZIP file containing all your site files.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Extract Files</h4>
              <p className="text-sm text-muted-foreground">
                Unzip the downloaded file to access your HTML, CSS, and JavaScript files.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Host Anywhere</h4>
              <p className="text-sm text-muted-foreground">
                Upload the files to any web hosting service like GitHub Pages, Netlify, Vercel, or your own server.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Popular Hosting Options</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>GitHub Pages:</strong> Free hosting for public repositories</p>
                <p>• <strong>Netlify:</strong> Drag & drop deployment with forms and functions</p>
                <p>• <strong>Vercel:</strong> Fast global CDN with automatic HTTPS</p>
                <p>• <strong>AWS S3:</strong> Scalable cloud hosting</p>
                <p>• <strong>Traditional Hosting:</strong> Upload via FTP to any web host</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}