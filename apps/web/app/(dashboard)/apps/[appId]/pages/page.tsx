'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGetPagesQuery } from '@/store/api/apiSlice';
import { Loader2 } from 'lucide-react';
import {
  Plus,
  Search,
  FileText,
  Home,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';

export default function AppPagesPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const [search, setSearch] = useState('');

  const { data: pagesData, isLoading, error } = useGetPagesQuery(appId);
  const pages = pagesData?.pages || [];

  const filtered = pages.filter((p: any) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const handleEditPage = (pageId: string) => {
    router.push(`/editor/${appId}?page=${pageId}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Failed to load pages</h3>
          <p className="text-muted-foreground">There was an error loading the pages for this app.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">Manage your site pages</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search pages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((page: any) => (
          <Card key={page.id} className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="p-2 bg-muted rounded-lg">
                  {page.is_homepage ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{page.title}</h3>
                    {page.is_homepage && <Badge variant="secondary">Home</Badge>}
                    <Badge variant={page.is_published ? 'default' : 'outline'}>
                      {page.is_published ? (
                        <><Eye className="w-3 h-3 mr-1" /> Published</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">/{page.slug}</p>
                </div>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Updated {formatDate(page.updated_at)}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPage(page.id)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={page.is_homepage}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No pages found</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Try a different search term' : 'Create your first page to get started'}
          </p>
          {!search && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Page
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
