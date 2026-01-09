'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  X,
  Folder,
  ChevronRight,
  MoreVertical,
  Download,
  Copy,
  ExternalLink,
  File,
  Music,
  FileSpreadsheet,
  FileCode,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediaApi, MediaItem, MediaFolder, MediaType } from '@/lib/media-api';

type ViewMode = 'grid' | 'list';

interface MediaManagerProps {
  appId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: MediaItem) => void;
  allowMultiple?: boolean;
  acceptTypes?: MediaType[];
}

const getFileIcon = (type: MediaType, mimeType?: string) => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'embed': return Youtube;
    case 'code': return FileCode;
    case 'url': return Link;
    case 'document':
      if (mimeType?.includes('pdf')) return FileText;
      if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return FileSpreadsheet;
      if (mimeType?.includes('audio')) return Music;
      return File;
    default: return File;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function MediaManager({
  appId,
  isOpen,
  onClose,
  onSelect,
  allowMultiple = false,
  acceptTypes
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url' | 'embed' | 'code'>('library');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  
  // Upload states
  const [urlInput, setUrlInput] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [codeSnippet, setCodeSnippet] = useState({ name: '', code: '', language: 'javascript' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load media and folders on mount and when appId changes
  useEffect(() => {
    if (isOpen && appId) {
      loadMedia();
      loadFolders();
    }
  }, [isOpen, appId, currentFolder, searchQuery, filterType]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterType !== 'all') params.type = filterType;
      if (currentFolder) params.folder_id = currentFolder;
      if (searchQuery) params.search = searchQuery;
      
      const mediaItems = await mediaApi.listMedia(appId, params);
      setMedia(mediaItems);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const folderItems = await mediaApi.listFolders(appId);
      setFolders(folderItems);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const filteredMedia = media.filter(item => {
    if (acceptTypes && !acceptTypes.includes(item.type)) return false;
    return true; // API already handles filtering
  });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    
    try {
      const fileArray = Array.from(files);
      
      if (fileArray.length === 1) {
        // Single file upload
        const result = await mediaApi.uploadFile(
          fileArray[0], 
          appId, 
          currentFolder || undefined
        );
        
        if (result.success && result.media) {
          setMedia(prev => [result.media!, ...prev]);
        }
      } else {
        // Batch upload
        const results = await mediaApi.uploadBatch(
          fileArray, 
          appId, 
          currentFolder || undefined
        );
        
        const successfulUploads = results
          .filter(r => r.success && r.media)
          .map(r => r.media!);
        
        setMedia(prev => [...successfulUploads, ...prev]);
      }
      
      setActiveTab('library');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [appId, currentFolder]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleAddUrl = async () => {
    if (!urlInput) return;
    setUploading(true);
    
    try {
      const result = await mediaApi.addUrlMedia({
        app_id: appId,
        url: urlInput,
        folder_id: currentFolder || undefined
      });
      
      if (result.success && result.media) {
        setMedia(prev => [result.media!, ...prev]);
        setUrlInput('');
        setActiveTab('library');
      }
    } catch (error) {
      console.error('Failed to add URL:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddEmbed = async () => {
    if (!embedUrl) return;
    setUploading(true);
    
    try {
      const result = await mediaApi.addEmbed({
        url: embedUrl,
        app_id: appId,
        folder_id: currentFolder || undefined
      });
      
      if (result.success && result.media) {
        setMedia(prev => [result.media!, ...prev]);
        setEmbedUrl('');
        setActiveTab('library');
      }
    } catch (error) {
      console.error('Failed to add embed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddCode = async () => {
    if (!codeSnippet.name || !codeSnippet.code) return;
    setUploading(true);
    
    try {
      const result = await mediaApi.addCodeSnippet({
        app_id: appId,
        name: codeSnippet.name,
        code: codeSnippet.code,
        language: codeSnippet.language,
        folder_id: currentFolder || undefined
      });
      
      if (result.success && result.media) {
        setMedia(prev => [result.media!, ...prev]);
        setCodeSnippet({ name: '', code: '', language: 'javascript' });
        setActiveTab('library');
      }
    } catch (error) {
      console.error('Failed to add code snippet:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (allowMultiple) {
      setSelectedItems(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedItems([id]);
    }
  };

  const handleInsert = () => {
    const selected = media.filter(m => selectedItems.includes(m.id));
    if (selected.length > 0 && onSelect) {
      onSelect(selected[0]);
      onClose();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mediaApi.deleteMedia(id);
      setMedia(prev => prev.filter(m => m.id !== id));
      setSelectedItems(prev => prev.filter(i => i !== id));
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r bg-muted/30 p-3 space-y-1">
            <Button
              variant={activeTab === 'library' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('library')}
            >
              <Grid className="w-4 h-4 mr-2" />
              Library
            </Button>
            <Button
              variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              variant={activeTab === 'url' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('url')}
            >
              <Link className="w-4 h-4 mr-2" />
              From URL
            </Button>
            <Button
              variant={activeTab === 'embed' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('embed')}
            >
              <Youtube className="w-4 h-4 mr-2" />
              Embed
            </Button>
            <Button
              variant={activeTab === 'code' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('code')}
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </Button>

            <div className="pt-4 border-t mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Folders</p>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setCurrentFolder(null)}>
                <Folder className="w-3 h-3 mr-2" />
                All Files
              </Button>
              {folders.map(folder => (
                <Button
                  key={folder.id}
                  variant={currentFolder === folder.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <Folder className="w-3 h-3 mr-2" />
                  {folder.name}
                </Button>
              ))}
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground">
                <FolderPlus className="w-3 h-3 mr-2" />
                New Folder
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'library' && (
              <>
                {/* Toolbar */}
                <div className="p-3 border-b flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger className="w-32 h-9">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="embed">Embeds</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
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
                </div>

                {/* Media Grid/List */}
                <ScrollArea className="flex-1 p-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-3">
                      {filteredMedia.map(item => {
                        const Icon = getFileIcon(item.type, item.mime_type);
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
                            {item.thumbnail_url ? (
                              <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
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
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}>
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredMedia.map(item => {
                        const Icon = getFileIcon(item.type, item.mime_type);
                        const isSelected = selectedItems.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-muted"
                            )}
                            onClick={() => toggleSelect(item.id)}
                          >
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                              {item.thumbnail_url ? (
                                <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(item.size)} • {item.type}</p>
                            </div>
                            {isSelected && <Check className="w-5 h-5 text-primary" />}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}

            {activeTab === 'upload' && (
              <div className="flex-1 p-6">
                <div
                  ref={dropZoneRef}
                  className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors hover:border-primary hover:bg-primary/5"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-lg font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-lg font-medium">Drop files here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Select Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports: Images, Videos, PDFs, Documents, Spreadsheets
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
                <Link className="w-12 h-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Add from URL</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Enter a direct URL to an image, video, or file
                </p>
                <div className="w-full max-w-md space-y-3">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleAddUrl} disabled={!urlInput || uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link className="w-4 h-4 mr-2" />}
                    Add URL
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
                <Youtube className="w-12 h-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Embed Video</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Paste a YouTube, Vimeo, or Google Drive link
                </p>
                <div className="w-full max-w-md space-y-3">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                  />
                  <Button className="w-full" onClick={handleAddEmbed} disabled={!embedUrl || uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Youtube className="w-4 h-4 mr-2" />}
                    Add Embed
                  </Button>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>✓ YouTube</span>
                  <span>✓ Vimeo</span>
                  <span>✓ Google Drive</span>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="flex-1 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Snippet Name</Label>
                    <Input
                      placeholder="My Code Snippet"
                      value={codeSnippet.name}
                      onChange={(e) => setCodeSnippet(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Language</Label>
                    <Select value={codeSnippet.language} onValueChange={(v) => setCodeSnippet(prev => ({ ...prev, language: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="sql">SQL</SelectItem>
                        <SelectItem value="bash">Bash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Code</Label>
                  <textarea
                    className="w-full h-64 p-3 font-mono text-sm border rounded-md bg-muted resize-none"
                    placeholder="// Paste your code here..."
                    value={codeSnippet.code}
                    onChange={(e) => setCodeSnippet(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddCode} disabled={!codeSnippet.name || !codeSnippet.code || uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Code className="w-4 h-4 mr-2" />}
                  Save Snippet
                </Button>
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedItems.length === 1 && activeTab === 'library' && (
            <div className="w-64 border-l p-4 space-y-4">
              {(() => {
                const item = media.find(m => m.id === selectedItems[0]);
                if (!item) return null;
                const Icon = getFileIcon(item.type, item.mime_type);
                return (
                  <>
                    <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Name</Label>
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="capitalize">{item.type}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <p>{formatFileSize(item.size)}</p>
                      </div>
                      {item.width && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Dimensions</Label>
                          <p>{item.width} × {item.height}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Alt Text</Label>
                      <Input
                        placeholder="Describe this image..."
                        value={item.alt_text || ''}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy URL
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedItems.length} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleInsert} disabled={selectedItems.length === 0}>
                Insert Selected
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
