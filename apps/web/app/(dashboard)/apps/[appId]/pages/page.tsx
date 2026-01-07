'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

const initialPages = [
  { id: '1', title: 'Home', path: '/', status: 'published', isHome: true, updatedAt: '2 hours ago' },
  { id: '2', title: 'About Us', path: '/about', status: 'published', isHome: false, updatedAt: '1 day ago' },
  { id: '3', title: 'Services', path: '/services', status: 'published', isHome: false, updatedAt: '3 days ago' },
  { id: '4', title: 'Contact', path: '/contact', status: 'published', isHome: false, updatedAt: '1 week ago' },
  { id: '5', title: 'Blog', path: '/blog', status: 'draft', isHome: false, updatedAt: '2 days ago' },
  { id: '6', title: 'Pricing', path: '/pricing', status: 'published', isHome: false, updatedAt: '5 days ago' },
];

export default function AppPagesPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState(initialPages);

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditPage = (pageId: string) => {
    router.push(`/editor/${appId}?page=${pageId}`);
  };

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
        {filtered.map((page) => (
          <Card key={page.id} className="hover:border-primary transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div className="p-2 bg-muted rounded-lg">
                  {page.isHome ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{page.title}</h3>
                    {page.isHome && <Badge variant="secondary">Home</Badge>}
                    <Badge variant={page.status === 'published' ? 'default' : 'outline'}>
                      {page.status === 'published' ? (
                        <><Eye className="w-3 h-3 mr-1" /> Published</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{page.path}</p>
                </div>
                <p className="text-sm text-muted-foreground hidden md:block">
                  Updated {page.updatedAt}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPage(page.id)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={page.isHome}>
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
