'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Info
} from 'lucide-react'

interface MediaItem {
  id: string
  name: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  width?: number
  height?: number
  createdAt: string
  tags: string[]
  folder?: string
  thumbnail?: string
}

interface MediaManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
  selectedType?: 'image' | 'video' | 'audio' | 'document' | 'all'
  multiple?: boolean
  maxSize?: number // in MB
}

// Mock data - replace with actual API calls
const MOCK_MEDIA: MediaItem[] = [
  {
    id: '1',
    name: 'hero-image.jpg',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    type: 'image',
    size: 1024000,
    width: 1920,
    height: 1080,
    createdAt: '2024-01-15T10:30:00Z',
    tags: ['hero', 'business', 'office'],
    folder: 'heroes',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200'
  },
  {
    id: '2',
    name: 'team-photo.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    type: 'image',
    size: 856000,
    width: 1600,
    height: 900,
    createdAt: '2024-01-14T15:45:00Z',
    tags: ['team', 'people', 'collaboration'],
    folder: 'team',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200'
  },
  {
    id: '3',
    name: 'product-demo.mp4',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    type: 'video',
    size: 1048576,
    width: 1280,
    height: 720,
    createdAt: '2024-01-13T09:20:00Z',
    tags: ['demo', 'product', 'video'],
    folder: 'videos'
  },
  {
    id: '4',
    name: 'background-pattern.svg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTVlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4K',
    type: 'image',
    size: 2048,
    createdAt: '2024-01-12T14:10:00Z',
    tags: ['pattern', 'background', 'svg'],
    folder: 'patterns'
  }
]

const UNSPLASH_CATEGORIES = [
  'business', 'technology', 'nature', 'people', 'architecture', 'food',
  'travel', 'abstract', 'animals', 'sports', 'fashion', 'health'
]

const GRADIENT_PRESETS = [
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Fresh Mint', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Warm Flame', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Night Sky', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Golden Hour', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Cool Blues', value: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' }
]

