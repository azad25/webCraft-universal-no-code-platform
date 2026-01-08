'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, Minus, Database, RefreshCw, Loader2, Edit3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface FAQItem {
  question: string
  answer: string
}

interface FAQWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // FAQ configuration
  title?: string
  subtitle?: string
  items?: FAQItem[]
  layout?: 'accordion' | 'grid'
  isEditing?: boolean
  isPreview?: boolean
  isSelected?: boolean
  elementId?: string
  onChange?: (props: any) => void
  onStyleChange?: (style: any) => void
}

export function FAQWidget({
  title = 'Frequently Asked Questions',
  subtitle = 'Find answers to common questions',
  items = [
    {
      question: 'How do I get started?',
      answer: 'Simply sign up for a free account and start building your website using our drag-and-drop editor. No coding required!'
    },
    {
      question: 'Can I use my own domain?',
      answer: 'Yes! You can connect your own custom domain or use our free subdomain. We handle all the SSL certificates automatically.'
    },
    {
      question: 'Is there a free plan?',
      answer: 'Yes, we offer a generous free plan that includes 1 website, basic templates, and community support. Perfect for getting started.'
    },
    {
      question: 'Can I export my website?',
      answer: 'Absolutely! Pro and Enterprise users can export their websites as static HTML, React, or download a complete ZIP file.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you are not satisfied, contact our support team for a full refund.'
    }
  ],
  layout = 'accordion',
  isEditing,
  isPreview,
  isSelected,
  elementId,
  onChange,
  onStyleChange
}: FAQWidgetProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingSubtitle, setEditingSubtitle] = useState(false)
  const [editingItem, setEditingItem] = useState<{ index: number; field: 'question' | 'answer' } | null>(null)
  const [localItems, setLocalItems] = useState(items)
  
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const itemRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  // Handle title editing
  const handleTitleEdit = useCallback(() => {
    if (isPreview) return
    setEditingTitle(true)
  }, [isPreview])

  const handleTitleBlur = useCallback(() => {
    if (titleRef.current && onChange) {
      onChange({ title: titleRef.current.innerText })
    }
    setEditingTitle(false)
  }, [onChange])

  // Handle subtitle editing
  const handleSubtitleEdit = useCallback(() => {
    if (isPreview) return
    setEditingSubtitle(true)
  }, [isPreview])

  const handleSubtitleBlur = useCallback(() => {
    if (subtitleRef.current && onChange) {
      onChange({ subtitle: subtitleRef.current.innerText })
    }
    setEditingSubtitle(false)
  }, [onChange])

  // Handle FAQ item editing
  const handleItemEdit = useCallback((index: number, field: 'question' | 'answer') => {
    if (isPreview) return
    setEditingItem({ index, field })
  }, [isPreview])

  const handleItemBlur = useCallback((index: number, field: 'question' | 'answer') => {
    const ref = itemRefs.current[`${index}-${field}`]
    if (ref && onChange) {
      const newItems = [...localItems]
      newItems[index] = {
        ...newItems[index],
        [field]: ref.innerText
      }
      setLocalItems(newItems)
      onChange({ items: newItems })
    }
    setEditingItem(null)
  }, [localItems, onChange])

  // Add new FAQ item
  const handleAddItem = useCallback(() => {
    if (isPreview) return
    const newItems = [...localItems, { question: 'New Question', answer: 'New Answer' }]
    setLocalItems(newItems)
    onChange?.({ items: newItems })
  }, [localItems, onChange, isPreview])

  // Remove FAQ item
  const handleRemoveItem = useCallback((index: number) => {
    if (isPreview) return
    const newItems = localItems.filter((_, i) => i !== index)
    setLocalItems(newItems)
    onChange?.({ items: newItems })
  }, [localItems, onChange, isPreview])

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent, onBlur: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onBlur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onBlur()
    }
  }, [])

  return (
    <section className="w-full py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            ref={titleRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              "text-3xl md:text-4xl font-bold mb-4 cursor-text",
              editingTitle && "outline-none ring-2 ring-primary/50 rounded px-2 bg-primary/5",
              !isPreview && !editingTitle && "hover:bg-muted/30 rounded px-2"
            )}
            contentEditable={editingTitle}
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
            onKeyDown={(e) => handleKeyDown(e, handleTitleBlur)}
            onDoubleClick={handleTitleEdit}
          >
            {title}
          </motion.h2>
          <motion.p
            ref={subtitleRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-lg text-muted-foreground cursor-text",
              editingSubtitle && "outline-none ring-2 ring-primary/50 rounded px-2 bg-primary/5",
              !isPreview && !editingSubtitle && "hover:bg-muted/30 rounded px-2"
            )}
            contentEditable={editingSubtitle}
            suppressContentEditableWarning
            onBlur={handleSubtitleBlur}
            onKeyDown={(e) => handleKeyDown(e, handleSubtitleBlur)}
            onDoubleClick={handleSubtitleEdit}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {localItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "border rounded-xl overflow-hidden group",
                !isPreview && "hover:border-primary/30"
              )}
            >
              {/* Question Header */}
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="flex-1 flex items-center gap-3">
                  <h3
                    ref={(el) => itemRefs.current[`${index}-question`] = el}
                    className={cn(
                      "font-semibold text-lg cursor-text",
                      editingItem?.index === index && editingItem?.field === 'question' && 
                      "outline-none ring-2 ring-primary/50 rounded px-1 bg-primary/5",
                      !isPreview && !(editingItem?.index === index && editingItem?.field === 'question') && 
                      "hover:bg-muted/30 rounded px-1"
                    )}
                    contentEditable={editingItem?.index === index && editingItem?.field === 'question'}
                    suppressContentEditableWarning
                    onBlur={() => handleItemBlur(index, 'question')}
                    onKeyDown={(e) => handleKeyDown(e, () => handleItemBlur(index, 'question'))}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      handleItemEdit(index, 'question')
                    }}
                    onClick={(e) => {
                      if (!isPreview && editingItem?.index === index && editingItem?.field === 'question') {
                        e.stopPropagation()
                      }
                    }}
                  >
                    {item.question}
                  </h3>
                  
                  {/* Edit Controls */}
                  {!isPreview && isSelected && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleItemEdit(index, 'question')
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveItem(index)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Answer Content */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 border-t">
                      <p
                        ref={(el) => itemRefs.current[`${index}-answer`] = el}
                        className={cn(
                          "text-muted-foreground leading-relaxed mt-3 cursor-text",
                          editingItem?.index === index && editingItem?.field === 'answer' && 
                          "outline-none ring-2 ring-primary/50 rounded px-1 bg-primary/5",
                          !isPreview && !(editingItem?.index === index && editingItem?.field === 'answer') && 
                          "hover:bg-muted/30 rounded px-1"
                        )}
                        contentEditable={editingItem?.index === index && editingItem?.field === 'answer'}
                        suppressContentEditableWarning
                        onBlur={() => handleItemBlur(index, 'answer')}
                        onKeyDown={(e) => handleKeyDown(e, () => handleItemBlur(index, 'answer'))}
                        onDoubleClick={() => handleItemEdit(index, 'answer')}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Add New FAQ Button */}
        {!isPreview && isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <Button
              variant="outline"
              onClick={handleAddItem}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add FAQ Item
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium pr-4">{item.question}</span>
                <div className="shrink-0">
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-primary" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-muted-foreground">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
