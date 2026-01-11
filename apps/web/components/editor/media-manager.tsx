'use client'

import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from \'framer-motion\'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Search,
  Grid3X3,
  List,
  Filter,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  Folder,
  FolderOpen,
  Star,
  Clock,
  Eye,
  Edit,
  Link,
  Palette,
  Crop,
  RotateCw,
  Maximize2,
  X,
  Check,
  Loader2,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react'

import { mediaApi, MediaItem, MediaFolder, MediaType } from '@/lib/media-api'

interface MediaManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
  selectedType?: MediaType | 'all'
  multiple?: boolean
  maxSize?: number // in MB
  trigger?: React.ReactNode
  appId: string
}

export function MediaManager({
  isOpen,
  onClose,
  onSelect,
  selectedType = 'all',
  multiple = false,
  maxSize = 10,
  trigger,
  appId
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'unsplash' | 'gradients' | 'patterns' | 'colors' | 'url'>('library')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(false)

  // Load media and folders when component opens
  useEffect(() => {
    if (isOpen && appId) {
      loadMedia()
      loadFolders()
    }
  }, [isOpen, appId, selectedFolder, searchQuery, selectedType])

  const loadMedia = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (selectedType !== 'all') params.type = selectedType
      if (selectedFolder !== 'all') params.folder_id = selectedFolder
      if (searchQuery) params.search = searchQuery
      
      const mediaItems = await mediaApi.listMedia(appId, params)
      setMedia(mediaItems)
    } catch (error) {
      console.error('Failed to load media:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      const folderItems = await mediaApi.listFolders(appId)
      setFolders(folderItems)
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    
    try {
      const fileArray = Array.from(files)
      
      // Validate file sizes
      for (const file of fileArray) {
        if (file.size > maxSize * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
          setIsUploading(false)
          return
        }
      }
      
      if (fileArray.length === 1) {
        // Single file upload
        const result = await mediaApi.uploadFile(
          fileArray[0], 
          appId, 
          selectedFolder !== 'all' ? selectedFolder : undefined
        )
        
        if (result.success && result.media) {
          setMedia(prev => [result.media!, ...prev])
          console.log('File uploaded successfully:', result.media)
        } else {
          console.error('Upload failed:', result.error)
          alert(`Upload failed: ${result.error}`)
        }
      } else {
        // Batch upload
        const results = await mediaApi.uploadBatch(
          fileArray, 
          appId, 
          selectedFolder !== 'all' ? selectedFolder : undefined
        )
        
        const successfulUploads = results
          .filter(r => r.success && r.media)
          .map(r => r.media!)
        
        const failedUploads = results.filter(r => !r.success)
        
        if (successfulUploads.length > 0) {
          setMedia(prev => [...successfulUploads, ...prev])
          console.log(`${successfulUploads.length} files uploaded successfully`)
        }
        
        if (failedUploads.length > 0) {
          console.error('Some uploads failed:', failedUploads)
          alert(`${failedUploads.length} files failed to upload`)
        }
      }
      
      setActiveTab('library')
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }, [appId, selectedFolder, maxSize])

  // Handle item selection
  const handleItemSelect = useCallback((item: MediaItem) => {
    if (multiple) {
      setSelectedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      )
    } else {
      onSelect(item)
      onClose()
    }
  }, [multiple, onSelect, onClose])

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await mediaApi.deleteMedia(id)
      setMedia(prev => prev.filter(m => m.id !== id))
      setSelectedItems(prev => prev.filter(i => i !== id))
    } catch (error) {
      console.error('Failed to delete media:', error)
    }
  }

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get file icon
  const getFileIcon = (type: MediaType) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'document': return FileText
      case 'code': return FileText
      case 'url': return Link
      case 'embed': return Video
      default: return FileText
    }
  }

  // Render media item
  const renderMediaItem = (item: MediaItem) => {
    const isSelected = selectedItems.includes(item.id)
    const Icon = getFileIcon(item.type)

    return (
      <m.div
        key={item.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
          isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50",
          viewMode === 'grid' ? "aspect-square" : "aspect-video"
        )}
        onClick={() => handleItemSelect(item)}
      >
        {/* Media Preview */}
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-white text-xs font-medium truncate">
            {item.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {item.type}
            </Badge>
            <span className="text-white/80 text-xs">
              {formatFileSize(item.size)}
            </span>
          </div>
        </div>
      </m.div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Media Manager
          </DialogTitle>
          <DialogDescription>
            Upload, browse, and manage your media files
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Grid */}
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className={cn(
                  "grid gap-4 p-1",
                  viewMode === 'grid' ? "grid-cols-6" : "grid-cols-4"
                )}>
                  <AnimatePresence>
                    {media.map(item => renderMediaItem(item))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center w-full max-w-md transition-colors hover:border-primary hover:bg-primary/5"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const files = e.dataTransfer.files
                  if (files && files.length > 0) {
                    handleFileSelect(files)
                  }
                }}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Media</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  accept={selectedType === 'image' ? 'image/*' : selectedType === 'video' ? 'video/*' : '*/*'}
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild>
                    <span>Choose Files</span>
                  </Button>
                </Label>
              </div>

              {isUploading && (
                <div className="w-full max-w-md">
                  <div className="flex items-center justify-center mb-2">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-sm">Uploading files...</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="flex-1">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Link className="w-12 h-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Add from URL</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Enter a direct URL to an image, video, or file
              </p>
              <div className="w-full max-w-md space-y-3">
                <Input
                  placeholder="https://example.com/image.jpg"
                  // Add URL handling here
                />
                <Button className="w-full">
                  <Link className="w-4 h-4 mr-2" />
                  Add URL
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {multiple && selectedItems.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedItems([])}>
                Clear Selection
              </Button>
              <Button onClick={() => {
                // Handle multiple selection
                const selected = media.filter(m => selectedItems.includes(m.id))
                if (selected.length > 0) {
                  onSelect(selected[0]) // For now, just select the first one
                }
                onClose()
              }}>
                Use Selected
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}