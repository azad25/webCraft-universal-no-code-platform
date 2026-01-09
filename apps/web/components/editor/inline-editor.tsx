'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  Type,
  Palette,
  Layout,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Settings,
  Zap,
  Image as ImageIcon,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  X,
  Check,
  ChevronDown,
  Sparkles,
  Upload,
  Maximize2,
  MoreHorizontal,
  Paintbrush,
  MousePointer,
  Layers3,
  Wand2
} from 'lucide-react'

import { MediaManager } from '@/components/media/media-manager'

interface InlineEditorProps {
  element: any
  position: { x: number; y: number }
  onClose: () => void
  onUpdate: (updates: any) => void
  onDelete?: () => void
  onDuplicate?: () => void
  onStartResize?: () => void
  appId?: string
}

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display',
  'Merriweather', 'Georgia', 'Times New Roman', 'Arial', 'Helvetica',
  'Fira Code', 'JetBrains Mono', 'SF Pro Display', 'Helvetica Neue',
  'Avenir', 'Proxima Nova', 'Circular', 'Gotham', 'Futura'
]

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
  '#808080', '#000080', '#008000', '#800000', '#808000', '#008080',
  '#C0C0C0', '#FF6347', '#4682B4', '#32CD32', '#FFD700', '#DA70D6',
  '#87CEEB', '#F0E68C', '#DDA0DD', '#98FB98', '#F5DEB3', '#FF69B4'
]

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
]

