'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Copy,
  Trash2,
  Settings,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  X,
  Check,
  ChevronDown,
  Paintbrush,
  MousePointer,
  Layers3,
  Wand2,
  Zap,
  Link,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle
} from 'lucide-react'

interface WidgetToolbarProps {
  element: any
  position: { x: number; y: number; width: number; height: number }
  isVisible: boolean
  onClose: () => void
  appId?: string
}

const QUICK_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
]

const QUICK_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'
]

export function WidgetToolbar({ element, position, isVisible, onClose, appId }: WidgetToolbarProps) {
  const [activeSection, setActiveSection] = useState<'style' | 'layout' | 'content' | null>(null)
  const [localStyle, setLocalStyle] = useState(element.style || {})
  const [localProps, setLocalProps] = useState(element.props || {})
  const toolbarRef = useRef<HTMLDivElement>(null)

  const { updateElement } = useEditor()

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  const handleStyleChange = (key: string, value: any) => {
    const newStyle = { ...localStyle, [key]: value }
    setLocalStyle(newStyle)
    updateElement(element.id, { style: newStyle })
  }

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...localProps, [key]: value }
    setLocalProps(newProps)
    updateElement(element.id, { props: newProps })
  }

  if (!isVisible) return null

  const toolbarX = Math.max(10, Math.min(position.x, window.innerWidth - 320))
  const toolbarY = Math.max(10, position.y - 60)

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed z-[9999] bg-background border rounded-lg shadow-2xl"
        style={{ left: toolbarX, top: toolbarY }}
      >
        {/* Main Toolbar */}
        <div className="flex items-center gap-1 p-2">
          {/* Element Type Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-primary text-xs font-medium">
            <Type className="w-3 h-3" />
            <span className="capitalize">{element.type}</span>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Quick Style Actions */}
          {['text', 'heading', 'paragraph', 'button'].includes(element.type) && (
            <>
              {/* Text Formatting */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={localProps.bold ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePropChange('bold', !localProps.bold)}
                    className="h-7 w-7 p-0"
                  >
                    <Bold className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={localProps.italic ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePropChange('italic', !localProps.italic)}
                    className="h-7 w-7 p-0"
                  >
                    <Italic className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>

              {/* Text Alignment */}
              <div className="flex">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={localStyle.textAlign === value ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleStyleChange('textAlign', value)}
                        className="h-7 w-7 p-0"
                      >
                        <Icon className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align {value}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <Separator orientation="vertical" className="h-6 mx-1" />
            </>
          )}

          {/* Color Picker */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setActiveSection(activeSection === 'style' ? null : 'style')}
                  >
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: localStyle.color || localStyle.backgroundColor || '#000000' }}
                    />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Colors & Style</TooltipContent>
            </Tooltip>

            {/* Quick Colors */}
            <div className="flex gap-0.5">
              {QUICK_COLORS.slice(0, 4).map((color) => (
                <button
                  key={color}
                  className="w-4 h-4 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (['text', 'heading', 'paragraph'].includes(element.type)) {
                      handleStyleChange('color', color)
                    } else {
                      handleStyleChange('backgroundColor', color)
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Layout Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeSection === 'layout' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(activeSection === 'layout' ? null : 'layout')}
                className="h-7 w-7 p-0"
              >
                <Layout className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Layout & Position</TooltipContent>
          </Tooltip>

          {/* Content Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeSection === 'content' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(activeSection === 'content' ? null : 'content')}
                className="h-7 w-7 p-0"
              >
                <Type className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Content & Text</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Actions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Duplicate element
                  const { duplicateElement } = useEditor()
                  duplicateElement(element.id)
                }}
                className="h-7 w-7 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        {/* Expandable Sections */}
        <AnimatePresence>
          {activeSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-muted/30 overflow-hidden"
            >
              <div className="p-3 w-80">
                {activeSection === 'style' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Style & Appearance</Label>
                    
                    {/* Colors */}
                    <div className="grid grid-cols-8 gap-1">
                      {QUICK_COLORS.map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            if (['text', 'heading', 'paragraph'].includes(element.type)) {
                              handleStyleChange('color', color)
                            } else {
                              handleStyleChange('backgroundColor', color)
                            }
                          }}
                        />
                      ))}
                    </div>

                    {/* Font Size for text elements */}
                    {['text', 'heading', 'paragraph', 'button'].includes(element.type) && (
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[parseInt(localStyle.fontSize?.replace('px', '') || '16')]}
                            onValueChange={([value]) => handleStyleChange('fontSize', `${value}px`)}
                            min={8}
                            max={48}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-12">
                            {localStyle.fontSize || '16px'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Border Radius */}
                    <div>
                      <Label className="text-xs">Border Radius</Label>
                      <div className="flex items-center space-x-2 mt-1">
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
                      <Label className="text-xs">Opacity</Label>
                      <div className="flex items-center space-x-2 mt-1">
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
                )}

                {activeSection === 'layout' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Layout & Position</Label>
                    
                    {/* Position */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X Position</Label>
                        <Input
                          type="number"
                          value={element.position?.x || 0}
                          onChange={(e) => {
                            const newPosition = { ...element.position, x: parseInt(e.target.value) || 0 }
                            updateElement(element.id, { position: newPosition })
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y Position</Label>
                        <Input
                          type="number"
                          value={element.position?.y || 0}
                          onChange={(e) => {
                            const newPosition = { ...element.position, y: parseInt(e.target.value) || 0 }
                            updateElement(element.id, { position: newPosition })
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                    </div>

                    {/* Size */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={element.size?.width || 200}
                          onChange={(e) => {
                            const newSize = { ...element.size, width: parseInt(e.target.value) || 200 }
                            updateElement(element.id, { size: newSize })
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={element.size?.height || 100}
                          onChange={(e) => {
                            const newSize = { ...element.size, height: parseInt(e.target.value) || 100 }
                            updateElement(element.id, { size: newSize })
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                    </div>

                    {/* Padding */}
                    <div>
                      <Label className="text-xs">Padding</Label>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].map((prop, index) => (
                          <Input
                            key={prop}
                            type="number"
                            value={parseInt(localStyle[prop]?.replace('px', '') || '0')}
                            onChange={(e) => handleStyleChange(prop, `${e.target.value}px`)}
                            className="text-xs h-6"
                            placeholder={['T', 'R', 'B', 'L'][index]}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Z-Index */}
                    <div>
                      <Label className="text-xs">Layer Order</Label>
                      <Input
                        type="number"
                        value={localStyle.zIndex || 1}
                        onChange={(e) => handleStyleChange('zIndex', parseInt(e.target.value) || 1)}
                        className="text-xs h-7 mt-1"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'content' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Content & Properties</Label>
                    
                    {/* Text Content */}
                    {['text', 'content', 'title', 'label'].some(prop => localProps.hasOwnProperty(prop)) && (
                      <div>
                        <Label className="text-xs">Text</Label>
                        {['text', 'content', 'title', 'label'].map(prop => {
                          if (!localProps.hasOwnProperty(prop)) return null
                          return (
                            <Input
                              key={prop}
                              value={localProps[prop] || ''}
                              onChange={(e) => handlePropChange(prop, e.target.value)}
                              className="text-xs h-7 mt-1"
                              placeholder={`Enter ${prop}...`}
                            />
                          )
                        })}
                      </div>
                    )}

                    {/* Link */}
                    <div>
                      <Label className="text-xs">Link URL</Label>
                      <Input
                        value={localProps.href || ''}
                        onChange={(e) => handlePropChange('href', e.target.value)}
                        className="text-xs h-7 mt-1"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Image Source */}
                    {element.type === 'image' && (
                      <div>
                        <Label className="text-xs">Image URL</Label>
                        <Input
                          value={localProps.src || ''}
                          onChange={(e) => handlePropChange('src', e.target.value)}
                          className="text-xs h-7 mt-1"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    )}

                    {/* Alt Text */}
                    {element.type === 'image' && (
                      <div>
                        <Label className="text-xs">Alt Text</Label>
                        <Input
                          value={localProps.alt || ''}
                          onChange={(e) => handlePropChange('alt', e.target.value)}
                          className="text-xs h-7 mt-1"
                          placeholder="Describe the image..."
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TooltipProvider>
  )
}