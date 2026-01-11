'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { 
  Type, 
  Palette, 
  Layout, 
  Box, 
  Move, 
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Upload,
  Edit3,
  Database
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'
import { MediaUpload } from './media-upload'
import { DataSourceConfig } from '@/components/data-sources/data-source-config'

interface PropertiesPanelProps {
  selectedElement: any
}

// Color presets
const COLOR_PRESETS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

// Font families
const FONT_FAMILIES = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'georgia', label: 'Georgia' }
]

// Font sizes
const FONT_SIZES = [
  '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px'
]

function PropertySection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ColorPicker({ 
  value, 
  onChange, 
  label 
}: { 
  value: string
  onChange: (color: string) => void
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 text-xs"
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            className={cn(
              "w-5 h-5 rounded border transition-transform hover:scale-110",
              value === color && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  )
}

export function PropertiesPanel({ selectedElement }: PropertiesPanelProps) {
  const { updateElement, deleteElement, duplicateElement, appId } = useEditor()
  const [localProps, setLocalProps] = useState<any>({})
  const [localStyle, setLocalStyle] = useState<any>({})
  const [showMediaUpload, setShowMediaUpload] = useState(false)

  useEffect(() => {
    if (selectedElement) {
      setLocalProps(selectedElement.props || {})
      setLocalStyle(selectedElement.style || {})
    }
  }, [selectedElement])

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...localProps, [key]: value }
    setLocalProps(newProps)
    updateElement(selectedElement.id, { props: newProps })
  }

  const handleStyleChange = (key: string, value: any) => {
    const newStyle = { ...localStyle, [key]: value }
    setLocalStyle(newStyle)
    updateElement(selectedElement.id, { style: newStyle })
  }

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Element Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm capitalize">{selectedElement.type}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => duplicateElement(selectedElement.id)}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => deleteElement(selectedElement.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <Input
            value={selectedElement.name || `${selectedElement.type}-${selectedElement.id.slice(0, 4)}`}
            onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
            className="h-8 text-xs"
            placeholder="Element name"
          />
        </div>

        <Separator className="mb-4" />

        {/* Tabs for different property categories */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            {/* Text Content */}
            {['text', 'heading', 'paragraph', 'button'].includes(selectedElement.type) && (
              <PropertySection title="Text" icon={Type}>
                <div className="space-y-2">
                  <Label className="text-xs">Content</Label>
                  <Input
                    value={localProps.text || ''}
                    onChange={(e) => handlePropChange('text', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Enter text..."
                  />
                </div>
                
                {selectedElement.type === 'heading' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Heading Level</Label>
                    <Select
                      value={localProps.level || 'h2'}
                      onValueChange={(value) => handlePropChange('level', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </PropertySection>
            )}

            {/* Hero Content */}
            {selectedElement.type === 'hero' && (
              <PropertySection title="Hero Content" icon={Type}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={localProps.title || ''}
                      onChange={(e) => handlePropChange('title', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Hero title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={localProps.subtitle || ''}
                      onChange={(e) => handlePropChange('subtitle', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Hero subtitle..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <textarea
                      value={localProps.description || ''}
                      onChange={(e) => handlePropChange('description', e.target.value)}
                      className="w-full h-20 px-3 py-2 text-xs border rounded-md resize-none"
                      placeholder="Hero description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Badge Text</Label>
                    <Input
                      value={localProps.badgeText || ''}
                      onChange={(e) => handlePropChange('badgeText', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Badge text..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Badge</Label>
                    <Switch
                      checked={localProps.showBadge !== false}
                      onCheckedChange={(checked) => handlePropChange('showBadge', checked)}
                    />
                  </div>
                </div>
              </PropertySection>
            )}

            {/* Card Content */}
            {selectedElement.type === 'card' && (
              <PropertySection title="Card Content" icon={Type}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={localProps.title || ''}
                      onChange={(e) => handlePropChange('title', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Card title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <textarea
                      value={localProps.description || ''}
                      onChange={(e) => handlePropChange('description', e.target.value)}
                      className="w-full h-16 px-3 py-2 text-xs border rounded-md resize-none"
                      placeholder="Card description..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Button Text</Label>
                    <Input
                      value={localProps.buttonText || ''}
                      onChange={(e) => handlePropChange('buttonText', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Button text..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Button URL</Label>
                    <Input
                      value={localProps.buttonUrl || ''}
                      onChange={(e) => handlePropChange('buttonUrl', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </PropertySection>
            )}

            {/* Image Content */}
            {selectedElement.type === 'image' && (
              <PropertySection title="Image" icon={Image}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={localProps.src || ''}
                        onChange={(e) => handlePropChange('src', e.target.value)}
                        className="h-8 text-xs flex-1"
                        placeholder="https://..."
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowMediaUpload(true)}
                        className="h-8 px-2"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {localProps.src && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={localProps.src} 
                        alt={localProps.alt || 'Preview'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Alt Text</Label>
                    <Input
                      value={localProps.alt || ''}
                      onChange={(e) => handlePropChange('alt', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Image description"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => setShowMediaUpload(true)}
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      Upload Image
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Sparkles className="w-3 h-3 mr-2" />
                      AI Generate
                    </Button>
                  </div>
                </div>
              </PropertySection>
            )}

            {/* Link Settings */}
            {['button', 'link', 'image'].includes(selectedElement.type) && (
              <PropertySection title="Link" icon={Link}>
                <div className="space-y-2">
                  <Label className="text-xs">URL</Label>
                  <Input
                    value={localProps.href || ''}
                    onChange={(e) => handlePropChange('href', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Open in new tab</Label>
                  <Switch
                    checked={localProps.target === '_blank'}
                    onCheckedChange={(checked) => handlePropChange('target', checked ? '_blank' : '_self')}
                  />
                </div>
              </PropertySection>
            )}
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4">
            {/* Data Source Connection */}
            <PropertySection title="Data Source" icon={Database}>
              <div className="space-y-3">
                <DataSourceConfig
                  selectedSourceId={localProps.dataSourceId}
                  selectedEndpointId={localProps.dataEndpointId}
                  onSelect={(sourceId, endpointId, sourceType) => {
                    handlePropChange('dataSourceId', sourceId)
                    handlePropChange('dataEndpointId', endpointId)
                    handlePropChange('dataSourceType', sourceType)
                  }}
                  appId={appId || 'current-app'}
                />
                
                {localProps.dataSourceId && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Auto Refresh</Label>
                      <Switch
                        checked={localProps.autoRefresh || false}
                        onCheckedChange={(checked) => handlePropChange('autoRefresh', checked)}
                      />
                    </div>
                    
                    {localProps.autoRefresh && (
                      <div className="space-y-2">
                        <Label className="text-xs">Refresh Interval (seconds)</Label>
                        <Input
                          type="number"
                          value={localProps.refreshInterval || 60}
                          onChange={(e) => handlePropChange('refreshInterval', parseInt(e.target.value))}
                          className="h-8 text-xs"
                          min="10"
                          max="3600"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PropertySection>

            {/* Display Options for Data Widgets */}
            {['data', 'table', 'chart', 'list'].includes(selectedElement.type) && localProps.dataSourceId && (
              <PropertySection title="Display Options" icon={Layout}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Display Mode</Label>
                    <Select
                      value={localProps.displayMode || 'cards'}
                      onValueChange={(value) => handlePropChange('displayMode', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="cards">Cards</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="chart">Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {localProps.displayMode === 'cards' && (
                    <div className="space-y-2">
                      <Label className="text-xs">Columns</Label>
                      <Select
                        value={localProps.columns?.toString() || '2'}
                        onValueChange={(value) => handlePropChange('columns', parseInt(value))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Column</SelectItem>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Header</Label>
                    <Switch
                      checked={localProps.showHeader !== false}
                      onCheckedChange={(checked) => handlePropChange('showHeader', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Refresh Button</Label>
                    <Switch
                      checked={localProps.showRefresh !== false}
                      onCheckedChange={(checked) => handlePropChange('showRefresh', checked)}
                    />
                  </div>
                </div>
              </PropertySection>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-4">
            {/* Typography */}
            <PropertySection title="Typography" icon={Type}>
              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={localStyle.fontFamily || 'inter'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Size</Label>
                  <Select
                    value={localStyle.fontSize || '16px'}
                    onValueChange={(value) => handleStyleChange('fontSize', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Weight</Label>
                  <Select
                    value={localStyle.fontWeight || '400'}
                    onValueChange={(value) => handleStyleChange('fontWeight', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['300', '400', '500', '600', '700', '800'].map((weight) => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs">Alignment</Label>
                <div className="flex gap-1">
                  {[
                    { value: 'left', icon: AlignLeft },
                    { value: 'center', icon: AlignCenter },
                    { value: 'right', icon: AlignRight },
                    { value: 'justify', icon: AlignJustify }
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={localStyle.textAlign === value ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleStyleChange('textAlign', value)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Text Formatting */}
              <div className="space-y-2">
                <Label className="text-xs">Formatting</Label>
                <div className="flex gap-1">
                  <Button
                    variant={localStyle.fontWeight === '700' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleStyleChange('fontWeight', localStyle.fontWeight === '700' ? '400' : '700')}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={localStyle.fontStyle === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleStyleChange('fontStyle', localStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={localStyle.textDecoration === 'underline' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleStyleChange('textDecoration', localStyle.textDecoration === 'underline' ? 'none' : 'underline')}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </PropertySection>

            {/* Colors */}
            <PropertySection title="Colors" icon={Palette}>
              <ColorPicker
                label="Text Color"
                value={localStyle.color || '#000000'}
                onChange={(color) => handleStyleChange('color', color)}
              />
              <ColorPicker
                label="Background"
                value={localStyle.backgroundColor || '#ffffff'}
                onChange={(color) => handleStyleChange('backgroundColor', color)}
              />
              
              {/* Background Image */}
              <div className="space-y-2">
                <Label className="text-xs">Background Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={localStyle.backgroundImage?.replace('url(', '').replace(')', '') || ''}
                    onChange={(e) => handleStyleChange('backgroundImage', e.target.value ? `url(${e.target.value})` : '')}
                    className="h-8 text-xs flex-1"
                    placeholder="Image URL..."
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowMediaUpload(true)}
                    className="h-8 px-2"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                </div>
                
                {localStyle.backgroundImage && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Size</Label>
                        <Select
                          value={localStyle.backgroundSize || 'cover'}
                          onValueChange={(value) => handleStyleChange('backgroundSize', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="contain">Contain</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position</Label>
                        <Select
                          value={localStyle.backgroundPosition || 'center'}
                          onValueChange={(value) => handleStyleChange('backgroundPosition', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PropertySection>

            {/* Border */}
            <PropertySection title="Border" icon={Box} defaultOpen={false}>
              <div className="space-y-2">
                <Label className="text-xs">Border Width</Label>
                <Slider
                  value={[parseInt(localStyle.borderWidth) || 0]}
                  onValueChange={([value]) => handleStyleChange('borderWidth', `${value}px`)}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Border Radius</Label>
                <Slider
                  value={[parseInt(localStyle.borderRadius) || 0]}
                  onValueChange={([value]) => handleStyleChange('borderRadius', `${value}px`)}
                  max={50}
                  step={1}
                />
              </div>
              <ColorPicker
                label="Border Color"
                value={localStyle.borderColor || '#e5e7eb'}
                onChange={(color) => handleStyleChange('borderColor', color)}
              />
            </PropertySection>

            {/* Shadow */}
            <PropertySection title="Shadow" icon={Box} defaultOpen={false}>
              <div className="space-y-2">
                <Label className="text-xs">Shadow Preset</Label>
                <Select
                  value={localStyle.boxShadow || 'none'}
                  onValueChange={(value) => handleStyleChange('boxShadow', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="0 1px 2px rgba(0,0,0,0.05)">Small</SelectItem>
                    <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Medium</SelectItem>
                    <SelectItem value="0 10px 15px rgba(0,0,0,0.1)">Large</SelectItem>
                    <SelectItem value="0 25px 50px rgba(0,0,0,0.25)">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PropertySection>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            {/* Size */}
            <PropertySection title="Size" icon={Maximize2}>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Width</Label>
                  <Input
                    value={localStyle.width || 'auto'}
                    onChange={(e) => handleStyleChange('width', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="auto"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Height</Label>
                  <Input
                    value={localStyle.height || 'auto'}
                    onChange={(e) => handleStyleChange('height', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="auto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Min Width</Label>
                  <Input
                    value={localStyle.minWidth || ''}
                    onChange={(e) => handleStyleChange('minWidth', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Width</Label>
                  <Input
                    value={localStyle.maxWidth || ''}
                    onChange={(e) => handleStyleChange('maxWidth', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="none"
                  />
                </div>
              </div>
            </PropertySection>

            {/* Spacing */}
            <PropertySection title="Spacing" icon={Move}>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-2 block">Padding</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Top', 'Right', 'Bottom', 'Left'].map((side) => (
                      <div key={side} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground">{side[0]}</span>
                        <Input
                          value={localStyle[`padding${side}`] || '0'}
                          onChange={(e) => handleStyleChange(`padding${side}`, e.target.value)}
                          className="h-7 text-xs text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Margin</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Top', 'Right', 'Bottom', 'Left'].map((side) => (
                      <div key={side} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground">{side[0]}</span>
                        <Input
                          value={localStyle[`margin${side}`] || '0'}
                          onChange={(e) => handleStyleChange(`margin${side}`, e.target.value)}
                          className="h-7 text-xs text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PropertySection>

            {/* Position */}
            <PropertySection title="Position" icon={Layout} defaultOpen={false}>
              <div className="space-y-2">
                <Label className="text-xs">Position Type</Label>
                <Select
                  value={localStyle.position || 'relative'}
                  onValueChange={(value) => handleStyleChange('position', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-2">
                <Label className="text-xs">Z-Index</Label>
                <Input
                  type="number"
                  value={localStyle.zIndex || '0'}
                  onChange={(e) => handleStyleChange('zIndex', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </PropertySection>

            {/* Display */}
            <PropertySection title="Display" icon={Layout} defaultOpen={false}>
              <div className="space-y-2">
                <Label className="text-xs">Display</Label>
                <Select
                  value={localStyle.display || 'block'}
                  onValueChange={(value) => handleStyleChange('display', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
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
              <div className="space-y-2">
                <Label className="text-xs">Overflow</Label>
                <Select
                  value={localStyle.overflow || 'visible'}
                  onValueChange={(value) => handleStyleChange('overflow', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="scroll">Scroll</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PropertySection>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Media Upload Dialog */}
      <MediaUpload
        open={showMediaUpload}
        onOpenChange={setShowMediaUpload}
        onSelect={(url) => {
          if (selectedElement.type === 'image') {
            handlePropChange('src', url)
          } else {
            // For background images
            handleStyleChange('backgroundImage', `url(${url})`)
          }
          setShowMediaUpload(false)
        }}
      />
    </ScrollArea>
  )
}