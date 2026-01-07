'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Settings, Globe, Palette, Search, Shield, Bell, Code, Trash2,
  Save, RefreshCw, Copy, ExternalLink, Check, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface AppSettings {
  id: string
  name: string
  slug: string
  description: string
  app_type: string
  is_published: boolean
  custom_domain: string | null
  subdomain: string | null
  config: Record<string, any>
  theme_config: Record<string, any>
  seo_config: Record<string, any>
}

const THEME_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
]

export default function AppSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [appId])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get(`/apps/${appId}`)
      setSettings(response.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    
    setIsSaving(true)
    try {
      await apiClient.put(`/apps/${appId}`, {
        name: settings.name,
        description: settings.description,
        config: settings.config,
        theme_config: settings.theme_config,
        seo_config: settings.seo_config,
        is_published: settings.is_published,
        custom_domain: settings.custom_domain
      })
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/apps/${appId}`)
      router.push('/apps')
    } catch (error) {
      console.error('Failed to delete app:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates })
    }
  }

  const updateConfig = (key: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        config: { ...settings.config, [key]: value }
      })
    }
  }

  const updateTheme = (key: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        theme_config: { ...settings.theme_config, [key]: value }
      })
    }
  }

  const updateSeo = (key: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        seo_config: { ...settings.seo_config, [key]: value }
      })
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">App not found</p>
      </div>
    )
  }

  const appUrl = settings.custom_domain 
    ? `https://${settings.custom_domain}`
    : settings.subdomain 
      ? `https://${settings.subdomain}.webcraft.dev`
      : `https://webcraft.dev/preview/${appId}`

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Settings</h1>
          <p className="text-muted-foreground">Configure your app's settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Globe className="w-4 h-4 mr-2" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="w-4 h-4 mr-2" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Code className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="danger">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Danger
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic information about your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>App Name</Label>
                <Input
                  value={settings.name}
                  onChange={(e) => updateSettings({ name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={settings.description || ''}
                  onChange={(e) => updateSettings({ description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>App Type</Label>
                <Select value={settings.app_type} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Published</p>
                  <p className="text-sm text-muted-foreground">
                    Make your app publicly accessible
                  </p>
                </div>
                <Switch
                  checked={settings.is_published}
                  onCheckedChange={(checked) => updateSettings({ is_published: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Settings */}
        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure your app's URL and domain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current URL</Label>
                <div className="flex gap-2">
                  <Input value={appUrl} readOnly className="flex-1" />
                  <Button variant="outline" onClick={() => copyToClipboard(appUrl)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={appUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex">
                  <Input
                    value={settings.subdomain || ''}
                    onChange={(e) => updateSettings({ subdomain: e.target.value })}
                    placeholder="my-app"
                    className="rounded-r-none"
                  />
                  <div className="px-3 flex items-center bg-muted border border-l-0 rounded-r-md text-muted-foreground">
                    .webcraft.dev
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Custom Domain</Label>
                <Input
                  value={settings.custom_domain || ''}
                  onChange={(e) => updateSettings({ custom_domain: e.target.value })}
                  placeholder="www.example.com"
                />
                <p className="text-sm text-muted-foreground">
                  Point your domain's CNAME record to webcraft.dev
                </p>
              </div>
              
              {settings.custom_domain && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium mb-2">DNS Configuration</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono">CNAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-mono">{settings.custom_domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-mono">webcraft.dev</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>Customize your app's appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-10 h-10 rounded-lg transition-transform",
                        settings.theme_config?.primaryColor === color.value && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => updateTheme('primaryColor', color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={settings.theme_config?.fontFamily || 'inter'}
                  onValueChange={(v) => updateTheme('fontFamily', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="poppins">Poppins</SelectItem>
                    <SelectItem value="opensans">Open Sans</SelectItem>
                    <SelectItem value="lato">Lato</SelectItem>
                    <SelectItem value="montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Select
                  value={settings.theme_config?.borderRadius || 'medium'}
                  onValueChange={(v) => updateTheme('borderRadius', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode support
                  </p>
                </div>
                <Switch
                  checked={settings.theme_config?.darkMode || false}
                  onCheckedChange={(checked) => updateTheme('darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your app for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Title</Label>
                <Input
                  value={settings.seo_config?.siteTitle || ''}
                  onChange={(e) => updateSeo('siteTitle', e.target.value)}
                  placeholder="My Awesome Website"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={settings.seo_config?.metaDescription || ''}
                  onChange={(e) => updateSeo('metaDescription', e.target.value)}
                  placeholder="A brief description of your website..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {(settings.seo_config?.metaDescription || '').length}/160 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  value={settings.seo_config?.keywords || ''}
                  onChange={(e) => updateSeo('keywords', e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Open Graph Image</Label>
                <Input
                  value={settings.seo_config?.ogImage || ''}
                  onChange={(e) => updateSeo('ogImage', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Generate Sitemap</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate sitemap.xml
                  </p>
                </div>
                <Switch
                  checked={settings.seo_config?.generateSitemap !== false}
                  onCheckedChange={(checked) => updateSeo('generateSitemap', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Index Site</p>
                  <p className="text-sm text-muted-foreground">
                    Allow search engines to index your site
                  </p>
                </div>
                <Switch
                  checked={settings.seo_config?.indexSite !== false}
                  onCheckedChange={(checked) => updateSeo('indexSite', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Developer options and integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Head Code</Label>
                <Textarea
                  value={settings.config?.customHead || ''}
                  onChange={(e) => updateConfig('customHead', e.target.value)}
                  placeholder="<!-- Add custom scripts, styles, or meta tags -->"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Custom Body Code</Label>
                <Textarea
                  value={settings.config?.customBody || ''}
                  onChange={(e) => updateConfig('customBody', e.target.value)}
                  placeholder="<!-- Add scripts before closing body tag -->"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  value={settings.config?.googleAnalyticsId || ''}
                  onChange={(e) => updateConfig('googleAnalyticsId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  value={settings.config?.facebookPixelId || ''}
                  onChange={(e) => updateConfig('facebookPixelId', e.target.value)}
                  placeholder="XXXXXXXXXXXXXXX"
                />
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium mb-2">API Access</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">App ID</span>
                    <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{appId}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">API Endpoint</span>
                    <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">/api/v1/apps/{appId}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <div>
                  <p className="font-medium">Delete App</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this app and all its data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete App
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        app and remove all associated data including pages, collections,
                        and files.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete App
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
