'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Image, 
  FileImage, 
  X, 
  Check, 
  Loader2, 
  Link, 
  Search,
  Grid,
  List,
  Filter,
  Download,
  Trash2,
  Eye,
  Copy
} from 'lucide-react'

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface MediaUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  accept?: string
  multiple?: boolean
}

interface MediaFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: string
  tags: string[]
}

// Mock media library data
const MOCK_MEDIA: MediaFile[] = [
  {
    id: '1',
    name: 'hero-bg.jpg',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
    type: 'image/jpeg',
    size: 245760,
    createdAt: '2024-01-15',
    tags: ['hero', 'background', 'business']
  },
  {
    id: '2',
    name: 'team-photo.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    type: 'image/jpeg',
    size: 189440,
    createdAt: '2024-01-14',
    tags: ['team', 'people', 'office']
  },
  {
    id: '3',
    name: 'product-1.jpg',
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    type: 'image/jpeg',
    size: 156672,
    createdAt: '2024-01-13',
    tags: ['product', 'technology', 'gadget']
  },
  {
    id: '4',
    name: 'office-space.jpg',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    type: 'image/jpeg',
    size: 298752,
    createdAt: '2024-01-12',
    tags: ['office', 'workspace', 'modern']
  },
  {
    id: '5',
    name: 'logo-icon.svg',
    url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200',
    type: 'image/svg+xml',
    size: 4096,
    createdAt: '2024-01-11',
    tags: ['logo', 'icon', 'brand']
  }
]

// Unsplash integration for stock photos
const UNSPLASH_CATEGORIES = [
  'business', 'technology', 'people', 'nature', 'architecture', 
  'food', 'travel', 'fashion', 'art', 'sports'
]

export function MediaUpload({ open, onOpenChange, onSelect, accept = 'image/*', multiple = false }: MediaUploadProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(MOCK_MEDIA)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [unsplashImages, setUnsplashImages] = useState<any[]>([])
  const [loadingUnsplash, setLoadingUnsplash] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter media files
  const filteredMedia = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || file.tags.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress)
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Create mock uploaded file
        const newFile: MediaFile = {
          id: Date.now().toString() + i,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
          createdAt: new Date().toISOString().split('T')[0],
          tags: ['uploaded']
        }

        setMediaFiles(prev => [newFile, ...prev])
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Search Unsplash
  const searchUnsplash = useCallback(async (query: string) => {
    if (!query) return

    setLoadingUnsplash(true)
    try {
      // Mock Unsplash API response
      const mockResults = [
        {
          id: 'unsplash-1',
          urls: { regular: `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=${query}` },
          alt_description: `${query} image`,
          user: { name: 'Unsplash User' }
        },
        {
          id: 'unsplash-2',
          urls: { regular: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=${query}` },
          alt_description: `${query} photo`,
          user: { name: 'Stock Photographer' }
        },
        {
          id: 'unsplash-3',
          urls: { regular: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=${query}` },
          alt_description: `${query} stock photo`,
          user: { name: 'Creative Commons' }
        }
      ]
      setUnsplashImages(mockResults)
    } catch (error) {
      console.error('Unsplash search failed:', error)
    } finally {
      setLoadingUnsplash(false)
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Upload images, browse your media library, or search stock photos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="stock">Stock Photos</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1">
            <div className="h-full flex flex-col">
              <div
                className={cn(
                  "flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 transition-colors",
                  uploading ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />

                {uploading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Uploading...</p>
                    <div className="w-64 bg-muted rounded-full h-2 mb-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload Images</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop images here, or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <FileImage className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports JPG, PNG, SVG, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col">
            {/* Library Controls */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {UNSPLASH_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Grid/List */}
            <ScrollArea className="flex-1">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-4 gap-4 p-1">
                  {filteredMedia.map((file) => (
                    <motion.div
                      key={file.id}
                      layout
                      className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                      onClick={() => onSelect(file.url)}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <Button size="sm" variant="secondary">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">{file.name}</p>
                        <p className="text-white/70 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMedia.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => onSelect(file.url)}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.createdAt}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {file.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Stock Photos Tab */}
          <TabsContent value="stock" className="flex-1 flex flex-col">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search stock photos..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchUnsplash(e.currentTarget.value)
                  }
                }}
              />
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Search stock photos..."]') as HTMLInputElement
                  if (input) searchUnsplash(input.value)
                }}
                disabled={loadingUnsplash}
              >
                {loadingUnsplash ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="grid grid-cols-3 gap-4">
                {unsplashImages.map((image) => (
                  <motion.div
                    key={image.id}
                    className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                    onClick={() => onSelect(image.urls.regular)}
                  >
                    <img
                      src={image.urls.regular}
                      alt={image.alt_description}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                        <Check className="w-4 h-4 mr-2" />
                        Select
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs">by {image.user.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="flex-1">
            <div className="space-y-4">
              <div>
                <Label>Image URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    id="image-url-input"
                  />
                  <Button 
                    onClick={() => {
                      const input = document.getElementById('image-url-input') as HTMLInputElement
                      if (input?.value) {
                        onSelect(input.value)
                      }
                    }}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Use URL
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Enter a direct link to an image file. Supported formats: JPG, PNG, SVG, WebP, GIF</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}