const SHADOW_PRESETS = [
  { name: 'None', value: 'none' },
  { name: 'Subtle', value: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' },
  { name: 'Small', value: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)' },
  { name: 'Medium', value: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' },
  { name: 'Large', value: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)' },
  { name: 'Extra Large', value: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)' },
  { name: 'Inner', value: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
  { name: 'Colored', value: '0 10px 25px rgba(59, 130, 246, 0.5)' }
]

const ANIMATION_PRESETS = [
  { name: 'None', value: 'none' },
  { name: 'Fade In', value: 'fadeIn' },
  { name: 'Slide Up', value: 'slideUp' },
  { name: 'Slide Down', value: 'slideDown' },
  { name: 'Slide Left', value: 'slideLeft' },
  { name: 'Slide Right', value: 'slideRight' },
  { name: 'Scale In', value: 'scaleIn' },
  { name: 'Bounce In', value: 'bounceIn' },
  { name: 'Rotate In', value: 'rotateIn' },
  { name: 'Flip In', value: 'flipIn' }
]

export function InlineEditor({ element, position, onClose, onUpdate, onDelete, onDuplicate, onStartResize, appId }: InlineEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'layout' | 'animation' | 'actions'>('content')
  const [localProps, setLocalProps] = useState(element.props || {})
  const [localStyle, setLocalStyle] = useState(element.style || {})
  const [hasChanges, setHasChanges] = useState(false)
  const [showMediaManager, setShowMediaManager] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showGradientPicker, setShowGradientPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        handleSave()
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handlePropChange = useCallback((key: string, value: any) => {
    setLocalProps((prev: any) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  const handleStyleChange = useCallback((key: string, value: any) => {
    setLocalStyle((prev: any) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(() => {
    if (hasChanges) {
      onUpdate({
        props: localProps,
        style: localStyle
      })
      setHasChanges(false)
    }
  }, [hasChanges, localProps, localStyle, onUpdate])

  // Handle media selection
  const handleMediaSelect = useCallback((media: any) => {
    if (element.type === 'image') {
      handlePropChange('src', media.url)
      if (media.alt_text) handlePropChange('alt', media.alt_text)
    } else {
      handleStyleChange('backgroundImage', `url(${media.url})`)
    }
    setShowMediaManager(false)
  }, [element.type])

  const renderContentTab = () => {
    switch (element.type) {
      case 'text':
      case 'heading':
      case 'paragraph':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                value={localProps.content || localProps.text || ''}
                onChange={(e) => {
                  handlePropChange('content', e.target.value)
                  handlePropChange('text', e.target.value)
                }}
                placeholder="Enter your text..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={localProps.bold ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('bold', !localProps.bold)}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.italic ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('italic', !localProps.italic)}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.underline ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('underline', !localProps.underline)}
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={localProps.align === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.align === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.align === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label htmlFor="link-url">Link URL (optional)</Label>
              <Input
                id="link-url"
                value={localProps.href || ''}
                onChange={(e) => handlePropChange('href', e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-src">Image URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="image-src"
                  value={localProps.src || ''}
                  onChange={(e) => handlePropChange('src', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaManager(true)}
                  className="px-3"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={localProps.alt || ''}
                onChange={(e) => handlePropChange('alt', e.target.value)}
                placeholder="Describe the image..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="image-link">Link URL (optional)</Label>
              <Input
                id="image-link"
                value={localProps.href || ''}
                onChange={(e) => handlePropChange('href', e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Object Fit</Label>
                <Select
                  value={localStyle.objectFit || 'cover'}
                  onValueChange={(value) => handleStyleChange('objectFit', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="scale-down">Scale Down</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="lazy-loading"
                  checked={localProps.lazy !== false}
                  onCheckedChange={(checked) => handlePropChange('lazy', checked)}
                />
                <Label htmlFor="lazy-loading">Lazy Loading</Label>
              </div>
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={localProps.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                placeholder="Click me"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="button-link">Link URL</Label>
              <Input
                id="button-link"
                value={localProps.href || ''}
                onChange={(e) => handlePropChange('href', e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Variant</Label>
                <Select
                  value={localProps.variant || 'default'}
                  onValueChange={(value) => handlePropChange('variant', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="destructive">Destructive</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Button Size</Label>
                <Select
                  value={localProps.size || 'default'}
                  onValueChange={(value) => handlePropChange('size', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="full-width"
                checked={localProps.fullWidth || false}
                onCheckedChange={(checked) => handlePropChange('fullWidth', checked)}
              />
              <Label htmlFor="full-width">Full Width</Label>
            </div>
          </div>
        )

      case 'card':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-title">Card Title</Label>
              <Input
                id="card-title"
                value={localProps.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Card Title"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                value={localProps.description || ''}
                onChange={(e) => handlePropChange('description', e.target.value)}
                placeholder="Card description..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="card-image">Image URL</Label>
              <Input
                id="card-image"
                value={localProps.image || ''}
                onChange={(e) => handlePropChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-button-text">Button Text</Label>
                <Input
                  id="card-button-text"
                  value={localProps.buttonText || ''}
                  onChange={(e) => handlePropChange('buttonText', e.target.value)}
                  placeholder="Learn More"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="card-button-url">Button URL</Label>
                <Input
                  id="card-button-url"
                  value={localProps.buttonUrl || ''}
                  onChange={(e) => handlePropChange('buttonUrl', e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 'table':
      case 'data-table':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-title">Table Title</Label>
              <Input
                id="table-title"
                value={localProps.title || ''}
                onChange={(e) => handlePropChange('title', e.target.value)}
                placeholder="Data Table"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="table-description">Description</Label>
              <Textarea
                id="table-description"
                value={localProps.description || ''}
                onChange={(e) => handlePropChange('description', e.target.value)}
                placeholder="Table description..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="searchable"
                  checked={localProps.searchable !== false}
                  onCheckedChange={(checked) => handlePropChange('searchable', checked)}
                />
                <Label htmlFor="searchable">Searchable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sortable"
                  checked={localProps.sortable !== false}
                  onCheckedChange={(checked) => handlePropChange('sortable', checked)}
                />
                <Label htmlFor="sortable">Sortable</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="paginated"
                  checked={localProps.paginated !== false}
                  onCheckedChange={(checked) => handlePropChange('paginated', checked)}
                />
                <Label htmlFor="paginated">Paginated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="exportable"
                  checked={localProps.exportable !== false}
                  onCheckedChange={(checked) => handlePropChange('exportable', checked)}
                />
                <Label htmlFor="exportable">Exportable</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="addable"
                  checked={localProps.addable !== false}
                  onCheckedChange={(checked) => handlePropChange('addable', checked)}
                />
                <Label htmlFor="addable">Allow Add</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editable"
                  checked={localProps.editable !== false}
                  onCheckedChange={(checked) => handlePropChange('editable', checked)}
                />
                <Label htmlFor="editable">Allow Edit</Label>
              </div>
            </div>

            <div>
              <Label>Page Size</Label>
              <Select
                value={localProps.pageSize?.toString() || '10'}
                onValueChange={(value) => handlePropChange('pageSize', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Table Theme</Label>
              <Select
                value={localProps.theme || 'default'}
                onValueChange={(value) => handlePropChange('theme', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="striped"
                  checked={localProps.striped !== false}
                  onCheckedChange={(checked) => handlePropChange('striped', checked)}
                />
                <Label htmlFor="striped">Striped</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="bordered"
                  checked={localProps.bordered || false}
                  onCheckedChange={(checked) => handlePropChange('bordered', checked)}
                />
                <Label htmlFor="bordered">Bordered</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="compact"
                  checked={localProps.compact || false}
                  onCheckedChange={(checked) => handlePropChange('compact', checked)}
                />
                <Label htmlFor="compact">Compact</Label>
              </div>
            </div>
          </div>
        )

      // Universal widget editor for all other types
      default:
        return (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Universal Editor for {element.type}</p>
              <p className="text-xs mt-1">All widgets are fully customizable</p>
            </div>
            
            {/* Universal Text Properties */}
            {['title', 'text', 'content', 'label', 'placeholder', 'description', 'subtitle'].some(prop => 
              localProps.hasOwnProperty(prop)
            ) && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Text Content</Label>
                {['title', 'text', 'content', 'label', 'placeholder', 'description', 'subtitle'].map(prop => {
                  if (!localProps.hasOwnProperty(prop)) return null
                  const value = localProps[prop]
                  return (
                    <div key={prop}>
                      <Label className="text-xs capitalize">{prop.replace(/([A-Z])/g, ' $1')}</Label>
                      {typeof value === 'string' && value.length > 50 ? (
                        <Textarea
                          value={value}
                          onChange={(e) => handlePropChange(prop, e.target.value)}
                          className="mt-1 text-sm"
                          rows={2}
                          placeholder={`Enter ${prop}...`}
                        />
                      ) : (
                        <Input
                          value={value?.toString() || ''}
                          onChange={(e) => handlePropChange(prop, e.target.value)}
                          className="mt-1 text-sm"
                          placeholder={`Enter ${prop}...`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Universal Image Properties */}
            {['src', 'image', 'icon', 'avatar', 'logo'].some(prop => 
              localProps.hasOwnProperty(prop)
            ) && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Images & Media</Label>
                {['src', 'image', 'icon', 'avatar', 'logo'].map(prop => {
                  if (!localProps.hasOwnProperty(prop)) return null
                  return (
                    <div key={prop}>
                      <Label className="text-xs capitalize">{prop.replace(/([A-Z])/g, ' $1')}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={localProps[prop] || ''}
                          onChange={(e) => handlePropChange(prop, e.target.value)}
                          placeholder={`Enter ${prop} URL...`}
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMediaManager(true)}
                          className="px-3"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Universal Link Properties */}
            {['href', 'url', 'link', 'action'].some(prop => 
              localProps.hasOwnProperty(prop)
            ) && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Links & Actions</Label>
                {['href', 'url', 'link', 'action'].map(prop => {
                  if (!localProps.hasOwnProperty(prop)) return null
                  return (
                    <div key={prop}>
                      <Label className="text-xs capitalize">{prop.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input
                        value={localProps[prop] || ''}
                        onChange={(e) => handlePropChange(prop, e.target.value)}
                        className="mt-1 text-sm"
                        placeholder={`Enter ${prop}...`}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Universal Boolean Properties */}
            {Object.entries(localProps).filter(([key, value]) => typeof value === 'boolean').length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Options & Settings</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(localProps).filter(([key, value]) => typeof value === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => handlePropChange(key, checked)}
                      />
                      <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Universal Number Properties */}
            {Object.entries(localProps).filter(([key, value]) => typeof value === 'number').length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Numeric Values</Label>
                {Object.entries(localProps).filter(([key, value]) => typeof value === 'number').map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      type="number"
                      value={value as number}
                      onChange={(e) => handlePropChange(key, parseFloat(e.target.value) || 0)}
                      className="mt-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Universal Array Properties (for lists, options, etc.) */}
            {Object.entries(localProps).filter(([key, value]) => Array.isArray(value)).length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Lists & Collections</Label>
                {Object.entries(localProps).filter(([key, value]) => Array.isArray(value)).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Textarea
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          handlePropChange(key, parsed)
                        } catch (error) {
                          // Invalid JSON, don't update
                        }
                      }}
                      className="mt-1 text-xs font-mono"
                      rows={3}
                      placeholder="JSON array..."
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add New Property */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const key = prompt('Property name:')
                  const value = prompt('Property value:')
                  if (key && value !== null) {
                    handlePropChange(key, value)
                  }
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Property
              </Button>
            </div>
          </div>
        )
    }
  }

  const renderStyleTab = () => (
    <div className="space-y-4">
      {/* Typography */}
      {['text', 'heading', 'paragraph', 'button'].includes(element.type) && (
        <>
          <div>
            <Label>Font Family</Label>
            <Select
              value={localStyle.fontFamily || 'Inter'}
              onValueChange={(value) => handleStyleChange('fontFamily', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(font => (
                  <SelectItem key={font} value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Font Size</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[parseInt(localStyle.fontSize?.replace('px', '') || '16')]}
                onValueChange={([value]) => handleStyleChange('fontSize', `${value}px`)}
                min={8}
                max={72}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {localStyle.fontSize || '16px'}
              </span>
            </div>
          </div>

          <div>
            <Label>Font Weight</Label>
            <Select
              value={localStyle.fontWeight || '400'}
              onValueChange={(value) => handleStyleChange('fontWeight', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semi Bold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
                <SelectItem value="800">Extra Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Text Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                type="color"
                value={localStyle.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                value={localStyle.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
            {/* Color Presets */}
            <div className="grid grid-cols-10 gap-1 mt-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleStyleChange('color', color)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Text Alignment</Label>
            <div className="flex gap-1 mt-1">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight }
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={localStyle.textAlign === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStyleChange('textAlign', value)}
                  className="flex-1"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Line Height</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[parseFloat(localStyle.lineHeight || '1.5')]}
                onValueChange={([value]) => handleStyleChange('lineHeight', value.toString())}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {localStyle.lineHeight || '1.5'}
              </span>
            </div>
          </div>

          <div>
            <Label>Letter Spacing</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[parseFloat(localStyle.letterSpacing?.replace('px', '') || '0')]}
                onValueChange={([value]) => handleStyleChange('letterSpacing', `${value}px`)}
                min={-2}
                max={5}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {localStyle.letterSpacing || '0px'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Background */}
      <div>
        <Label>Background</Label>
        <div className="space-y-3 mt-1">
          {/* Background Color */}
          <div>
            <Label className="text-xs">Color</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                type="color"
                value={localStyle.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-12 h-8 p-1 border rounded"
              />
              <Input
                value={localStyle.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
            {/* Color Presets */}
            <div className="grid grid-cols-10 gap-1 mt-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleStyleChange('backgroundColor', color)}
                />
              ))}
            </div>
          </div>

          {/* Background Gradient */}
          <div>
            <Label className="text-xs">Gradient</Label>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {GRADIENT_PRESETS.map((gradient, index) => (
                <button
                  key={index}
                  className="w-full h-8 rounded border hover:scale-105 transition-transform"
                  style={{ background: gradient }}
                  onClick={() => handleStyleChange('background', gradient)}
                />
              ))}
            </div>
          </div>

          {/* Background Image */}
          <div>
            <Label className="text-xs">Image</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={localStyle.backgroundImage?.replace('url(', '').replace(')', '') || ''}
                onChange={(e) => handleStyleChange('backgroundImage', e.target.value ? `url(${e.target.value})` : '')}
                placeholder="Image URL..."
                className="flex-1 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMediaManager(true)}
                className="px-3"
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {localStyle.backgroundImage && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Select
                  value={localStyle.backgroundSize || 'cover'}
                  onValueChange={(value) => handleStyleChange('backgroundSize', value)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={localStyle.backgroundPosition || 'center'}
                  onValueChange={(value) => handleStyleChange('backgroundPosition', value)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={localStyle.backgroundRepeat || 'no-repeat'}
                  onValueChange={(value) => handleStyleChange('backgroundRepeat', value)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-repeat">No Repeat</SelectItem>
                    <SelectItem value="repeat">Repeat</SelectItem>
                    <SelectItem value="repeat-x">Repeat X</SelectItem>
                    <SelectItem value="repeat-y">Repeat Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Border */}
      <div>
        <Label>Border</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-12">Width</Label>
            <Slider
              value={[parseInt(localStyle.borderWidth?.replace('px', '') || '0')]}
              onValueChange={([value]) => handleStyleChange('borderWidth', `${value}px`)}
              min={0}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {localStyle.borderWidth || '0px'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-12">Color</Label>
            <Input
              type="color"
              value={localStyle.borderColor || '#000000'}
              onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              className="w-8 h-6 p-0 border rounded"
            />
            <Select
              value={localStyle.borderStyle || 'solid'}
              onValueChange={(value) => handleStyleChange('borderStyle', value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <Label>Border Radius</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Slider
            value={[parseInt(localStyle.borderRadius?.replace('px', '') || '0')]}
            onValueChange={([value]) => handleStyleChange('borderRadius', `${value}px`)}
            min={0}
            max={50}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12">
            {localStyle.borderRadius || '0px'}
          </span>
        </div>
        {/* Quick presets */}
        <div className="flex gap-1 mt-2">
          {[0, 4, 8, 16, 24, 50].map(radius => (
            <Button
              key={radius}
              variant="outline"
              size="sm"
              onClick={() => handleStyleChange('borderRadius', `${radius}px`)}
              className="text-xs px-2 py-1"
            >
              {radius}px
            </Button>
          ))}
        </div>
      </div>

      {/* Shadow */}
      <div>
        <Label>Box Shadow</Label>
        <div className="space-y-2 mt-1">
          <Select
            value={localStyle.boxShadow || 'none'}
            onValueChange={(value) => handleStyleChange('boxShadow', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHADOW_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transform */}
      <div>
        <Label>Transform</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-16">Scale</Label>
            <Slider
              value={[parseFloat(localStyle.scale || '1')]}
              onValueChange={([value]) => handleStyleChange('transform', `scale(${value})`)}
              min={0.5}
              max={2}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {localStyle.scale || '1'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-16">Rotate</Label>
            <Slider
              value={[parseInt(localStyle.rotate?.replace('deg', '') || '0')]}
              onValueChange={([value]) => handleStyleChange('transform', `rotate(${value}deg)`)}
              min={-180}
              max={180}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {localStyle.rotate || '0°'}
            </span>
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <Label>Opacity</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Slider
            value={[parseFloat(localStyle.opacity || '1') * 100]}
            onValueChange={([value]) => handleStyleChange('opacity', (value / 100).toString())}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12">
            {Math.round(parseFloat(localStyle.opacity || '1') * 100)}%
          </span>
        </div>
      </div>

      {/* Filters */}
      <div>
        <Label>Filters</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-16">Blur</Label>
            <Slider
              value={[parseInt(localStyle.blur?.replace('px', '') || '0')]}
              onValueChange={([value]) => handleStyleChange('filter', `blur(${value}px)`)}
              min={0}
              max={20}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {localStyle.blur || '0px'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Label className="text-xs w-16">Brightness</Label>
            <Slider
              value={[parseFloat(localStyle.brightness || '1') * 100]}
              onValueChange={([value]) => handleStyleChange('filter', `brightness(${value / 100})`)}
              min={0}
              max={200}
              step={10}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {Math.round(parseFloat(localStyle.brightness || '1') * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLayoutTab = () => (
    <div className="space-y-4">
      {/* Padding */}
      <div>
        <Label>Padding</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <Label className="text-xs">Top</Label>
            <Input
              value={localStyle.paddingTop || '0px'}
              onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Right</Label>
            <Input
              value={localStyle.paddingRight || '0px'}
              onChange={(e) => handleStyleChange('paddingRight', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Bottom</Label>
            <Input
              value={localStyle.paddingBottom || '0px'}
              onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Left</Label>
            <Input
              value={localStyle.paddingLeft || '0px'}
              onChange={(e) => handleStyleChange('paddingLeft', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Margin */}
      <div>
        <Label>Margin</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <Label className="text-xs">Top</Label>
            <Input
              value={localStyle.marginTop || '0px'}
              onChange={(e) => handleStyleChange('marginTop', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Right</Label>
            <Input
              value={localStyle.marginRight || '0px'}
              onChange={(e) => handleStyleChange('marginRight', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Bottom</Label>
            <Input
              value={localStyle.marginBottom || '0px'}
              onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Left</Label>
            <Input
              value={localStyle.marginLeft || '0px'}
              onChange={(e) => handleStyleChange('marginLeft', e.target.value)}
              placeholder="0px"
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Width & Height */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Width</Label>
          <Input
            value={localStyle.width || 'auto'}
            onChange={(e) => handleStyleChange('width', e.target.value)}
            placeholder="auto"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Height</Label>
          <Input
            value={localStyle.height || 'auto'}
            onChange={(e) => handleStyleChange('height', e.target.value)}
            placeholder="auto"
            className="mt-1"
          />
        </div>
      </div>

      {/* Display & Position */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Display</Label>
          <Select
            value={localStyle.display || 'block'}
            onValueChange={(value) => handleStyleChange('display', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="block">Block</SelectItem>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="inline-block">Inline Block</SelectItem>
              <SelectItem value="flex">Flex</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Position</Label>
          <Select
            value={localStyle.position || 'static'}
            onValueChange={(value) => handleStyleChange('position', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">Static</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="sticky">Sticky</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Z-Index */}
      <div>
        <Label>Z-Index</Label>
        <Input
          value={localStyle.zIndex || 'auto'}
          onChange={(e) => handleStyleChange('zIndex', e.target.value)}
          placeholder="auto"
          className="mt-1"
        />
      </div>
    </div>
  )

  const renderAnimationTab = () => (
    <div className="space-y-4">
      <div>
        <Label>Animation Preset</Label>
        <Select
          value={localProps.animation || 'none'}
          onValueChange={(value) => handlePropChange('animation', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANIMATION_PRESETS.map(preset => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {localProps.animation && localProps.animation !== 'none' && (
        <>
          <div>
            <Label>Duration (seconds)</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[parseFloat(localProps.animationDuration || '0.5')]}
                onValueChange={([value]) => handlePropChange('animationDuration', value.toString())}
                min={0.1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {localProps.animationDuration || '0.5'}s
              </span>
            </div>
          </div>

          <div>
            <Label>Delay (seconds)</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[parseFloat(localProps.animationDelay || '0')]}
                onValueChange={([value]) => handlePropChange('animationDelay', value.toString())}
                min={0}
                max={2}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {localProps.animationDelay || '0'}s
              </span>
            </div>
          </div>

          <div>
            <Label>Easing</Label>
            <Select
              value={localProps.animationEasing || 'ease'}
              onValueChange={(value) => handlePropChange('animationEasing', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ease">Ease</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In Out</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="repeat-animation"
              checked={localProps.animationRepeat || false}
              onCheckedChange={(checked) => handlePropChange('animationRepeat', checked)}
            />
            <Label htmlFor="repeat-animation">Repeat Animation</Label>
          </div>
        </>
      )}

      <Separator />

      <div>
        <Label>Hover Effects</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="hover-scale"
              checked={localProps.hoverScale || false}
              onCheckedChange={(checked) => handlePropChange('hoverScale', checked)}
            />
            <Label htmlFor="hover-scale">Scale on Hover</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hover-shadow"
              checked={localProps.hoverShadow || false}
              onCheckedChange={(checked) => handlePropChange('hoverShadow', checked)}
            />
            <Label htmlFor="hover-shadow">Shadow on Hover</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hover-lift"
              checked={localProps.hoverLift || false}
              onCheckedChange={(checked) => handlePropChange('hoverLift', checked)}
            />
            <Label htmlFor="hover-lift">Lift on Hover</Label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderActionsTab = () => (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Actions & Events</p>
        <p className="text-xs mt-1">Configure interactive behaviors</p>
      </div>

      {/* Click Actions */}
      <div>
        <Label>On Click Action</Label>
        <Select
          value={localProps.clickAction || 'none'}
          onValueChange={(value) => handlePropChange('clickAction', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Action</SelectItem>
            <SelectItem value="navigate">Navigate to URL</SelectItem>
            <SelectItem value="scroll">Scroll to Element</SelectItem>
            <SelectItem value="modal">Open Modal</SelectItem>
            <SelectItem value="api">API Call</SelectItem>
            <SelectItem value="form">Submit Form</SelectItem>
            <SelectItem value="custom">Custom JavaScript</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Configuration */}
      {localProps.clickAction && localProps.clickAction !== 'none' && (
        <div>
          <Label>Action Configuration</Label>
          {localProps.clickAction === 'navigate' && (
            <Input
              value={localProps.navigateUrl || ''}
              onChange={(e) => handlePropChange('navigateUrl', e.target.value)}
              placeholder="https://example.com"
              className="mt-1"
            />
          )}
          {localProps.clickAction === 'scroll' && (
            <Input
              value={localProps.scrollTarget || ''}
              onChange={(e) => handlePropChange('scrollTarget', e.target.value)}
              placeholder="#element-id"
              className="mt-1"
            />
          )}
          {localProps.clickAction === 'api' && (
            <div className="space-y-2 mt-1">
              <Input
                value={localProps.apiUrl || ''}
                onChange={(e) => handlePropChange('apiUrl', e.target.value)}
                placeholder="API Endpoint URL"
              />
              <Select
                value={localProps.apiMethod || 'GET'}
                onValueChange={(value) => handlePropChange('apiMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {localProps.clickAction === 'custom' && (
            <Textarea
              value={localProps.customScript || ''}
              onChange={(e) => handlePropChange('customScript', e.target.value)}
              placeholder="// Custom JavaScript code"
              className="mt-1 font-mono text-xs"
              rows={4}
            />
          )}
        </div>
      )}

      <Separator />

      {/* Event Tracking */}
      <div>
        <Label>Event Tracking</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="track-clicks"
              checked={localProps.trackClicks || false}
              onCheckedChange={(checked) => handlePropChange('trackClicks', checked)}
            />
            <Label htmlFor="track-clicks">Track Clicks</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="track-views"
              checked={localProps.trackViews || false}
              onCheckedChange={(checked) => handlePropChange('trackViews', checked)}
            />
            <Label htmlFor="track-views">Track Views</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="track-hovers"
              checked={localProps.trackHovers || false}
              onCheckedChange={(checked) => handlePropChange('trackHovers', checked)}
            />
            <Label htmlFor="track-hovers">Track Hovers</Label>
          </div>
        </div>
      </div>

      {/* Conditional Display */}
      <div>
        <Label>Conditional Display</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-on-mobile"
              checked={localProps.showOnMobile !== false}
              onCheckedChange={(checked) => handlePropChange('showOnMobile', checked)}
            />
            <Label htmlFor="show-on-mobile">Show on Mobile</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-on-tablet"
              checked={localProps.showOnTablet !== false}
              onCheckedChange={(checked) => handlePropChange('showOnTablet', checked)}
            />
            <Label htmlFor="show-on-tablet">Show on Tablet</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-on-desktop"
              checked={localProps.showOnDesktop !== false}
              onCheckedChange={(checked) => handlePropChange('showOnDesktop', checked)}
            />
            <Label htmlFor="show-on-desktop">Show on Desktop</Label>
          </div>
        </div>
      </div>

      {/* Data Binding */}
      <div>
        <Label>Data Binding</Label>
        <div className="space-y-2 mt-1">
          <Input
            value={localProps.dataSource || ''}
            onChange={(e) => handlePropChange('dataSource', e.target.value)}
            placeholder="Data source URL or collection"
            className="text-sm"
          />
          <Input
            value={localProps.dataField || ''}
            onChange={(e) => handlePropChange('dataField', e.target.value)}
            placeholder="Field name to bind"
            className="text-sm"
          />
        </div>
      </div>
    </div>
  )

  return (
    <TooltipProvider>
      <motion.div
        ref={editorRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed bg-background border border-border rounded-lg shadow-2xl z-[9999] w-80 max-h-[80vh] overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.min(position.y, window.innerHeight - 400)
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-medium text-sm capitalize">{element.type}</span>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Modified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Quick Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartResize?.()}
                  className="h-7 w-7 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resize Element</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate?.()}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.()}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border mx-1" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="h-7 w-7 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Changes</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/30">
          {[
            { id: 'content', label: 'Content', icon: Type },
            { id: 'style', label: 'Style', icon: Paintbrush },
            { id: 'layout', label: 'Layout', icon: Layers3 },
            { id: 'animation', label: 'Effects', icon: Wand2 },
            { id: 'actions', label: 'Actions', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'style' && renderStyleTab()}
          {activeTab === 'layout' && renderLayoutTab()}
          {activeTab === 'animation' && renderAnimationTab()}
          {activeTab === 'actions' && renderActionsTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground">
            Double-click to edit • ESC to close
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset to original values
                setLocalProps(element.props || {})
                setLocalStyle(element.style || {})
                setHasChanges(false)
              }}
              className="h-7 text-xs"
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="h-7 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Media Manager */}
      {appId && (
        <MediaManager
          appId={appId}
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onSelect={handleMediaSelect}
          acceptTypes={element.type === 'image' ? ['image'] : ['image']}
        />
      )}
    </TooltipProvider>
  )
}