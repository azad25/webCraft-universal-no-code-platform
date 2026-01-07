'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Globe,
  MoreVertical,
  Edit3,
  Eye,
  Settings,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

const apps = [
  { id: '1', name: 'My Portfolio', domain: 'portfolio.webcraft.app', status: 'published', views: 1240, updatedAt: '2 hours ago' },
  { id: '2', name: 'Business Site', domain: 'business.webcraft.app', status: 'published', views: 3450, updatedAt: '1 day ago' },
  { id: '3', name: 'Landing Page', domain: 'landing.webcraft.app', status: 'draft', views: 0, updatedAt: '3 days ago' },
  { id: '4', name: 'E-commerce Store', domain: 'store.webcraft.app', status: 'published', views: 8920, updatedAt: '5 hours ago' },
];

export default function AppsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = apps.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Apps</h1>
          <p className="text-muted-foreground">Manage all your websites and applications</p>
        </div>
        <Button onClick={() => router.push('/dashboard/apps/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New App
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((app) => (
          <Card key={app.id} className="hover:border-primary transition-colors cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">{app.domain}</CardDescription>
                  </div>
                </div>
                <Badge variant={app.status === 'published' ? 'default' : 'secondary'}>
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{app.views.toLocaleString()} views</span>
                <span>Updated {app.updatedAt}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" onClick={() => router.push(`/editor/${app.id}`)}>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/apps/${app.id}`)}>
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="ghost" onClick={() => window.open(`https://${app.domain}`, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Card */}
        <Card 
          className="border-dashed cursor-pointer hover:border-primary transition-colors flex items-center justify-center min-h-[200px]"
          onClick={() => router.push('/dashboard/apps/new')}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Create New App</p>
            <p className="text-sm text-muted-foreground">Start from scratch or use a template</p>
          </div>
        </Card>
      </div>

      {filtered.length === 0 && search && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No apps found</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
