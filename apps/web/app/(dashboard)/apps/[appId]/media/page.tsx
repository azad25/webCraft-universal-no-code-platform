'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image,
  Video,
  FileText,
  Link,
  Code,
  Youtube,
  Upload,
  FolderPlus,
  Grid,
  List,
  Search,
  Filter,
  Trash2,
  Edit3,
  Check,
  Folder,
  MoreVertical,
  Download,
  Copy,
  ExternalLink,
  File,
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MediaType = 'image' | 'video' | 'document' | 'url' | 'code' | 'embed';
type ViewMode = 'grid' | 'list';

interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  tags: string[];
  createdAt: Date;
}

const sampleMedia: MediaItem[] = [
  { id: '1', type: 'image', name: 'hero-banner.jpg', url: '/images/hero.jpg', thumbnailUrl: 'https://picsum.photos/400/300?1', size: 245000, tags: ['hero'], createdAt: new Date() },
  { id: '2', type: 'image', name: 'product-1.png', url: '/images/p1.png', thumbnailUrl: 'https://picsum.photos/400/300?2', size: 180000, tags: ['product'], createdAt: new Date() },
  { id: '3', type: 'image', name: 'team-photo.jpg', url: '/images/team.jpg', thumbnailUrl: 'https://picsum.photos/400/300?3', size: 320000, tags: ['team'], createdAt: new Date() },
  { id: '4', type: 'video', name: 'intro-video.mp4', url: '/videos/intro.mp4', size: 15000000, tags: ['intro'], createdAt: new Date() },
  { id: '5', type: 'document', name: 'terms.pdf', url: '/docs/terms.pdf', mimeType: 'application/pdf', size: 125000, tags: ['legal'], createdAt: new Date() },
  { id: '6', type: 'embed', name: 'Product Demo', url: 'https://youtube.com/watch?v=abc', thumbnailUrl: 'https://picsum.photos/400/300?6', tags: [], createdAt: new Date() },
];

const getFileIcon = (type: MediaType) => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'embed': return Youtube;
    case 'code': return Code;
    case 'url': return Link;
    default: return File;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaPage() {
  const params = useParams();
  const appId = params.appId as string;
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>(sampleMedia);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMedia = media.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const newItems: MediaItem[] = Array.from(files).map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      name: file.name,
      url: URL.createObjectURL(file),
      thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      mimeType: file.type,
      size: file.size,
      tags: [],
      createdAt: new Date()
    }));
    
    setMedia(prev => [...newItems, ...prev]);
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    setMedia(prev => prev.filter(m => !selectedItems.includes(m.id)));
    setSelectedItems([]);
  };

  const stats = {
    total: media.length,
    images: media.filter(m => m.type === 'image').length,
    videos: media.filter(m => m.type === 'video').length,
    documents: media.filter(m => m.type === 'document').length,
    totalSize: media.reduce((acc, m) => acc + (m.size || 0), 0)
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage images, videos, and documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button>
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.images}</p>
            <p className="text-sm text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.videos}</p>
            <p className="text-sm text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.documents}</p>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
            <p className="text-sm text-muted-foreground">Total Size</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="embed">Embeds</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        {selectedItems.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedItems.length})
          </Button>
        )}
      </div>

      {/* Drop Zone */}
      {uploading && (
        <div className="border-2 border-dashed border-primary rounded-xl p-8 text-center bg-primary/5">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
          <p className="font-medium">Uploading files...</p>
        </div>
      )}

      {/* Media Grid */}
      <div
        className="min-h-[400px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMedia.map(item => {
              const Icon = getFileIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/30"
                  )}
                  onClick={() => toggleSelect(item.id)}
                >
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Icon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{item.name}</p>
                    <p className="text-white/70 text-[10px]">{formatFileSize(item.size)}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">
                    {item.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map(item => {
              const Icon = getFileIcon(item.type);
              const isSelected = selectedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  )}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(item.size)} • {item.type}
                    </p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {filteredMedia.length === 0 && !uploading && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No media found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search' : 'Drop files here or click upload'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