export function MediaManager({
  isOpen,
  onClose,
  onSelect,
  selectedType = 'all',
  multiple = false,
  maxSize = 10
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'unsplash' | 'gradients' | 'patterns'>('library')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashImages, setUnsplashImages] = useState<any[]>([])
  const [isLoadingUnsplash, setIsLoadingUnsplash] = useState(false)

  // Filter media items
  const filteredMedia = MOCK_MEDIA.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFolder = selectedFolder === 'all' || item.folder === selectedFolder
    
    return matchesType && matchesSearch && matchesFolder
  })

  // Get unique folders
  const folders = Array.from(new Set(MOCK_MEDIA.map(item => item.folder).filter(Boolean)))

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    setIsUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
        continue
      }

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    setIsUploading(false)
    setUploadProgress(0)
  }, [maxSize])

  // Search Unsplash images
  const searchUnsplash = useCallback(async (query: string) => {
    if (!query.trim()) return

    setIsLoadingUnsplash(true)
    try {
      // Mock Unsplash API response
      const mockResults = Array.from({ length: 12 }, (_, i) => ({
        id: `unsplash-${i}`,
        urls: {
          small: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=300&fit=crop`,
          regular: `https://images.unsplash.com/photo-${1500000000000 + i}?w=800&h=600&fit=crop`,
          full: `https://images.unsplash.com/photo-${1500000000000 + i}?w=1920&h=1080&fit=crop`
        },
        alt_description: `${query} image ${i + 1}`,
        user: {
          name: `Photographer ${i + 1}`,
          username: `user${i + 1}`
        }
      }))
      
      setUnsplashImages(mockResults)
    } catch (error) {
      console.error('Failed to search Unsplash:', error)
    } finally {
      setIsLoadingUnsplash(false)
    }
  }, [])

  // Handle item selection
  const handleItemSelect = useCallback((item: MediaItem | any) => {
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Render media item
  const renderMediaItem = (item: MediaItem, isUnsplash = false) => {
    const isSelected = selectedItems.includes(item.id)
    const imageUrl = isUnsplash ? item.urls?.small : (item.thumbnail || item.url)

    return (
      <motion.div
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
        onClick={() => handleItemSelect(isUnsplash ? {
          id: item.id,
          name: item.alt_description || 'Unsplash Image',
          url: item.urls?.regular || item.urls?.full,
          type: 'image' as const,
          size: 0,
          createdAt: new Date().toISOString(),
          tags: ['unsplash'],
          thumbnail: item.urls?.small
        } : item)}
      >
        {/* Media Preview */}
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {item.type === 'image' || isUnsplash ? (
            <img
              src={imageUrl}
              alt={isUnsplash ? item.alt_description : item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : item.type === 'video' ? (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <Video className="w-12 h-12 text-white" />
            </div>
          ) : item.type === 'audio' ? (
            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
              <Music className="w-12 h-12 text-purple-600" />
            </div>
          ) : (
            <div className="w-full h-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
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
            {isUnsplash ? item.alt_description : item.name}
          </p>
          {!isUnsplash && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
              <span className="text-white/80 text-xs">
                {formatFileSize(item.size)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="unsplash">Unsplash</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mdescription}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white rounded-full p-2">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        by {image.user.name}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Discover Stock Images</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Search for high-quality images or browse collections
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {UNSPLASH_COLLECTIONS.slice(0, 4).map((collection) => (
                        <Button
                          key={collection.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleCollectionSelect(collection)}
                        >
                          {collection.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Gradients Tab */}
        <TabsContent value="gradients" className="flex-1 mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Gradient Presets</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {GRADIENT_PRESETS.map((gradient) => (
                  <motion.div
                    key={gradient.name}
                    className="group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGradientSelect(gradient)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden relative border">
                      <div 
                        className="w-full h-full"
                        style={{ background: gradient.value }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white rounded-full p-2">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium mt-2 text-center">{gradient.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Custom Gradient Builder */}
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Custom Gradient</Label>
              <div className="space-y-3">
                <Input
                  placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  value={selectedGradient}
                  onChange={(e) => setSelectedGradient(e.target.value)}
                />
                <div className="flex gap-2">
                  <div 
                    className="flex-1 h-12 rounded border"
                    style={{ background: selectedGradient || '#f3f4f6' }}
                  />
                  <Button 
                    onClick={() => handleGradientSelect({ name: 'Custom', value: selectedGradient })}
                    disabled={!selectedGradient.trim()}
                  >
                    Use Gradient
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="flex-1 mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Color Presets</Label>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <motion.button
                    key={color}
                    className="aspect-square rounded-lg border-2 border-transparent hover:border-primary transition-colors relative"
                    style={{ backgroundColor: color }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorSelect(color)}
                  >
                    {color === '#ffffff' && (
                      <div className="absolute inset-0 border border-gray-200 rounded-lg" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Color Picker */}
            <div className="border rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Custom Color</Label>
              <div className="flex gap-3 items-center">
                <div className="relative">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-12 rounded border cursor-pointer"
                  />
                </div>
                <Input
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                <Button onClick={() => handleColorSelect(selectedColor)}>
                  Use Color
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        {content}
      </Dialog>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Image className="w-4 h-4" />
            Select Media
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4">
          <h4 className="font-semibold mb-4">Select Media</h4>
          {/* Simplified version for popover */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="mt-4">
              <div className="space-y-3">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter image URL..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit()
                    }
                  }}
                />
                <Button onClick={handleUrlSubmit} className="w-full" disabled={!urlInput.trim()}>
                  Use URL
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <Button 
                onClick={() => {
                  onClose?.()
                  // Open full media manager
                }}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Open Media Manager
              </Button>
            </TabsContent>
            
            <TabsContent value="colors" className="mt-4">
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PRESETS.slice(0, 18).map((color) => (
                  <button
                    key={color}
                    className="aspect-square rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  )
}edia..."
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
                      <SelectItem key={folder} value={folder}>
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          {folder}
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
              <div className={cn(
                "grid gap-4 p-1",
                viewMode === 'grid' ? "grid-cols-6" : "grid-cols-4"
              )}>
                <AnimatePresence>
                  {filteredMedia.map(item => renderMediaItem(item))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1">
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center w-full max-w-md">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Media</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  accept={selectedType === 'image' ? 'image/*' : selectedType === 'video' ? 'video/*' : '*/*'}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Unsplash Tab */}
          <TabsContent value="unsplash" className="flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Unsplash..."
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(unsplashQuery)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => searchUnsplash(unsplashQuery)} disabled={isLoadingUnsplash}>
                {isLoadingUnsplash ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Category shortcuts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {UNSPLASH_CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUnsplashQuery(category)
                    searchUnsplash(category)
                  }}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="grid grid-cols-4 gap-4 p-1">
                <AnimatePresence>
                  {unsplashImages.map(item => renderMediaItem(item, true))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gradients Tab */}
          <TabsContent value="gradients" className="flex-1">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-4 gap-4 p-1">
                {GRADIENT_PRESETS.map((gradient, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-square rounded-lg cursor-pointer border-2 border-transparent hover:border-primary/50 overflow-hidden"
                    style={{ background: gradient.value }}
                    onClick={() => onSelect({
                      id: `gradient-${index}`,
                      name: gradient.name,
                      url: gradient.value,
                      type: 'image' as const,
                      size: 0,
                      createdAt: new Date().toISOString(),
                      tags: ['gradient', 'background']
                    })}
                  >
                    <div className="w-full h-full flex items-end p-3">
                      <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        {gradient.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="flex-1">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Palette className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pattern Library</h3>
                <p>Coming soon - SVG patterns and textures</p>
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