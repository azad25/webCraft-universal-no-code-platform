'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  Type,
  Image as ImageIcon,
  Palette,
  Layout,
  Wand2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Upload,
  Paintbrush,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Settings2,
  Maximize2,
  Plus,
  Minus,
  MoreHorizontal,
  Sparkles,
  Layers,
  MousePointer2,
  Grid,
  Zap,
  Target,
  Sliders,
  Box,
  Crop,
  Filter,
  Sun,
  Moon,
  Contrast,
  Droplets,
  Wind,
  Flame,
  Snowflake,
  Database,
  X
} from 'lucide-react'

import { MediaManager } from './media-manager'
import { DataBindingConfig } from '@/components/data/data-binding-config'

interface WidgetToolbarProps {
  element: any
  position: { x: number; y: number; width: number; height: number }
  isVisible: boolean
  onClose: () => void
}

// Font families
const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display',
  'Merriweather', 'Georgia', 'Times New Roman', 'Arial', 'Helvetica'
]

// Animation presets
const ANIMATION_PRESETS = [
  { name: 'None', value: 'none', icon: Eye },
  { name: 'Fade In', value: 'fadeIn', icon: Sun },
  { name: 'Slide Up', value: 'slideUp', icon: Wind },
  { name: 'Scale In', value: 'scaleIn', icon: Target },
  { name: 'Bounce In', value: 'bounceIn', icon: Droplets },
  { name: 'Rotate In', value: 'rotateIn', icon: RotateCw },
  { name: 'Flip In', value: 'flipIn', icon: Layers }
]

// Effect presets
const EFFECT_PRESETS = [
  { name: 'None', value: 'none', icon: Eye },
  { name: 'Glow', value: 'glow', icon: Sun },
  { name: 'Shadow', value: 'shadow', icon: Moon },
  { name: 'Blur', value: 'blur', icon: Droplets },
  { name: 'Grayscale', value: 'grayscale', icon: Contrast },
  { name: 'Sepia', value: 'sepia', icon: Flame },
  { name: 'Invert', value: 'invert', icon: Snowflake }
]

