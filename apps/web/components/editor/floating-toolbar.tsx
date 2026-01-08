'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '@/contexts/editor-context'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Edit3,
  Type,
  Image,
  Link
} from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface FloatingToolbarProps {
  selectedElement: any
  onStartEditing?: () => void
}

export function FloatingToolbar({ selectedElement, onStartEditing }: FloatingToolbarProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const {
    duplicateElement,
    deleteElement,
    moveElementUp,
    moveElementDown
  } = useEditor()

  // Update toolbar position based on selected element
  useEffect(() => {
    if (!selectedElement) {
      setIsVisible(false)
      return
    }

    const updatePosition = () => {
      const elementNode = document.querySelector(`[data-element-id="${selectedElement.id}"]`)
      if (elementNode && toolbarRef.current) {
        const elementRect = elementNode.getBoundingClientRect()
        const toolbarRect = toolbarRef.current.getBoundingClientRect()
        
        // Position above the element, centered
        let x = elementRect.left + (elementRect.width / 2) - (toolbarRect.width / 2)
        let y = elementRect.top - toolbarRect.height - 10

        // Keep toolbar within viewport
        const padding = 10
        x = Math.max(padding, Math.min(x, window.innerWidth - toolbarRect.width - padding))
        
        // If toolbar would be above viewport, position below element
        if (y < padding) {
          y = elementRect.bottom + 10
        }

        setPosition({ x, y })
        setIsVisible(true)
      }
    }

    // Initial position
    updatePosition()

    // Update on scroll/resize
    const handleUpdate = () => updatePosition()
    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [selectedElement])

  if (!selectedElement || !isVisible) return null

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'heading':
      case 'paragraph':
        return Type
      case 'image':
        return Image
      case 'button':
        return Link
      default:
        return Edit3
    }
  }

  const ElementIcon = getElementIcon(selectedElement.type)

  const actions = [
    {
      icon: Edit3,
      label: 'Edit',
      action: onStartEditing,
      variant: 'default' as const
    },
    {
      icon: Copy,
      label: 'Duplicate',
      action: () => duplicateElement(selectedElement.id),
      variant: 'outline' as const
    },
    {
      icon: ChevronUp,
      label: 'Move Up',
      action: () => moveElementUp(selectedElement.id),
      variant: 'outline' as const
    },
    {
      icon: ChevronDown,
      label: 'Move Down',
      action: () => moveElementDown(selectedElement.id),
      variant: 'outline' as const
    },
    {
      icon: Trash2,
      label: 'Delete',
      action: () => deleteElement(selectedElement.id),
      variant: 'outline' as const,
      danger: true
    }
  ]

  return (
    <AnimatePresence>
      <TooltipProvider>
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-background border shadow-lg rounded-lg p-1 flex items-center gap-1"
          style={{ left: position.x, top: position.y }}
        >
          {/* Element Type Indicator */}
          <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-primary text-xs font-medium">
            <ElementIcon className="w-3 h-3" />
            <span className="capitalize">{selectedElement.type}</span>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Action Buttons */}
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className={cn(
                      "h-7 w-7 p-0",
                      action.danger && "text-destructive hover:text-destructive hover:bg-destructive/10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      action.action?.()
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </motion.div>
      </TooltipProvider>
    </AnimatePresence>
  )
}