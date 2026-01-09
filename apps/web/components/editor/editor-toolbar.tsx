'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Save, 
  Eye, 
  EyeOff,
  Smartphone, 
  Tablet, 
  Monitor, 
  Undo2, 
  Redo2,
  Settings,
  Share2,
  Play,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  ExternalLink,
  Sparkles,
  Download,
  Upload,
  Globe,
  Code2,
  Palette,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  MoreHorizontal,
  Rocket,
  History,
  HelpCircle,
  ChevronDown,
  Check,
  Home,
  FileText
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/logo'

interface EditorToolbarProps {
  appId: string
  previewMode: 'desktop' | 'tablet' | 'mobile'
  onPreviewModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void
  showPreview: boolean
  onTogglePreview: () => void
  onLivePreview: () => void
  isGeneratingPreview: boolean
  currentPage?: any
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
  onToggleAI: () => void
  onToggleLeftSidebar: () => void
  onToggleRightSidebar: () => void
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
}

export function EditorToolbar({
  appId,
  previewMode,
  onPreviewModeChange,
  showPreview,
  onTogglePreview,
  onLivePreview,
  isGeneratingPreview,
  currentPage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  isSaving,
  isDirty,
  onToggleAI,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftSidebarOpen,
  rightSidebarOpen
}: EditorToolbarProps) {
  const [isConnected] = useState(true)
  const [collaborators] = useState([])

  const previewModes = [
    { id: 'desktop', icon: Monitor, label: 'Desktop', shortcut: '1' },
    { id: 'tablet', icon: Tablet, label: 'Tablet', shortcut: '2' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile', shortcut: '3' }
  ] as const

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-12 bg-background border-b flex items-center justify-between px-2 gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-1">
          {/* Home / Back */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <Link href="/dashboard">
                  <Home className="w-4 h-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Dashboard</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Toggle Left Sidebar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleLeftSidebar}
                className="h-8 w-8 p-0"
              >
                {leftSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Sidebar (⌘\)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-8 w-8 p-0"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (⌘Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-8 w-8 p-0"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Center Section - Preview Controls */}
        <div className="flex items-center gap-2">
          {/* Current Page Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {currentPage?.title || 'No Page Selected'}
            </span>
            {currentPage?.is_homepage && (
              <Home className="w-3 h-3 text-primary" />
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Device Preview Selector */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {previewModes.map((mode) => {
              const Icon = mode.icon
              return (
                <Tooltip key={mode.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={previewMode === mode.id ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => onPreviewModeChange(mode.id)}
                      className={cn(
                        "h-7 w-7 p-0 transition-all",
                        previewMode === mode.id && "shadow-sm"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{mode.label} ({mode.shortcut})</TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showPreview ? 'default' : 'ghost'}
                size="sm"
                onClick={onTogglePreview}
                className="gap-2 h-8"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Exit Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Preview (P)</TooltipContent>
          </Tooltip>

          {/* Live Preview */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLivePreview}
                disabled={isGeneratingPreview}
                className="gap-2 h-8"
              >
                {isGeneratingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Live Preview
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open Live Preview (Shift+P)</TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Connection Status */}
          <div className="flex items-center gap-1 px-2">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
            )}
            {collaborators.length > 0 && (
              <Badge variant="secondary" className="h-5 text-xs px-1.5">
                <Users className="w-3 h-3 mr-1" />
                {collaborators.length}
              </Badge>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* AI Assistant */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAI}
                className="gap-2 h-8"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Assistant</TooltipContent>
          </Tooltip>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <Code2 className="w-4 h-4 mr-2" />
                View Code
              </DropdownMenuItem>
              <DropdownMenuItem>
                <History className="w-4 h-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Export as HTML</DropdownMenuItem>
                  <DropdownMenuItem>Export as React</DropdownMenuItem>
                  <DropdownMenuItem>Download ZIP</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Globe className="w-4 h-4 mr-2" />
                SEO Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Site Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Tutorials
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Save Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDirty ? 'default' : 'ghost'}
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="gap-2 h-8"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isDirty ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving All...' : isDirty ? 'Save All' : 'All Saved'}
                </span>
                {isDirty && !isSaving && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save All App Data (⌘S)</TooltipContent>
          </Tooltip>

          {/* Publish Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2 h-8">
                <Rocket className="w-4 h-4" />
                Publish
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <Globe className="w-4 h-4 mr-2" />
                Publish to Web
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" />
                Share Preview Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Domain Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Toggle Right Sidebar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleRightSidebar}
                className="h-8 w-8 p-0"
              >
                {rightSidebarOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRight className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Properties</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
