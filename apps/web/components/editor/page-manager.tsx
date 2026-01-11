'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Home,
  Eye,
  EyeOff,
  MoreVertical,
  FileText,
  Settings,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient } from '@/lib/api-client'
import { useEditor } from '@/contexts/editor-context'

interface Page {
  id: string
  title: string
  slug: string
  is_homepage: boolean
  is_published: boolean
  updated_at: string
}

interface PageManagerProps {
  appId: string
}

export function PageManager({ appId }: PageManagerProps) {
  const { 
    pages, 
    currentPageId, 
    currentPage,
    switchToPage, 
    createPage, 
    updatePageInfo, 
    deletePage 
  } = useEditor()
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingPage, setEditingPage] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    is_homepage: false,
    is_published: true
  })

  const handleCreatePage = async () => {
    try {
      await createPage({
        ...formData,
        content: { elements: [] }
      })
      
      setShowCreateDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to create page:', error)
      alert(error.data?.detail || 'Failed to create page')
    }
  }

  const handleUpdatePage = async () => {
    if (!editingPage) return
    
    try {
      await updatePageInfo(editingPage.id, formData)
      
      setShowEditDialog(false)
      setEditingPage(null)
      resetForm()
    } catch (error: any) {
      console.error('Failed to update page:', error)
      alert(error.data?.detail || 'Failed to update page')
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return
    
    try {
      await deletePage(pageId)
    } catch (error: any) {
      console.error('Failed to delete page:', error)
      alert(error.data?.detail || 'Failed to delete page')
    }
  }

  const handleDuplicatePage = async (page: any) => {
    const newTitle = prompt('Enter title for duplicated page:', `${page.title} (Copy)`)
    const newSlug = prompt('Enter slug for duplicated page:', `${page.slug}-copy`)
    
    if (!newTitle || !newSlug) return
    
    try {
      // First get the page content
      const pageResponse = await apiClient.get(`/api/apps/${appId}/pages/${page.id}`)
      const pageContent = pageResponse.data.content
      
      // Create new page with same content
      await createPage({
        title: newTitle,
        slug: newSlug,
        content: pageContent,
        meta_title: newTitle,
        meta_description: pageResponse.data.meta_description,
        is_homepage: false,
        is_published: false
      })
    } catch (error: any) {
      console.error('Failed to duplicate page:', error)
      alert(error.response?.data?.detail || 'Failed to duplicate page')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      is_homepage: false,
      is_published: true
    })
  }

  const openEditDialog = (page: any) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      slug: page.slug,
      meta_title: page.title,
      meta_description: '',
      is_homepage: page.is_homepage,
      is_published: page.is_published
    })
    setShowEditDialog(true)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Show loading state if pages are not loaded yet
  if (!pages || pages.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pages Found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first page to get started.
          </p>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Page
              </Button>
            </DialogTrigger>
            {/* Dialog content same as above */}
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pages</h3>
          <p className="text-sm text-muted-foreground">
            Manage your app pages
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to your app
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setFormData({
                      ...formData,
                      title,
                      slug: generateSlug(title),
                      meta_title: title
                    })
                  }}
                  placeholder="About Us"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="about-us"
                />
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_homepage"
                  checked={formData.is_homepage}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_homepage: checked })}
                />
                <Label htmlFor="is_homepage">Set as homepage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage}>
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <Card
            key={page.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              currentPageId === page.id ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
            onClick={() => switchToPage(page.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{page.title}</span>
                      {page.is_homepage && (
                        <Badge variant="secondary" className="text-xs">
                          <Home className="w-3 h-3 mr-1" />
                          Home
                        </Badge>
                      )}
                      {!page.is_published && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(page)
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicatePage(page)
                    }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!page.is_homepage && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePage(page.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update page settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_title">Page Title</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_slug">URL Slug</Label>
              <Input
                id="edit_slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_meta_description">Meta Description</Label>
              <Textarea
                id="edit_meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_homepage"
                checked={formData.is_homepage}
                onCheckedChange={(checked) => setFormData({ ...formData, is_homepage: checked })}
              />
              <Label htmlFor="edit_is_homepage">Set as homepage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="edit_is_published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePage}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}