'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getAuthToken } from '@/lib/dev-auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  Upload,
  Image,
  Video,
  FileText,
  Music,
  Archive,
  MoreHorizontal,
  Trash2,
  Download,
  Copy,
  Eye,
  Search,
  Filter,
  Grid3X3,
  List,
  FolderPlus,
  Folder,
  Check,
  Loader2
} from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  folder?: string
  alt?: string
  description?: string
}

interface MediaManagerProps {
  isOpen?: boolean
  onClose?: () => void
  onSelect?: (file: MediaFile) => void
  allowMultiple?: boolean
  acceptedTypes?: string[]
  maxFileSize?: number
  appId?: string
}

export function MediaManager({
  isOpen = false,
  onClose,
  onSelect,
  allowMultiple = false,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  appId
}: MediaManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [folders, setFolders] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Load media files
  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentFolder) params.append('folder', currentFolder)
      if (appId) params.append('appId', appId)
      
      const response = await fetch(`/api/media?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Failed to load media files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentFolder, appId])

  useEffect(() => {
    if (isOpen) {
      loadFiles()
    }
  }, [isOpen, loadFiles])

  // File upload handler with progress
  const handleFileUpload = useCallback(async (uploadFiles: FileList | File[]) => {
    const filesToUpload = Array.from(uploadFiles)
    setIsUploading(true)
    
    for (const file of filesToUpload) {
      if (file.size > maxFileSize) {
        console.error(`File ${file.name} is too large`)
        continue
      }
      
      const fileId = `${Date.now()}-${file.name}`
      setUploadingFiles(prev => [...prev, fileId])
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
      
      const formData = new FormData()
      formData.append('file', file)
      if (currentFolder) formData.append('folder', currentFolder)
      if (appId) formData.append('appId', appId)
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId] || 0
            if (current < 90) {
              return { ...prev, [fileId]: current + 10 }
            }
            return prev
          })
        }, 200)
        
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: formData
        })
        
        clearInterval(progressInterval)
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
        
        if (response.ok) {
          const uploadedFile = await response.json()
          setFiles(prev => [uploadedFile, ...prev])
        }
        
        // Clean up progress tracking
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(id => id !== fileId))
          setUploadProgress(prev => {
            const { [fileId]: removed, ...rest } = prev
            return rest
          })
        }, 1000)
        
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        setUploadingFiles(prev => prev.filter(id => id !== fileId))
        setUploadProgress(prev => {
          const { [fileId]: removed, ...rest } = prev
          return rest
        })
      }
    }
    
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [currentFolder, appId, maxFileSize])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles)
    }
  }, [handleFileUpload])

  // File selection handlers
  const handleFileSelect = useCallback((file: MediaFile) => {
    if (allowMultiple) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(file.id)) {
          newSet.delete(file.id)
        } else {
          newSet.add(file.id)
        }
        return newSet
      })
    } else {
      setSelectedFiles(new Set([file.id]))
      if (onSelect) {
        onSelect(file)
        onClose?.()
      }
    }
  }, [allowMultiple, onSelect, onClose])

  // Delete file handler
  const handleDeleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        setSelectedFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
    setDeleteConfirm(null)
  }, [])

  // Create folder handler
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    
    try {
      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: newFolderName,
          parent: currentFolder || null,
          appId
        })
      })
      
      if (response.ok) {
        setFolders(prev => [...prev, newFolderName])
        setNewFolderName('')
        setShowNewFolder(false)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }, [newFolderName, currentFolder, appId])

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedFiles)
    
    for (const fileId of selectedIds) {
      try {
        await fetch(`/api/media/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        })
      } catch (error) {
        console.error(`Failed to delete file ${fileId}:`, error)
      }
    }
    
    setFiles(prev => prev.filter(f => !selectedIds.includes(f.id)))
    setSelectedFiles(new Set())
  }, [selectedFiles])

  const handleBulkMove = useCallback(async (targetFolder: string) => {
    const selectedIds = Array.from(selectedFiles)
    
    for (const fileId of selectedIds) {
      try {
        await fetch(`/api/media/${fileId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ folder: targetFolder })
        })
      } catch (error) {
        console.error(`Failed to move file ${fileId}:`, error)
      }
    }
    
    // Refresh files
    loadFiles()
    setSelectedFiles(new Set())
  }, [selectedFiles, loadFiles])

  // File editing
  const handleEditFile = useCallback(async (file: MediaFile, updates: Partial<MediaFile>) => {
    try {
      const response = await fetch(`/api/media/${file.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedFile = await response.json()
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...updatedFile } : f))
        setEditingFile(null)
      }
    } catch (error) {
      console.error('Failed to update file:', error)
    }
  }, [])

  // Filter and sort files
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || file.type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Get file icon
  const getFileIcon = (file: MediaFile) => {
    switch (file.type) {
      case 'image': return Image
      case 'video': return Video
      case 'audio': return Music
      case 'document': return FileText
      case 'archive': return Archive
      default: return FileText
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Manager</DialogTitle>
          <DialogDescription>
            Upload and manage your media files
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Files
            </Button>

            {/* Create Folder */}
            <Button
              variant="outline"
              onClick={() => setShowNewFolder(true)}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </Button>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MoreHorizontal className="w-4 h-4" />
                    Actions ({selectedFiles.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.map(folder => (
                    <DropdownMenuItem 
                      key={folder}
                      onClick={() => handleBulkMove(folder)}
                    >
                      <Folder className="w-4 h-4 mr-2" />
                      Move to {folder}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
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

          <div className="flex items-center gap-2">
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Sort: {sortBy}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Sort by Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Sort by Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('size')}>
                  Sort by Size
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('type')}>
                  Sort by Type
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {filterType === 'all' ? 'All Files' : filterType}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  All Files
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('image')}>
                  Images
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('video')}>
                  Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('audio')}>
                  Audio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('document')}>
                  Documents
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Breadcrumb */}
        {currentFolder && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentFolder('')}
              className="p-0 h-auto"
            >
              Home
            </Button>
            <span>/</span>
            <span>{currentFolder}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="mb-4 space-y-2">
              {uploadingFiles.map(fileId => (
                <div key={fileId} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Uploading {fileId.split('-').slice(1).join('-')}
                    </span>
                    <span className="text-sm text-blue-700">
                      {uploadProgress[fileId] || 0}%
                    </span>
                  </div>
                  <Progress value={uploadProgress[fileId] || 0} className="h-2" />
                </div>
              ))}
            </div>
          )}

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "h-full border-2 border-dashed border-muted rounded-lg p-4 overflow-y-auto",
              isUploading && "border-primary bg-primary/5"
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Upload className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'Drag and drop files here or click upload to get started'
                  }
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                  : "space-y-2"
              )}>
                {/* Folders */}
                {folders.map(folder => (
                  <div
                    key={folder}
                    className={cn(
                      "group cursor-pointer",
                      viewMode === 'grid' 
                        ? "flex flex-col items-center p-4 border rounded-lg hover:bg-muted"
                        : "flex items-center gap-3 p-2 border rounded-lg hover:bg-muted"
                    )}
                    onClick={() => setCurrentFolder(folder)}
                  >
                    <Folder className="w-8 h-8 text-blue-500" />
                    <span className="text-sm font-medium truncate">{folder}</span>
                  </div>
                ))}

                {/* Files */}
                {filteredFiles.map(file => {
                  const FileIcon = getFileIcon(file)
                  const isSelected = selectedFiles.has(file.id)
                  
                  return (
                    <div
                      key={file.id}
                      className={cn(
                        "group cursor-pointer border rounded-lg transition-all relative",
                        viewMode === 'grid' 
                          ? "flex flex-col p-3"
                          : "flex items-center gap-3 p-3",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => handleFileSelect(file)}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          {/* Grid View */}
                          <div className="relative w-full aspect-square mb-2 bg-muted rounded overflow-hidden">
                            {file.type === 'image' && file.thumbnailUrl ? (
                              <img
                                src={file.thumbnailUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="w-full text-center">
                            <p className="text-sm font-medium truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* List View */}
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            {file.type === 'image' && file.thumbnailUrl ? (
                              <img
                                src={file.thumbnailUrl}
                                alt={file.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <FileIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                            
                            {isSelected && (
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* File Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(file.url, '_blank')
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingFile(file)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(file.url)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                const a = document.createElement('a')
                                a.href = file.url
                                a.download = file.name
                                a.click()
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm(file.id)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {allowMultiple && selectedFiles.size > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => {
                  const selected = files.filter(f => selectedFiles.has(f.id))
                  if (onSelect && selected.length > 0) {
                    selected.forEach(onSelect)
                    onClose?.()
                  }
                }}
              >
                Use Selected ({selectedFiles.size})
              </Button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        {/* New Folder Dialog */}
        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewFolder(false)
                    setNewFolderName('')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDeleteFile(deleteConfirm)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* File Edit Dialog */}
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit File Details</DialogTitle>
              <DialogDescription>
                Update file information and metadata
              </DialogDescription>
            </DialogHeader>
            
            {editingFile && (
              <div className="space-y-6">
                {/* File Preview */}
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {editingFile.type === 'image' && editingFile.thumbnailUrl ? (
                      <img
                        src={editingFile.thumbnailUrl}
                        alt={editingFile.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        {React.createElement(getFileIcon(editingFile), { className: "w-8 h-8 text-muted-foreground" })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="file-name">File Name</Label>
                      <Input
                        id="file-name"
                        defaultValue={editingFile.name}
                        onChange={(e) => {
                          setEditingFile(prev => prev ? { ...prev, name: e.target.value } : null)
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="file-alt">Alt Text</Label>
                      <Input
                        id="file-alt"
                        defaultValue={editingFile.alt || ''}
                        placeholder="Describe this image for accessibility"
                        onChange={(e) => {
                          setEditingFile(prev => prev ? { ...prev, alt: e.target.value } : null)
                        }}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="file-description">Description</Label>
                      <Input
                        id="file-description"
                        defaultValue={editingFile.description || ''}
                        placeholder="Optional description"
                        onChange={(e) => {
                          setEditingFile(prev => prev ? { ...prev, description: e.target.value } : null)
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* File Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">File Size</Label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(editingFile.size)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">File Type</Label>
                    <p className="text-sm text-muted-foreground">{editingFile.mimeType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(editingFile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Modified</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(editingFile.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingFile(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingFile) {
                        handleEditFile(editingFile, {
                          name: editingFile.name,
                          alt: editingFile.alt,
                          description: editingFile.description
                        })
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}