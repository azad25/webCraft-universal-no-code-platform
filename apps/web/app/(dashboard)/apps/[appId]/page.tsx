'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/dev-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAppQuery, useGetAppAnalyticsQuery } from '@/store/api/apiSlice';
import { Loader2 } from 'lucide-react';
import {
  Edit3,
  Settings,
  BarChart3,
  Zap,
  Download,
  Globe,
  Eye,
  Users,
  Clock,
  ArrowUpRight,
  Plug,
  FileText,
  Layers,
  Database,
  Image
} from 'lucide-react';

export default function AppOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  // All hooks must be declared at the top level, before any early returns
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const { data: app, isLoading, error } = useGetAppQuery(appId);
  const { data: analytics } = useGetAppAnalyticsQuery({ id: appId, days: 30 });

  // Generate preview URL when needed
  const generatePreviewUrl = async () => {
    if (previewUrl || isGeneratingPreview) return previewUrl

    setIsGeneratingPreview(true)
    try {
      const response = await fetch(`/api/apps/${appId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const url = `${window.location.origin}/preview/${data.token}`
        setPreviewUrl(url)
        return url
      } else {
        console.error('Failed to generate preview URL')
        return null
      }
    } catch (error) {
      console.error('Error generating preview URL:', error)
      return null
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const handleViewLive = async () => {
    if (app?.is_published && (app.custom_domain || app.subdomain)) {
      // If app is published and has a domain, use it
      const domain = app.custom_domain || app.subdomain || `${app.slug}.webcraft.app`
      window.open(`https://${domain}`, '_blank')
    } else {
      // Otherwise, generate and use preview URL
      const url = await generatePreviewUrl()
      if (url) {
        window.open(url, '_blank')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">App not found</h3>
          <p className="text-muted-foreground">The app you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/apps')} className="mt-4">
            Back to Apps
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const quickActions = [
    { label: 'Edit Site', icon: Edit3, href: `/editor/${appId}`, primary: true },
    { 
      label: isGeneratingPreview ? 'Generating...' : 'View Live', 
      icon: Eye, 
      onClick: handleViewLive,
      external: true,
      disabled: isGeneratingPreview
    },
    { label: 'Settings', icon: Settings, href: `/apps/${appId}/settings` },
    { label: 'Analytics', icon: BarChart3, href: `/apps/${appId}/analytics` },
  ];

  const sections = [
    {
      title: 'Pages',
      description: 'Manage your site pages and content',
      icon: FileText,
      href: `/apps/${appId}/pages`,
      count: analytics?.top_pages?.length || 0
    },
    {
      title: 'Media Library',
      description: 'Images, videos, and documents',
      icon: Image,
      href: `/apps/${appId}/media`,
      count: 24
    },
    {
      title: 'Automations',
      description: 'Set up workflows and triggers',
      icon: Zap,
      href: `/apps/${appId}/automations`,
      count: 0
    },
    {
      title: 'Data Sources',
      description: 'Connect APIs and web scrapers',
      icon: Database,
      href: `/apps/${appId}/data-sources`,
      count: 0
    },
    {
      title: 'Integrations',
      description: 'Connect third-party services',
      icon: Plug,
      href: `/apps/${appId}/integrations`,
      count: 0
    },
    {
      title: 'Export',
      description: 'Download or deploy your site',
      icon: Download,
      href: `/apps/${appId}/export`
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{app.name}</h1>
            <Badge variant={app.is_published ? 'default' : 'secondary'}>
              {app.is_published ? 'published' : 'draft'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{app.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? 'default' : 'outline'}
            disabled={action.disabled}
            onClick={() => {
              if (action.onClick) {
                action.onClick()
              } else if (action.external && action.href) {
                window.open(action.href, '_blank')
              } else if (action.href) {
                router.push(action.href)
              }
            }}
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
            {action.external && <ArrowUpRight className="w-3 h-3 ml-1" />}
          </Button>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.page_views?.toLocaleString() || '0'}</p>
                <p className="text-sm text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.visitors?.unique?.toLocaleString() || '0'}</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.top_pages?.length || '0'}</p>
                <p className="text-sm text-muted-foreground">Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preview & Domain Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {app.is_published && (app.custom_domain || app.subdomain) ? (
            <>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Live Domain</p>
                  <p className="font-medium">{app.custom_domain || app.subdomain}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.open(`https://${app.custom_domain || app.subdomain}`, '_blank')}>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
              {app.custom_domain && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Custom Domain</p>
                    <p className="font-medium">{app.custom_domain}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Connected</Badge>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Preview Mode</p>
                <p className="font-medium">App is in development - use preview to test</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewLive}
                disabled={isGeneratingPreview}
              >
                {isGeneratingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sections Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card 
            key={section.title}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => router.push(section.href)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <section.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
                {section.count !== undefined && (
                  <Badge variant="secondary">{section.count}</Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'App created', target: '', time: formatDate(app.created_at) },
              { action: 'Last updated', target: '', time: formatDate(app.updated_at) },
              { action: app.is_published ? 'Published' : 'Draft saved', target: '', time: formatDate(app.updated_at) },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  {activity.target && (
                    <p className="text-sm text-muted-foreground">{activity.target}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
