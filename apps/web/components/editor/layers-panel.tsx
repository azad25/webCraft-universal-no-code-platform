'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronRight, ChevronDown, GripVertical, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/editor-context'

interface LayersPanelProps {
  app: any
}

export function LayersPanel({ app }: LayersPanelProps) {
  const { elements, selectedElement, selectElement, deleteElement, duplicateElement } = useEditor()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Sort elements by z-index (highest first)
  const sortedElements = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

  if (elements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No elements yet</p>
          <p className="text-xs mt-1">Drag widgets to the canvas to start</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <Reorder.Group axis="y" values={sortedElements} onReorder={() => {}}>
          {sortedElements.map((element) => (
            <Reorder.Item key={element.id} value={element}>
              <motion.div
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors mb-1",
                  selectedElement?.id === element.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-accent/50"
                )}
                onClick={() => selectElement(element)}
                whileHover={{ x: 2 }}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate capitalize">
                    {element.name || element.type}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {element.type} • {element.size?.width}×{element.size?.height}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Toggle visibility
                    }}
                  >
                    {element.visible !== false ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Toggle lock
                    }}
                  >
                    {element.locked ? (
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </ScrollArea>
  )
}
