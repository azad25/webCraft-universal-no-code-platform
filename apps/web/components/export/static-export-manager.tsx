'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Github, 
  Globe, 
  Zap, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Copy,
  Archive,
  Code,
  Smartphone,
  Monitor,
  Gauge,
  Eye,
  RefreshCw,
  Upload,
  Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { apiClient } from '@/lib/api-client'
import { useAppDispatch } from '@/store'
import { addToast } from '@/store/slices/uiSlice'

interface StaticExportManagerProps {
  appId: string
  app: {
    id: string
    name: string
    slug: string
    is_published: boolean
    custom_domain?: string
    subdomain?: string
  }
}

interface ExportJob {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  format: string
  file_size_bytes?: number
  pages_count?: number
  assets_count?: number
  lighthouse_score?: any
  error_message?: string
  created_at: string
  expires_at?: string
}

interface ExportOptions {
  format: 'zip' | 'github' | 'netlify' | 'vercel' | 's3'
  include_analytics: boolean
  minify_html: boolean
  minify_css: boolean
  minify_js: boolean
  optimize_images: boolean
  generate_sitemap: boolean
  generate_robots: boolean
  custom_domain?: string
  base_path: string
}

export function StaticExportManager({ appId, app }: StaticExportManagerProps) {
  const dispatch = useAppDispatch()
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null)
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'zip',
    include_analytics: false,
    minify_html: true,
    minify_css: true,
    minify_js: true,
    optimize_images: true,
    generate_sitemap: true,
    generate_robots: true,
    base_path: '/'
  })
  const [previewData, setPreviewData] = useState<any>(null)
  const [lighthouseScore, setLighthouseScore] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('export')

  // Platform-specific settings
  const [githubSettings, setGithubSettings] = useState({
    repo_name: app.slug,
    branch: 'main',
    enable_pages: true,
    github_token: ''
  })

  const [netlifySettings, setNetlifySettings] = useState({
    site_name: app.slug,
    netlify_token: ''
  })

  const [vercelSettings, setVercelSettings] = useState({
    project_name: app.slug,
    vercel_token: ''
  })

  useEffect(() => {
    loadExportHistory()
    loadPreviewData()
  }, [appId])

  const loadExportHistory = async () => {
    try {
      const response = await apiClient.get(`/api/v1/apps/${appId}/export/history`)
      setExportHistory(response.data.exports)
    } catch (error) {
      console.error('Failed to load export history:', error)
    }
  }

  const loadPreviewData = async () => {
    try {
      const response = await apiClient.get(`/api/v1/apps/${appId}/export/preview`)
      setPreviewData(response.data)
    } catch (error) {
      console.error('Failed to load preview data:', error)
    }
  }

  const runLighthouseAudit = async () => {
    try {
      const response = await apiClient.post(`/api/v1/apps/${appId}/export/lighthouse`)
      setLighthouseScore(response.data)
      dispatch(addToast({
        type: 'success',
        title: 'Lighthouse audit completed',
        message: 'Performance audit results are now available'
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to run Lighthouse audit',
        message: error.response?.data?.detail || 'An error occurred during the audit'
      }))
    }
  }

  const startExport = async (format: string = exportOptions.format) => {
    setIsExporting(true)
    
    try {
      const response = await apiClient.post(`/api/v1/apps/${appId}/export/static`, {
        ...exportOptions,
        format
      })
      
      const jobId = response.data.export_id
      setCurrentJob({ 
        id: jobId, 
        status: 'processing', 
        progress: 0, 
        format,
        created_at: new Date().toISOString()
      })
      
      // Poll for status
      pollExportStatus(jobId)
      
      dispatch(addToast({
        type: 'success',
        title: 'Export started',
        message: 'Your static site export is now being generated'
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to start export',
        message: error.response?.data?.detail || 'An error occurred while starting the export'
      }))
      setIsExporting(false)
    }
  }

  const pollExportStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await apiClient.get(`/api/v1/apps/${appId}/export/status?export_id=${jobId}`)
        const job = response.data
        
        setCurrentJob(job)
        
        if (job.status === 'completed') {
          setIsExporting(false)
          dispatch(addToast({
            type: 'success',
            title: 'Export completed successfully!',
            message: 'Your static site is ready for download'
          }))
          loadExportHistory()
        } else if (job.status === 'failed') {
          setIsExporting(false)
          dispatch(addToast({
            type: 'error',
            title: 'Export failed',
            message: job.error_message || 'An error occurred during export'
          }))
        } else {
          // Continue polling
          setTimeout(poll, 2000)
        }
      } catch (error) {
        setIsExporting(false)
        dispatch(addToast({
          type: 'error',
          title: 'Failed to check export status',
          message: 'Unable to retrieve export progress'
        }))
      }
    }
    
    poll()
  }

  const downloadExport = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/apps/${appId}/export/download?export_id=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${app.slug}-export.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        dispatch(addToast({
          type: 'success',
          title: 'Download started',
          message: 'Your export file is being downloaded'
        }))
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to download export',
        message: 'Unable to download the export file'
      }))
    }
  }

  const exportToGitHub = async () => {
    if (!githubSettings.github_token) {
      dispatch(addToast({
        type: 'error',
        title: 'GitHub token is required',
        message: 'Please provide a valid GitHub token to continue'
      }))
      return
    }
    
    setIsExporting(true)
    
    try {
      const response = await apiClient.post(`/api/v1/apps/${appId}/export/github`, null, {
        params: {
          repo_name: githubSettings.repo_name,
          branch: githubSettings.branch,
          enable_pages: githubSettings.enable_pages,
          github_token: githubSettings.github_token
        }
      })
      
      dispatch(addToast({
        type: 'success',
        title: 'Exported to GitHub successfully!',
        message: response.data.pages_url ? `Site available at: ${response.data.pages_url}` : 'Your code has been pushed to GitHub'
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to export to GitHub',
        message: error.response?.data?.detail || 'An error occurred during GitHub export'
      }))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToNetlify = async () => {
    if (!netlifySettings.netlify_token) {
      dispatch(addToast({
        type: 'error',
        title: 'Netlify token is required',
        message: 'Please provide a valid Netlify token to continue'
      }))
      return
    }
    
    setIsExporting(true)
    
    try {
      const response = await apiClient.post(`/api/v1/apps/${appId}/export/netlify`, null, {
        params: {
          site_name: netlifySettings.site_name,
          netlify_token: netlifySettings.netlify_token
        }
      })
      
      dispatch(addToast({
        type: 'success',
        title: 'Deployed to Netlify successfully!',
        message: `Your site is live at: ${response.data.site_url}`
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to deploy to Netlify',
        message: error.response?.data?.detail || 'An error occurred during Netlify deployment'
      }))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToVercel = async () => {
    if (!vercelSettings.vercel_token) {
      dispatch(addToast({
        type: 'error',
        title: 'Vercel token is required',
        message: 'Please provide a valid Vercel token to continue'
      }))
      return
    }
    
    setIsExporting(true)
    
    try {
      const response = await apiClient.post(`/api/v1/apps/${appId}/export/vercel`, null, {
        params: {
          project_name: vercelSettings.project_name,
          vercel_token: vercelSettings.vercel_token
        }
      })
      
      dispatch(addToast({
        type: 'success',
        title: 'Deployed to Vercel successfully!',
        message: `Your site is live at: ${response.data.deployment_url}`
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to deploy to Vercel',
        message: error.response?.data?.detail || 'An error occurred during Vercel deployment'
      }))
    } finally {
      setIsExporting(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Archive className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Export Preview
              </CardTitle>
              <CardDescription>
                Preview what will be included in your static export
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Pages</h4>
                    <div className="space-y-2">
                      {previewData.pages.map((page: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{page.path}</span>
                          <span className="text-xs text-muted-foreground">{page.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Assets</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Images:</span>
                        <span>{previewData.assets.images}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stylesheets:</span>
                        <span>{previewData.assets.stylesheets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scripts:</span>
                        <span>{previewData.assets.scripts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fonts:</span>
                        <span>{previewData.assets.fonts}</span>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Estimated Size:</span>
                        <span className="font-medium">{previewData.estimated_size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Export Time:</span>
                        <span className="font-medium">{previewData.estimated_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading preview...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lighthouse Audit */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Performance Audit
                  </CardTitle>
                  <CardDescription>
                    Run Lighthouse audit to check your site's performance
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={runLighthouseAudit}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Audit
                </Button>
              </div>
            </CardHeader>
            {lighthouseScore && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(lighthouseScore.scores).map(([key, score]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold mb-1" style={{ 
                        color: score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444' 
                      }}>
                        {score}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Export Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Static Site
              </CardTitle>
              <CardDescription>
                Generate and download your static site files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentJob && currentJob.status === 'processing' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="font-medium text-blue-800">Exporting...</span>
                    </div>
                    <Progress value={currentJob.progress} className="mb-2" />
                    <p className="text-sm text-blue-700">
                      Generating static files for {app.name}
                    </p>
                  </div>
                )}

                {currentJob && currentJob.status === 'completed' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Export Complete</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadExport(currentJob.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Size: {formatFileSize(currentJob.file_size_bytes)}</p>
                      <p>Pages: {currentJob.pages_count} • Assets: {currentJob.assets_count}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => startExport('zip')}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Export as ZIP
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          {/* GitHub Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Export to GitHub
              </CardTitle>
              <CardDescription>
                Deploy directly to GitHub repository with GitHub Pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github-repo">Repository Name</Label>
                  <Input
                    id="github-repo"
                    value={githubSettings.repo_name}
                    onChange={(e) => setGithubSettings(prev => ({ ...prev, repo_name: e.target.value }))}
                    placeholder="my-website"
                  />
                </div>
                <div>
                  <Label htmlFor="github-branch">Branch</Label>
                  <Input
                    id="github-branch"
                    value={githubSettings.branch}
                    onChange={(e) => setGithubSettings(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="main"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="github-token">GitHub Token</Label>
                <Input
                  id="github-token"
                  type="password"
                  value={githubSettings.github_token}
                  onChange={(e) => setGithubSettings(prev => ({ ...prev, github_token: e.target.value }))}
                  placeholder="ghp_xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create a personal access token with repo permissions
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="github-pages"
                  checked={githubSettings.enable_pages}
                  onCheckedChange={(checked) => setGithubSettings(prev => ({ ...prev, enable_pages: checked }))}
                />
                <Label htmlFor="github-pages">Enable GitHub Pages</Label>
              </div>
              
              <Button onClick={exportToGitHub} disabled={isExporting} className="w-full">
                <Github className="w-4 h-4 mr-2" />
                Export to GitHub
              </Button>
            </CardContent>
          </Card>

          {/* Netlify Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Deploy to Netlify
              </CardTitle>
              <CardDescription>
                Deploy directly to Netlify with automatic SSL and CDN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="netlify-site">Site Name</Label>
                <Input
                  id="netlify-site"
                  value={netlifySettings.site_name}
                  onChange={(e) => setNetlifySettings(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder="my-website"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be available at {netlifySettings.site_name}.netlify.app
                </p>
              </div>
              
              <div>
                <Label htmlFor="netlify-token">Netlify Token</Label>
                <Input
                  id="netlify-token"
                  type="password"
                  value={netlifySettings.netlify_token}
                  onChange={(e) => setNetlifySettings(prev => ({ ...prev, netlify_token: e.target.value }))}
                  placeholder="nfp_xxxxxxxxxxxx"
                />
              </div>
              
              <Button onClick={exportToNetlify} disabled={isExporting} className="w-full">
                <Cloud className="w-4 h-4 mr-2" />
                Deploy to Netlify
              </Button>
            </CardContent>
          </Card>

          {/* Vercel Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Deploy to Vercel
              </CardTitle>
              <CardDescription>
                Deploy to Vercel with edge functions and global CDN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vercel-project">Project Name</Label>
                <Input
                  id="vercel-project"
                  value={vercelSettings.project_name}
                  onChange={(e) => setVercelSettings(prev => ({ ...prev, project_name: e.target.value }))}
                  placeholder="my-website"
                />
              </div>
              
              <div>
                <Label htmlFor="vercel-token">Vercel Token</Label>
                <Input
                  id="vercel-token"
                  type="password"
                  value={vercelSettings.vercel_token}
                  onChange={(e) => setVercelSettings(prev => ({ ...prev, vercel_token: e.target.value }))}
                  placeholder="xxxxxxxxxx"
                />
              </div>
              
              <Button onClick={exportToVercel} disabled={isExporting} className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Deploy to Vercel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>
                Configure how your static site will be generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Optimization</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Minify HTML</Label>
                      <p className="text-xs text-muted-foreground">Remove whitespace and comments</p>
                    </div>
                    <Switch
                      checked={exportOptions.minify_html}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, minify_html: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Minify CSS</Label>
                      <p className="text-xs text-muted-foreground">Compress CSS files</p>
                    </div>
                    <Switch
                      checked={exportOptions.minify_css}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, minify_css: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Minify JavaScript</Label>
                      <p className="text-xs text-muted-foreground">Compress JavaScript files</p>
                    </div>
                    <Switch
                      checked={exportOptions.minify_js}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, minify_js: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Optimize Images</Label>
                      <p className="text-xs text-muted-foreground">Compress and convert images</p>
                    </div>
                    <Switch
                      checked={exportOptions.optimize_images}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, optimize_images: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">SEO & Metadata</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Generate Sitemap</Label>
                      <p className="text-xs text-muted-foreground">Create sitemap.xml for search engines</p>
                    </div>
                    <Switch
                      checked={exportOptions.generate_sitemap}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, generate_sitemap: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Generate Robots.txt</Label>
                      <p className="text-xs text-muted-foreground">Create robots.txt file</p>
                    </div>
                    <Switch
                      checked={exportOptions.generate_robots}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, generate_robots: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Analytics</Label>
                      <p className="text-xs text-muted-foreground">Add tracking scripts</p>
                    </div>
                    <Switch
                      checked={exportOptions.include_analytics}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, include_analytics: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Advanced</h4>
                <div>
                  <Label htmlFor="base-path">Base Path</Label>
                  <Input
                    id="base-path"
                    value={exportOptions.base_path}
                    onChange={(e) => 
                      setExportOptions(prev => ({ ...prev, base_path: e.target.value }))
                    }
                    placeholder="/"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Base path for all URLs (useful for subdirectory deployments)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and download previous exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportHistory.length > 0 ? (
                <div className="space-y-3">
                  {exportHistory.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <span className="text-sm font-medium">{job.format.toUpperCase()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {job.file_size_bytes && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(job.file_size_bytes)}
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadExport(job.id)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No exports yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first static export to see it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}