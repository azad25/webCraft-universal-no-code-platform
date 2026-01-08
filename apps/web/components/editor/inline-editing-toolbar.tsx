'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette,
  Check,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface InlineEditingToolbarProps {
  isVisible: boolean
  position: { x: number; y: number }
  onSave: () => void
  onCancel: () => void
  onFormatChange?: (format: string, value?: any) => void
}

export function InlineEditingToolbar({ 
  isVisible, 
  position, 
  onSave, 
  onCancel,
  onFormatChange 
}: InlineEditingToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [textColor, setTextColor] = useState('#000000')

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    onFormatChange?.(command, value)
  }

  const handleLink = () => {
    if (linkUrl) {
      handleCommand('createLink', linkUrl)
      setShowLinkInput(false)
      setLinkUrl('')
    }
  }

  const handleColorChange = (color: string) => {
    setTextColor(color)
    handleCommand('foreColor', color)
    setShowColorPicker(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[100] bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1"
        style={{ 
          left: position.x, 
          top: position.y - 50,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('bold')
          }}
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('italic')
          }}
        >
          <Italic className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('underline')
          }}
        >
          <Underline className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Alignment */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('justifyLeft')
          }}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('justifyCenter')
          }}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => {
            e.preventDefault()
            handleCommand('justifyRight')
          }}
        >
          <AlignRight className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Color */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border cursor-pointer"
                  style={{ backgroundColor: textColor }}
                >
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  value={textColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 h-6 text-xs"
                />
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[
                  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
                  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#f3f4f6'
                ].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Link */}
        <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Link className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="space-y-2">
              <Input
                placeholder="Enter URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLink()
                  }
                }}
                className="h-8 text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleLink} className="flex-1">
                  Add Link
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    handleCommand('unlink')
                    setShowLinkInput(false)
                  }}
                  className="flex-1"
                >
                  Remove
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Save/Cancel */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          onMouseDown={(e) => {
            e.preventDefault()
            onSave()
          }}
        >
          <Check className="w-4 h-4 mr-1" />
          <span className="text-xs">Save</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onMouseDown={(e) => {
            e.preventDefault()
            onCancel()
          }}
        >
          <X className="w-4 h-4 mr-1" />
          <span className="text-xs">Cancel</span>
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}