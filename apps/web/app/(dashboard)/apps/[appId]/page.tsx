'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const [app] = useState({
    id: appId,
    name: 'My Website',
    description: 'A modern business website built with WebCraft',
    status: 'published',
    domain: 'mywebsite.webcraft.app',
    customDomain: 'www.mywebsite.com',
    createdAt: '2025-12-15',
    updatedAt: '2026-01-06',
    stats: {
      views: 12450,
      visitors: 3280,
      pages: 8,
      automations: 3
    }
  });

  const quickActions = [
    { label: 'Edit Site', icon: Edit3, href: `/editor/${appId}`, primary: true },
    { label: 'View Live', icon: Eye, href: `https://${app.domain}`, external: true },
    { label: 'Settings', icon: Settings, href: `/dashboard/apps/${appId}/settings` },
    { label: 'Analytics', icon: BarChart3, href: `/dashboard/apps/${appId}/analytics` },
  ];

  const sections = [
    {
      title: 'Pages',
      description: 'Manage your site pages and content',
      icon: FileText,
      href: `/dashboard/apps/${appId}/pages`,
      count: app.stats.pages
    },
    {
      title: 'Media Library',
      description: 'Images, videos, and documents',
      icon: Image,
      href: `/dashboard/apps/${appId}/media`,
      count: 24
    },
    {
      title: 'Automations',
      description: 'Set up workflows and triggers',
      icon: Zap,
      href: `/dashboard/apps/${appId}/automations`,
      count: app.stats.automations
    },
    {
      title: 'Data Sources',
      description: 'Connect APIs and web scrapers',
      icon: Database,
      href: `/dashboard/apps/${appId}/data-sources`,
      count: 3
    },
    {
      title: 'Integrations',
      description: 'Connect third-party services',
      icon: Plug,
      href: `/dashboard/apps/${appId}/integrations`,
      count: 5
    },
    {
      title: 'Export',
      description: 'Download or deploy your site',
      icon: Download,
      href: `/dashboard/apps/${appId}/export`
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{app.name}</h1>
            <Badge variant={app.status === 'published' ? 'default' : 'secondary'}>
              {app.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{app.description}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? 'default' : 'outline'}
            onClick={() => action.external 
              ? window.open(action.href, '_blank') 
              : router.push(action.href)
            }
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
                <p className="text-2xl font-bold">{app.stats.views.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{app.stats.visitors.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{app.stats.pages}</p>
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
                <p className="text-2xl font-bold">{app.stats.automations}</p>
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
            Domain Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">WebCraft Domain</p>
              <p className="font-medium">{app.domain}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.open(`https://${app.domain}`, '_blank')}>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </div>
          {app.customDomain && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Custom Domain</p>
                <p className="font-medium">{app.customDomain}</p>
              </div>
              <Badge variant="outline" className="text-green-600">Connected</Badge>
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
              { action: 'Page updated', target: 'Home', time: '2 hours ago' },
              { action: 'Automation triggered', target: 'Welcome Email', time: '5 hours ago' },
              { action: 'Site published', target: '', time: '1 day ago' },
              { action: 'New form submission', target: 'Contact Form', time: '2 days ago' },
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
