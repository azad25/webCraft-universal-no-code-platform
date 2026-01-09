'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Image,
  Video,
  FileText,
  Music,
  Archive,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Download,
  Share,
  Eye,
  Plus,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Star,
  Clock,
  HardDrive
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const MEDIA_STATS = [
  { label: 'Total Files', value: '1,247', icon: Archive, color: 'bg-blue-500' },
  { label: 'Storage Used', value: '2.4 GB', icon: HardDrive, color: 'bg-green-500' },
  { label: 'Images', value: '892', icon: Image, color: 'bg-purple-500' },
  { label: 'Videos', value: '45', icon: Video, color: 'bg-orange-500' }
]

const FOLDERS = [
  { id: 1, name: 'Product Images', files: 156, size: '245 MB', icon: FolderOpen },
  { id: 2, name: 'Marketing Assets', files: 89, size: '1.2 GB', icon: FolderOpen },
  { id: 3, name: 'User Uploads', files: 234, size: '456 MB', icon: FolderOpen },
  { id: 4, name: 'Documents', files: 67, size: '89 MB', icon: FolderOpen }
]

const RECENT_FILES = [
  {
    id: 1,
    name: 'hero-banner.jpg',
    type: 'image',
    size: '2.4 MB',
    uploaded: '2 hours ago',
    thumbnail: '/api/placeholder/150/100'
  },
  {
    id: 2,
    name: 'product-demo.mp4',
    type: 'video',
    size: '45.2 MB',
    uploaded: '5 hours ago',
    thumbnail: '/api/placeholder/150/100'
  },
  {
    id: 3,
    name: 'brand-guidelines.pdf',
    type: 'document',
    size: '1.8 MB',
    uploaded: '1 day ago',
    thumbnail: null
  },
  {
    id: 4,
    name: 'background-music.mp3',
    type: 'audio',
    size: '5.6 MB',
    uploaded: '2 days ago',
    thumbnail: null
  }
]

const FILE_TYPES = [
  { type: 'image', icon: Image, color: 'text-blue-500' },
  { type: 'video', icon: Video, color: 'text-purple-500' },
  { type: 'document', icon: FileText, color: 'text-green-500' },
  { type: 'audio', icon: Music, color: 'text-orange-500' }
]

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getFileIcon = (type: string) => {
    const fileType = FILE_TYPES.find(ft => ft.type === type)
    if (!fileType) return FileText
    return fileType.icon
  }

  const getFileColor = (type: string) => {
    const fileType = FILE_TYPES.find(ft => ft.type === type)
    return fileType?.color || 'text-gray-500'
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-2">
            Manage your images, videos, documents, and other media files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MEDIA_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 h-12">
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Folders */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {FOLDERS.map((folder) => {
                const Icon = folder.icon
                return (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-8 h-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{folder.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {folder.files} files • {folder.size}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent Files */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Files</h3>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {RECENT_FILES.map((file) => {
                  const Icon = getFileIcon(file.type)
                  const colorClass = getFileColor(file.type)
                  return (
                    <Card key={file.id} className="hover:shadow-md transition-shadow group">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                          {file.thumbnail ? (
                            <img
                              src={file.thumbnail}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon className={`w-12 h-12 ${colorClass}`} />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="secondary">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Star className="w-4 h-4 mr-2" />
                                  Favorite
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm truncate">{file.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {file.size} • {file.uploaded}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {RECENT_FILES.map((file) => {
                  const Icon = getFileIcon(file.type)
                  const colorClass = getFileColor(file.type)
                  return (
                    <Card key={file.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Icon className={`w-5 h-5 ${colorClass}`} />
                            </div>
                            <div>
                              <h4 className="font-medium">{file.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {file.size} • {file.uploaded}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Star className="w-4 h-4 mr-2" />
                                  Favorite
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Images</h3>
            <p className="text-muted-foreground">Your image files will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Videos</h3>
            <p className="text-muted-foreground">Your video files will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Documents</h3>
            <p className="text-muted-foreground">Your document files will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="folders">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FOLDERS.map((folder) => {
              const Icon = folder.icon
              return (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Icon className="w-12 h-12 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{folder.name}</h4>
                        <p className="text-muted-foreground">
                          {folder.files} files • {folder.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{folder.files} files</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}