'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Github, Globe, Cloud, Server, CheckCircle, Loader2, FileArchive, Gauge, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

const exportOptions = [
  { id: 'zip', name: 'Download ZIP', description: 'Download complete site as ZIP file', icon: FileArchive, color: 'bg-blue-500' },
  { id: 'github', name: 'GitHub', description: 'Push to GitHub repository', icon: Github, color: 'bg-gray-800' },
  { id: 'netlify', name: 'Netlify', description: 'Deploy to Netlify', icon: Globe, color: 'bg-teal-500' },
  { id: 'vercel', name: 'Vercel', description: 'Deploy to Vercel', icon: Globe, color: 'bg-black' },
  { id: 's3', name: 'AWS S3', description: 'Upload to S3 bucket', icon: Cloud, color: 'bg-orange-500' }
]

interface ExportJob {
  id: string
  status: string
  progress: number
  file_size_bytes?: number
  pages_count?: number
  assets_count?: number
  lighthouse_score?: {
    performance: number
    accessibility: number
    best_practices: number
    seo: number
  }
}

export default function ExportPage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [selectedOption, setSelectedOption] = useState('zip')
  const [isExporting, setIsExporting] = useState(false)
  const [exportJob, setExportJob] = useState<ExportJob | null>(null)
  const [lighthouseScore, setLighthouseScore] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  
  const [options, setOptions] = useState({
    minify_html: true,
    minify_css: true,
    minify_js: true,
    optimize_images: true,
    generate_sitemap: true,
    include_analytics: false
  })

  // For GitHub/Netlify/Vercel deployments
  const [deployConfig, setDeployConfig] = useState({
    github_token: '',
    repo_name: '',
    netlify_token: '',
    vercel_token: '',
    site_name: ''
  })

  useEffect(() => {
    fetchPreview()
  }, [appId])

  const fetchPreview = async () => {
    try {
      const response = await apiClient.get(`/apps/${appId}/export/preview`)
      setPreview(response.data)
    } catch (error) {
      console.error('Failed to fetch preview:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportJob(null)

    try {
      // Start export
      const response = await apiClient.post(`/apps/${appId}/export/static`, {
        format: selectedOption,
        ...options
      })

      const exportId = response.data.export_id

      // Poll for status
      const pollStatus = async () => {
        const statusResponse = await apiClient.get(
          `/apps/${appId}/export/status?export_id=${exportId}`
        )
        const job = statusResponse.data

        setExportJob(job)

        if (job.status === 'processing') {
          setTimeout(pollStatus, 1000)
        } else {
          setIsExporting(false)
        }
      }

      pollStatus()
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  const handleDownload = async () => {
    if (!exportJob) return

    try {
      const response = await apiClient.get(
        `/apps/${appId}/export/download?export_id=${exportJob.id}`,
        { responseType: 'blob' }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export-${appId}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleGitHubExport = async () => {
    if (!deployConfig.github_token || !deployConfig.repo_name) {
      alert('Please enter GitHub token and repository name')
      return
    }

    setIsExporting(true)
    try {
      const response = await apiClient.post(
        `/apps/${appId}/export/github?repo_name=${deployConfig.repo_name}&github_token=${deployConfig.github_token}`
      )
      alert(`Exported to GitHub: ${response.data.repository}`)
    } catch (error) {
      console.error('GitHub export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleNetlifyExport = async () => {
    if (!deployConfig.netlify_token) {
      alert('Please enter Netlify token')
      return
    }

    setIsExporting(true)
    try {
      const response = await apiClient.post(
        `/apps/${appId}/export/netlify?netlify_token=${deployConfig.netlify_token}&site_name=${deployConfig.site_name}`
      )
      alert(`Deployed to Netlify: ${response.data.site_url}`)
    } catch (error) {
      console.error('Netlify export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleVercelExport = async () => {
    if (!deployConfig.vercel_token) {
      alert('Please enter Vercel token')
      return
    }

    setIsExporting(true)
    try {
      const response = await apiClient.post(
        `/apps/${appId}/export/vercel?vercel_token=${deployConfig.vercel_token}&project_name=${deployConfig.site_name}`
      )
      alert(`Deployed to Vercel: ${response.data.deployment_url}`)
    } catch (error) {
      console.error('Vercel export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const runLighthouse = async () => {
    try {
      const response = await apiClient.post(`/apps/${appId}/export/lighthouse`)
      setLighthouseScore(response.data.scores)
    } catch (error) {
      console.error('Lighthouse audit failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">Export & Deploy</h1>
          <p className="text-muted-foreground">Export your site or deploy to hosting platforms</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Destination</CardTitle>
                <CardDescription>Choose where to export your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {exportOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOption(option.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        selectedOption === option.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-white dark:bg-slate-800 hover:border-primary/50"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white", option.color)}>
                        <option.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{option.name}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform-specific config */}
            {selectedOption === 'github' && (
              <Card>
                <CardHeader>
                  <CardTitle>GitHub Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>GitHub Token</Label>
                    <Input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxx"
                      value={deployConfig.github_token}
                      onChange={(e) => setDeployConfig({ ...deployConfig, github_token: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repository Name</Label>
                    <Input
                      placeholder="my-website"
                      value={deployConfig.repo_name}
                      onChange={(e) => setDeployConfig({ ...deployConfig, repo_name: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {(selectedOption === 'netlify' || selectedOption === 'vercel') && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedOption === 'netlify' ? 'Netlify' : 'Vercel'} Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Token</Label>
                    <Input
                      type="password"
                      placeholder="Enter your token"
                      value={selectedOption === 'netlify' ? deployConfig.netlify_token : deployConfig.vercel_token}
                      onChange={(e) => setDeployConfig({
                        ...deployConfig,
                        [selectedOption === 'netlify' ? 'netlify_token' : 'vercel_token']: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site/Project Name (optional)</Label>
                    <Input
                      placeholder="my-website"
                      value={deployConfig.site_name}
                      onChange={(e) => setDeployConfig({ ...deployConfig, site_name: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Optimization Options</CardTitle>
                <CardDescription>Configure export settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(options).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => setOptions({ ...options, [key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Export Progress */}
            {(isExporting || exportJob) && (
              <Card>
                <CardContent className="p-6">
                  {isExporting && exportJob?.status === 'processing' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="font-medium">Exporting...</span>
                      </div>
                      <Progress value={exportJob?.progress || 0} />
                      <p className="text-sm text-muted-foreground">
                        {exportJob?.progress || 0}% complete
                      </p>
                    </div>
                  ) : exportJob?.status === 'completed' ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="font-medium">Export Complete!</p>
                          <p className="text-sm text-muted-foreground">
                            {exportJob.pages_count} pages, {Math.round((exportJob.file_size_bytes || 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ) : exportJob?.status === 'failed' ? (
                    <div className="text-red-500">Export failed. Please try again.</div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Lighthouse Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lighthouseScore ? (
                  <div className="space-y-3">
                    {Object.entries(lighthouseScore).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        <Badge variant={Number(value) >= 90 ? 'default' : 'secondary'} className={Number(value) >= 90 ? 'bg-green-500' : ''}>
                          {String(value)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={runLighthouse}>
                    Run Audit
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages</span>
                  <span className="font-medium">{preview?.pages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Images</span>
                  <span className="font-medium">{preview?.assets?.images || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stylesheets</span>
                  <span className="font-medium">{preview?.assets?.stylesheets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scripts</span>
                  <span className="font-medium">{preview?.assets?.scripts || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Est. Size</span>
                  <span className="font-medium">{preview?.estimated_size || '~2 MB'}</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => {
                if (selectedOption === 'zip') handleExport()
                else if (selectedOption === 'github') handleGitHubExport()
                else if (selectedOption === 'netlify') handleNetlifyExport()
                else if (selectedOption === 'vercel') handleVercelExport()
                else handleExport()
              }} 
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {selectedOption === 'zip' ? 'Export Site' : `Deploy to ${selectedOption}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
