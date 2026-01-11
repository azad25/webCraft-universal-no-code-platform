'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, Minus } from 'lucide-react'

interface AccordionItem {
  title: string
  content: string
}

interface AccordionWidgetProps {
  title?: string
  items?: AccordionItem[]
  allowMultiple?: boolean
  iconStyle?: 'chevron' | 'plus'
  style?: 'default' | 'bordered' | 'separated'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function AccordionWidget({
  title,
  items = [
    { title: 'What is this platform?', content: 'This is a powerful no-code platform that allows you to build websites, apps, and more without writing code.' },
    { title: 'How do I get started?', content: 'Simply sign up for a free account and start building. Our drag-and-drop editor makes it easy to create beautiful designs.' },
    { title: 'Is there a free plan?', content: 'Yes! We offer a generous free plan that includes all basic features. Upgrade anytime for more advanced capabilities.' },
    { title: 'Can I use my own domain?', content: 'Absolutely. You can connect your custom domain or use our free subdomain. SSL certificates are included.' }
  ],
  allowMultiple = false,
  iconStyle = 'chevron',
  style = 'default',
  isEditing,
  isPreview,
  onChange
}: AccordionWidgetProps) {
  const [openItems, setOpenItems] = useState<number[]>([0])

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      )
    } else {
      setOpenItems(prev => prev.includes(index) ? [] : [index])
    }
  }

  const Icon = iconStyle === 'chevron' ? ChevronDown : (openItems.includes(0) ? Minus : Plus)

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{title}</h2>
        )}
        
        <div className={cn(
          "space-y-2",
          style === 'separated' && "space-y-4"
        )}>
          {items.map((item, index) => {
            const isOpen = openItems.includes(index)
            
            return (
              <div
                key={index}
                className={cn(
                  "overflow-hidden transition-all",
                  style === 'default' && "border-b",
                  style === 'bordered' && "border rounded-lg",
                  style === 'separated' && "border rounded-xl bg-card"
                )}
              >
                <button
                  className={cn(
                    "w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors",
                    style === 'separated' && "p-5"
                  )}
                  onClick={() => toggleItem(index)}
                >
                  <span className="font-medium pr-4">{item.title}</span>
                  <m.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    {iconStyle === 'chevron' ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      isOpen ? (
                        <Minus className="w-5 h-5 text-primary" />
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      )
                    )}
                  </m.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={cn(
                        "px-4 pb-4 text-muted-foreground",
                        style === 'separated' && "px-5 pb-5"
                      )}>
                        {item.content}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
