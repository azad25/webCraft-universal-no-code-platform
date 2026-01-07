'use client'

import { cn } from '@/lib/utils'
import { Check, Circle, ChevronRight } from 'lucide-react'

interface ListItem {
  id: string
  text: string
  checked?: boolean
}

interface ListWidgetProps {
  items?: ListItem[]
  listType?: 'bullet' | 'numbered' | 'check' | 'arrow'
  fontSize?: string
  color?: string
  spacing?: 'tight' | 'normal' | 'relaxed'
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultItems: ListItem[] = [
  { id: '1', text: 'First item in the list' },
  { id: '2', text: 'Second item in the list' },
  { id: '3', text: 'Third item in the list' }
]

export function ListWidget({
  items = defaultItems,
  listType = 'bullet',
  fontSize = '16px',
  color = '#333333',
  spacing = 'normal',
  isEditing = false,
  onChange
}: ListWidgetProps) {
  const spacingClasses = {
    tight: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-4'
  }

  const renderIcon = (index: number, item: ListItem) => {
    switch (listType) {
      case 'numbered':
        return <span className="font-semibold mr-3">{index + 1}.</span>
      case 'check':
        return <Check className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
      case 'arrow':
        return <ChevronRight className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
      default:
        return <Circle className="w-2 h-2 mr-3 fill-current flex-shrink-0" />
    }
  }

  return (
    <ul
      className={cn("w-full h-full p-4", spacingClasses[spacing])}
      style={{ fontSize, color }}
    >
      {items.map((item, index) => (
        <li key={item.id} className="flex items-start">
          {renderIcon(index, item)}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}
