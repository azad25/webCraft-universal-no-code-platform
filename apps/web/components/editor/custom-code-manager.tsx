'use client'

import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { 
  Code, FileText, Palette, Zap, Image, Video, Music, 
  Upload, Download, Trash2, Edit3, Copy, Eye, 
  Plus, Save, X, Check, AlertCircle, ExternalLink,
  FolderOpen, File, Settings, Play, Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getAuthToken } from '@/lib/dev-auth'

interface CustomAsset {
  id: string
  name: string
  type: 'html' | 'css' | 'js' | 'image' | 'video' | 'audio'
  content?: string
  url?: string
  size?: number
  created_at: string
  updated_at: string
  is_global: boolean
  metadata?: {
    width?: number
    height?: number
    duration?: number
    format?: string
  }
}

interface CustomCodeManagerProps {
  appId: string
  currentPageId?: string
  onAddElement?: (element: any) => void
}

export function CustomCodeManager({ appId, currentPageId, onAddElement }: CustomCodeManagerProps) {
  const [activeTab, setActiveTab] = useState('html')
  const [assets, setAssets] = useState<Record<string, CustomAsset[]>>({
    html: [],
    css: [],
    js: [],
    image: [],
    video: [],
    audio: []
  })
  const [loading, setLoading] = useState(false)
  const [editingAsset, setEditingAsset] = useState<CustomAsset | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Load assets on mount
  useEffect(() => {
    loadAssets()
  }, [appId])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/apps/${appId}/assets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const groupedAssets = data.assets.reduce((acc: any, asset: CustomAsset) => {
          if (!acc[asset.type]) acc[asset.type] = []
          acc[asset.type].push(asset)
          return acc
        }, {})
        setAssets(groupedAssets)
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
      // Use mock data for development
      setAssets({
        html: [
          {
            id: 'html-1',
            name: 'Custom Header',
            type: 'html',
            content: '<div class="custom-header"><h1>Welcome</h1></div>',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_global: false
          }
        ],
        css: [
          {
            id: 'css-1',
            name: 'Custom Styles',
            type: 'css',
            content: '.custom-header { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); }',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_global: true
          }
        ],
        js: [],
        image: [],
        video: [],
        audio: []
      })
    } finally {
      setLoading(false)
    }
  }

  const saveAsset = async (asset: Partial<CustomAsset>) => {
    try {
      const token = getAuthToken()
      const method = asset.id ? 'PUT' : 'POST'
      const url = asset.id 
        ? `/api/apps/${appId}/assets/${asset.id}`
        : `/api/apps/${appId}/assets`

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...asset,
          app_id: appId,
          page_id: asset.is_global ? null : currentPageId
        })
      })

      if (response.ok) {
        const savedAsset = await response.json()
        setAssets(prev => {
          const type = savedAsset.type
          const existing = prev[type] || []
          const updated = asset.id 
            ? existing.map(a => a.id === asset.id ? savedAsset : a)
            : [...existing, savedAsset]
          
          return { ...prev, [type]: updated }
        })
        setEditingAsset(null)
        setShowEditor(false)
        return savedAsset
      } else {
        throw new Error('Failed to save asset')
      }
    } catch (error) {
      console.error('Failed to save asset:', error)
      throw error
    }
  }

  const deleteAsset = async (assetId: string, type: string) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/apps/${appId}/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAssets(prev => ({
          ...prev,
          [type]: prev[type].filter(a => a.id !== assetId)
        }))
      }
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const uploadFile = async (file: File, type: 'image' | 'video' | 'audio') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('app_id', appId)
    if (currentPageId) {
      formData.append('page_id', currentPageId)
    }

    try {
      const token = getAuthToken()
      const response = await fetch(`/api/apps/${appId}/assets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const uploadedAsset = await response.json()
        setAssets(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), uploadedAsset]
        }))
        return uploadedAsset
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const uploadId = `${file.name}-${Date.now()}`
      setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))

      try {
        await uploadFile(file, type)
        setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }))
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [uploadId]: _, ...rest } = prev
            return rest
          })
        }, 2000)
      } catch (error) {
        setUploadProgress(prev => {
          const { [uploadId]: _, ...rest } = prev
          return rest
        })
      }
    }
  }

  const addCustomElement = (asset: CustomAsset) => {
    if (!onAddElement || !currentPageId) return

    const elementConfig = {
      type: 'custom-code',
      position: { x: 0, y: 0 },
      size: { 
        width: 1440,
        height: asset.type === 'html' ? 200 : 100
      },
      props: {
        assetId: asset.id,
        assetType: asset.type,
        content: asset.content,
        url: asset.url,
        name: asset.name
      },
      style: {}
    }

    onAddElement(elementConfig)
  }

  const addMediaElement = (asset: CustomAsset) => {
    if (!onAddElement || !currentPageId) return

    const elementConfig = {
      type: asset.type === 'image' ? 'image' : asset.type,
      position: { x: 0, y: 0 },
      size: { 
        width: asset.metadata?.width || 400,
        height: asset.metadata?.height || 300
      },
      props: {
        src: asset.url,
        alt: asset.name,
        assetId: asset.id
      },
      style: {}
    }

    onAddElement(elementConfig)
  }

  const renderCodeTab = (type: 'html' | 'css' | 'js') => {
    const typeAssets = assets[type] || []
    const icon = type === 'html' ? FileText : type === 'css' ? Palette : Zap

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(icon, { className: "w-5 h-5" })}
            <h3 className="font-medium">{type.toUpperCase()} Assets</h3>
            <Badge variant="secondary">{typeAssets.length}</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingAsset({
                id: '',
                name: `New ${type.toUpperCase()} Asset`,
                type,
                content: type === 'html' ? '<div>\n  <!-- Your HTML here -->\n</div>' :
                        type === 'css' ? '/* Your CSS here */\n.custom-class {\n  \n}' :
                        '// Your JavaScript here\nconsole.log("Hello World");',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_global: false
              })
              setShowEditor(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New {type.toUpperCase()}
          </Button>
        </div>

        {/* Assets List */}
        <div className="space-y-2">
          {typeAssets.map((asset) => (
            <Card key={asset.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                      {asset.is_global && (
                        <Badge variant="outline" className="text-xs">Global</Badge>
                      )}
                    </div>
                    
                    {/* Code Preview */}
                    <div className="bg-muted rounded p-2 mb-3">
                      <code className="text-xs text-muted-foreground line-clamp-3">
                        {asset.content?.substring(0, 100)}...
                      </code>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Updated {new Date(asset.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAsset(asset)
                        setShowEditor(true)
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addCustomElement(asset)}
                      disabled={!currentPageId}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAsset(asset.id, type)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {typeAssets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(icon, { className: "w-8 h-8" })}
              </div>
              <p className="text-sm mb-2">No {type.toUpperCase()} assets yet</p>
              <p className="text-xs">Create your first custom {type} asset</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMediaTab = (type: 'image' | 'video' | 'audio') => {
    const typeAssets = assets[type] || []
    const icon = type === 'image' ? Image : type === 'video' ? Video : Music

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(icon, { className: "w-5 h-5" })}
            <h3 className="font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Assets</h3>
            <Badge variant="secondary">{typeAssets.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              id={`upload-${type}`}
              className="hidden"
              accept={
                type === 'image' ? 'image/*' :
                type === 'video' ? 'video/*' :
                'audio/*'
              }
              multiple
              onChange={(e) => handleFileUpload(e, type)}
            />
            <Button
              size="sm"
              onClick={() => document.getElementById(`upload-${type}`)?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.entries(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Assets Grid */}
        <div className="grid grid-cols-2 gap-3">
          {typeAssets.map((asset) => (
            <Card key={asset.id} className="group hover:shadow-md transition-all">
              <CardContent className="p-3">
                {/* Media Preview */}
                <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                  {type === 'image' && asset.url && (
                    <img 
                      src={asset.url} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {type === 'video' && asset.url && (
                    <video 
                      src={asset.url}
                      className="w-full h-full object-cover"
                      controls={false}
                      muted
                    />
                  )}
                  {type === 'audio' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Asset Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                  
                  {asset.metadata && (
                    <div className="text-xs text-muted-foreground">
                      {asset.metadata.width && asset.metadata.height && (
                        <span>{asset.metadata.width}×{asset.metadata.height}</span>
                      )}
                      {asset.metadata.duration && (
                        <span> • {Math.round(asset.metadata.duration)}s</span>
                      )}
                      {asset.size && (
                        <span> • {(asset.size / 1024 / 1024).toFixed(1)}MB</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => window.open(asset.url, '_blank')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => addMediaElement(asset)}
                      disabled={!currentPageId}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => deleteAsset(asset.id, type)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {typeAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              {React.createElement(icon, { className: "w-8 h-8" })}
            </div>
            <p className="text-sm mb-2">No {type} assets yet</p>
            <p className="text-xs">Upload your first {type} file</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold">Custom Assets</h2>
        </div>

        {!currentPageId && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Select a page first</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Choose a page to add custom elements.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="html" className="text-xs">HTML</TabsTrigger>
            <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
            <TabsTrigger value="js" className="text-xs">JS</TabsTrigger>
            <TabsTrigger value="image" className="text-xs">Images</TabsTrigger>
            <TabsTrigger value="video" className="text-xs">Videos</TabsTrigger>
            <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 mt-4">
          <div className="px-4 pb-4">
            <TabsContent value="html" className="mt-0">
              {renderCodeTab('html')}
            </TabsContent>
            <TabsContent value="css" className="mt-0">
              {renderCodeTab('css')}
            </TabsContent>
            <TabsContent value="js" className="mt-0">
              {renderCodeTab('js')}
            </TabsContent>
            <TabsContent value="image" className="mt-0">
              {renderMediaTab('image')}
            </TabsContent>
            <TabsContent value="video" className="mt-0">
              {renderMediaTab('video')}
            </TabsContent>
            <TabsContent value="audio" className="mt-0">
              {renderMediaTab('audio')}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Code Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {editingAsset?.id ? 'Edit' : 'Create'} {editingAsset?.type?.toUpperCase()} Asset
            </DialogTitle>
          </DialogHeader>
          
          {editingAsset && (
            <CodeEditor
              asset={editingAsset}
              onSave={saveAsset}
              onCancel={() => {
                setEditingAsset(null)
                setShowEditor(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Code Editor Component
function CodeEditor({ 
  asset, 
  onSave, 
  onCancel 
}: { 
  asset: CustomAsset
  onSave: (asset: Partial<CustomAsset>) => Promise<CustomAsset>
  onCancel: () => void 
}) {
  const [name, setName] = useState(asset.name)
  const [content, setContent] = useState(asset.content || '')
  const [isGlobal, setIsGlobal] = useState(asset.is_global)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...asset,
        name,
        content,
        is_global: isGlobal
      })
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const getLanguage = () => {
    switch (asset.type) {
      case 'html': return 'html'
      case 'css': return 'css'
      case 'js': return 'javascript'
      default: return 'text'
    }
  }

  return (
    <div className="space-y-4">
      {/* Asset Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="asset-name">Asset Name</Label>
          <Input
            id="asset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter asset name..."
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is-global"
            checked={isGlobal}
            onCheckedChange={setIsGlobal}
          />
          <Label htmlFor="is-global">Global Asset</Label>
        </div>
      </div>

      {/* Code Editor */}
      <div>
        <Label>Code</Label>
        <div className="border rounded-lg overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm resize-none border-0 focus-visible:ring-0"
            placeholder={`Enter your ${asset.type?.toUpperCase()} code here...`}
          />
        </div>
      </div>

      {/* Preview */}
      {asset.type === 'html' && content && (
        <div>
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 bg-white">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Asset
            </>
          )}
        </Button>
      </div>
    </div>
  )
}