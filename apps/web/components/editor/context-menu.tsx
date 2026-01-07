'use client'

import { motion } from 'framer-motion'
import { useEditor } from '@/contexts/editor-context'
import { 
  Copy, 
  Clipboard, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const { 
    selectedElement, 
    copy, 
    paste, 
    deleteElement,
    moveElementUp,
    moveElementDown
  } = useEditor()

  const menuItems = [
    { label: 'Copy', icon: Copy, action: copy, disabled: !selectedElement },
    { label: 'Paste', icon: Clipboard, action: paste },
    { type: 'separator' },
    { label: 'Move Up', icon: ChevronUp, action: () => selectedElement && moveElementUp(selectedElement.id), disabled: !selectedElement },
    { label: 'Move Down', icon: ChevronDown, action: () => selectedElement && moveElementDown(selectedElement.id), disabled: !selectedElement },
    { type: 'separator' },
    { label: 'Delete', icon: Trash2, action: () => selectedElement && deleteElement(selectedElement.id), disabled: !selectedElement, danger: true }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-50 bg-popover border rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-px bg-border my-1" />
        }
        
        const Icon = item.icon
        return (
          <button
            key={index}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${item.danger ? 'text-destructive hover:bg-destructive/10' : ''}`}
            onClick={() => {
              item.action?.()
              onClose()
            }}
            disabled={item.disabled}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
          </button>
        )
      })}
    </motion.div>
  )
}