export function WidgetToolbar({ element, position, isVisible, onClose }: WidgetToolbarProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'layout' | 'effects' | 'data'>('content')
  const [showMediaManager, setShowMediaManager] = useState(false)
  const [showDataBinding, setShowDataBinding] = useState(false)
  const [localProps, setLocalProps] = useState(element.props || {})
  const [localStyle, setLocalStyle] = useState(element.style || {})
  const toolbarRef = useRef<HTMLDivElement>(null)

  const { updateElement } = useEditor()

  // Update local state when element changes
  useEffect(() => {
    setLocalProps(element.props || {})
    setLocalStyle(element.style || {})
  }, [element])

  // Handle prop changes
  const handlePropChange = useCallback((key: string, value: any) => {
    const newProps = { ...localProps, [key]: value }
    setLocalProps(newProps)
    updateElement(element.id, { props: newProps })
  }, [localProps, element.id, updateElement])

  // Handle style changes
  const handleStyleChange = useCallback((key: string, value: any) => {
    const newStyle = { ...localStyle, [key]: value }
    setLocalStyle(newStyle)
    updateElement(element.id, { style: newStyle })
  }, [localStyle, element.id, updateElement])

  // Handle data binding changes
  const handleDataBindingChange = useCallback((binding: any) => {
    const newProps = { ...localProps, dataBinding: binding }
    setLocalProps(newProps)
    updateElement(element.id, { props: newProps })
  }, [localProps, element.id, updateElement])

  // Handle media selection
  const handleMediaSelect = useCallback((media: any) => {
    if (element.type === 'image') {
      handlePropChange('src', media.url)
      if (media.alt) handlePropChange('alt', media.alt)
    } else {
      handleStyleChange('backgroundImage', `url(${media.url})`)
    }
    setShowMediaManager(false)
  }, [element.type, handlePropChange, handleStyleChange])

  // Check if element supports data binding
  const supportsDataBinding = () => {
    const dataWidgets = [
      'collection-list', 'collection-grid', 'collection-cards', 'data-table',
      'api-data', 'dynamic-content', 'text', 'image', 'list', 'card', 'chart'
    ];
    return dataWidgets.includes(element.type);
  };

  // Get toolbar position
  const getToolbarPosition = () => {
    const toolbarHeight = 400 // Approximate toolbar height
    const toolbarWidth = 320
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let top = position.y - toolbarHeight - 10
    let left = position.x + position.width / 2 - toolbarWidth / 2

    // Adjust if toolbar would go off screen
    if (top < 10) {
      top = position.y + position.height + 10
    }
    if (left < 10) {
      left = 10
    }
    if (left + toolbarWidth > viewportWidth - 10) {
      left = viewportWidth - toolbarWidth - 10
    }

    return { top, left }
  }

  // Render content tab based on element type
  const renderContentTab = () => {
    switch (element.type) {
      case 'text':
      case 'heading':
      case 'paragraph':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Text Content</Label>
              <Input
                value={localProps.text || localProps.content || ''}
                onChange={(e) => {
                  handlePropChange('text', e.target.value)
                  handlePropChange('content', e.target.value)
                }}
                placeholder="Enter text..."
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={localProps.bold ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('bold', !localProps.bold)}
                className="h-8 w-8 p-0"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.italic ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('italic', !localProps.italic)}
                className="h-8 w-8 p-0"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.underline ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('underline', !localProps.underline)}
                className="h-8 w-8 p-0"
              >
                <Underline className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={localProps.align === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'left')}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.align === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'center')}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={localProps.align === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('align', 'right')}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label className="text-xs font-medium">Link URL</Label>
              <Input
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
              <Label className="text-xs font-medium">Image Source</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={localProps.src || ''}
                  onChange={(e) => handlePropChange('src', e.target.value)}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaManager(true)}
                  className="px-3"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium">Alt Text</Label>
              <Input
                value={localProps.alt || ''}
                onChange={(e) => handlePropChange('alt', e.target.value)}
                placeholder="Describe the image..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Object Fit</Label>
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

            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Lazy Loading</Label>
              <Switch
                checked={localProps.lazy !== false}
                onCheckedChange={(checked) => handlePropChange('lazy', checked)}
              />
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Button Text</Label>
              <Input
                value={localProps.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                placeholder="Click me"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Link URL</Label>
              <Input
                value={localProps.href || ''}
                onChange={(e) => handlePropChange('href', e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Variant</Label>
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
                <Label className="text-xs font-medium">Size</Label>
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

            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Full Width</Label>
              <Switch
                checked={localProps.fullWidth || false}
                onCheckedChange={(checked) => handlePropChange('fullWidth', checked)}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Content editing for {element.type}</p>
              <p className="text-xs mt-1">Double-click element to edit inline</p>
            </div>
          </div>
        )
    }
  }

  // Render style tab
  const renderStyleTab = () => (
    <div className="space-y-4">
      {/* Typography */}
      {['text', 'heading', 'paragraph', 'button'].includes(element.type) && (
        <>
          <div>
            <Label className="text-xs font-medium">Font Family</Label>
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
            <Label className="text-xs font-medium">Font Size</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[parseInt(localStyle.fontSize?.replace('px', '') || '16')]}
                onValueChange={([value]) => handleStyleChange('fontSize', `${value}px`)}
                min={8}
                max={72}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12">
                {localStyle.fontSize || '16px'}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Text Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={localStyle.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />
              <Input
                value={localStyle.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </>
      )}

      {/* Background */}
      <div>
        <Label className="text-xs font-medium">Background</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={localStyle.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <Input
            value={localStyle.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMediaManager(true)}
            className="px-2"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Border */}
      <div>
        <Label className="text-xs font-medium">Border</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localStyle.borderColor || '#000000'}
              onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              className="w-6 h-6 rounded border cursor-pointer"
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
        <Label className="text-xs font-medium">Border Radius</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[parseInt(localStyle.borderRadius?.replace('px', '') || '0')]}
            onValueChange={([value]) => handleStyleChange('borderRadius', `${value}px`)}
            min={0}
            max={50}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {localStyle.borderRadius || '0px'}
          </span>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <Label className="text-xs font-medium">Opacity</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[parseFloat(localStyle.opacity || '1') * 100]}
            onValueChange={([value]) => handleStyleChange('opacity', (value / 100).toString())}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-12">
            {Math.round(parseFloat(localStyle.opacity || '1') * 100)}%
          </span>
        </div>
      </div>
    </div>
  )

  // Render layout tab
  const renderLayoutTab = () => (
    <div className="space-y-4">
      {/* Padding */}
      <div>
        <Label className="text-xs font-medium">Padding</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            placeholder="Top"
            value={localStyle.paddingTop || ''}
            onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Right"
            value={localStyle.paddingRight || ''}
            onChange={(e) => handleStyleChange('paddingRight', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Bottom"
            value={localStyle.paddingBottom || ''}
            onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Left"
            value={localStyle.paddingLeft || ''}
            onChange={(e) => handleStyleChange('paddingLeft', e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Margin */}
      <div>
        <Label className="text-xs font-medium">Margin</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            placeholder="Top"
            value={localStyle.marginTop || ''}
            onChange={(e) => handleStyleChange('marginTop', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Right"
            value={localStyle.marginRight || ''}
            onChange={(e) => handleStyleChange('marginRight', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Bottom"
            value={localStyle.marginBottom || ''}
            onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Left"
            value={localStyle.marginLeft || ''}
            onChange={(e) => handleStyleChange('marginLeft', e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Width & Height */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Width</Label>
          <Input
            value={localStyle.width || ''}
            onChange={(e) => handleStyleChange('width', e.target.value)}
            placeholder="auto"
            className="mt-1 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs font-medium">Height</Label>
          <Input
            value={localStyle.height || ''}
            onChange={(e) => handleStyleChange('height', e.target.value)}
            placeholder="auto"
            className="mt-1 text-xs"
          />
        </div>
      </div>

      {/* Display & Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Display</Label>
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
          <Label className="text-xs font-medium">Position</Label>
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
    </div>
  )

  // Render effects tab
  const renderEffectsTab = () => (
    <div className="space-y-4">
      {/* Animation */}
      <div>
        <Label className="text-xs font-medium">Animation</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {ANIMATION_PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <Button
                key={preset.value}
                variant={localProps.animation === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('animation', preset.value)}
                className="h-8 p-1 flex flex-col items-center justify-center"
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs">{preset.name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Effects */}
      <div>
        <Label className="text-xs font-medium">Effects</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {EFFECT_PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <Button
                key={preset.value}
                variant={localProps.effect === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePropChange('effect', preset.value)}
                className="h-8 p-1 flex flex-col items-center justify-center"
              >
                <Icon className="w-3 h-3" />
                <span className="text-xs">{preset.name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Shadow */}
      <div>
        <Label className="text-xs font-medium">Box Shadow</Label>
        <Select
          value={localStyle.boxShadow || 'none'}
          onValueChange={(value) => handleStyleChange('boxShadow', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="0 1px 3px rgba(0,0,0,0.1)">Small</SelectItem>
            <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Medium</SelectItem>
            <SelectItem value="0 10px 15px rgba(0,0,0,0.1)">Large</SelectItem>
            <SelectItem value="0 20px 25px rgba(0,0,0,0.1)">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hover Effects */}
      <div>
        <Label className="text-xs font-medium">Hover Effects</Label>
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Scale on Hover</Label>
            <Switch
              checked={localProps.hoverScale || false}
              onCheckedChange={(checked) => handlePropChange('hoverScale', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Shadow on Hover</Label>
            <Switch
              checked={localProps.hoverShadow || false}
              onCheckedChange={(checked) => handlePropChange('hoverShadow', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Lift on Hover</Label>
            <Switch
              checked={localProps.hoverLift || false}
              onCheckedChange={(checked) => handlePropChange('hoverLift', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (!isVisible) return null

  const toolbarPosition = getToolbarPosition()

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="fixed z-[9999] bg-background border border-border rounded-lg shadow-2xl w-80 max-h-[500px] overflow-hidden"
          style={{
            top: toolbarPosition.top,
            left: toolbarPosition.left
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-medium text-sm capitalize">{element.type}</span>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Live Edit
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-5 rounded-none border-b bg-transparent p-1">
              <TabsTrigger value="content" className="flex items-center gap-1 data-[state=active]:bg-accent">
                <Type className="w-3 h-3" />
                <span className="text-xs">Content</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-1 data-[state=active]:bg-accent">
                <Paintbrush className="w-3 h-3" />
                <span className="text-xs">Style</span>
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-1 data-[state=active]:bg-accent">
                <Layout className="w-3 h-3" />
                <span className="text-xs">Layout</span>
              </TabsTrigger>
              {supportsDataBinding() && (
                <TabsTrigger value="data" className="flex items-center gap-1 data-[state=active]:bg-accent">
                  <Database className="w-3 h-3" />
                  <span className="text-xs">Data</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="effects" className="flex items-center gap-1 data-[state=active]:bg-accent">
                <Wand2 className="w-3 h-3" />
                <span className="text-xs">Effects</span>
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="content" className="p-4 mt-0">
                {renderContentTab()}
              </TabsContent>

              <TabsContent value="style" className="p-4 mt-0">
                {renderStyleTab()}
              </TabsContent>

              <TabsContent value="layout" className="p-4 mt-0">
                {renderLayoutTab()}
              </TabsContent>

              {supportsDataBinding() && (
                <TabsContent value="data" className="p-4 mt-0">
                  <div className="space-y-4">
                    <div className="text-center">
                      <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="font-medium text-sm mb-1">Data Binding</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Connect this widget to dynamic data sources
                      </p>
                      <Button
                        onClick={() => setShowDataBinding(true)}
                        size="sm"
                        className="w-full"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Configure Data Binding
                      </Button>
                    </div>
                    
                    {localProps.dataBinding && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 text-sm">
                          <Database className="w-4 h-4" />
                          <span className="font-medium">Data source connected</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Widget is bound to {localProps.dataBinding.type === 'collection' ? 'collection' : 'API endpoint'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDataBinding(true)}
                          className="mt-2 w-full"
                        >
                          Edit Binding
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="effects" className="p-4 mt-0">
                {renderEffectsTab()}
              </TabsContent>
            </div>
          </Tabs>

          {/* Media Manager */}
          <MediaManager
            isOpen={showMediaManager}
            onClose={() => setShowMediaManager(false)}
            onSelect={handleMediaSelect}
          />

          {/* Data Binding Config */}
          {showDataBinding && (
            <DataBindingConfig
              appId={element.appId || ''}
              widgetId={element.id}
              widgetType={element.type}
              currentBinding={localProps.dataBinding}
              onBindingChange={handleDataBindingChange}
              onClose={() => setShowDataBinding(false)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  )
}