'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  content: string
  icon?: string
}

interface TabsWidgetProps {
  tabs?: TabItem[]
  style?: 'default' | 'pills' | 'underline' | 'boxed'
  alignment?: 'left' | 'center' | 'right' | 'stretch'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function TabsWidget({
  tabs = [
    { label: 'Features', content: 'Discover all the powerful features that make our platform stand out. From drag-and-drop editing to AI-powered suggestions, we have everything you need.' },
    { label: 'Pricing', content: 'Choose from our flexible pricing plans. Start free and upgrade as you grow. No hidden fees, cancel anytime.' },
    { label: 'Support', content: 'Get help when you need it. Our support team is available 24/7 via chat, email, and phone. Plus, access our extensive documentation.' },
    { label: 'About', content: 'Learn about our mission to democratize web development. We believe everyone should be able to create beautiful websites without code.' }
  ],
  style = 'default',
  alignment = 'left',
  isEditing,
  isPreview,
  onChange
}: TabsWidgetProps) {
  const [activeTab, setActiveTab] = useState(0)

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    stretch: 'justify-stretch'
  }

  return (
    <section className="w-full py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Tab Headers */}
        <div className={cn(
          "flex gap-1 mb-6",
          alignmentClasses[alignment],
          style === 'underline' && "border-b",
          style === 'boxed' && "bg-muted p-1 rounded-lg"
        )}>
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-all",
                alignment === 'stretch' && "flex-1",
                
                // Default style
                style === 'default' && [
                  "rounded-lg",
                  activeTab === index 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground"
                ],
                
                // Pills style
                style === 'pills' && [
                  "rounded-full",
                  activeTab === index 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-muted-foreground"
                ],
                
                // Underline style
                style === 'underline' && [
                  "pb-3 border-b-2 -mb-px",
                  activeTab === index 
                    ? "border-primary text-primary" 
                    : "border-transparent hover:border-muted-foreground/30 text-muted-foreground"
                ],
                
                // Boxed style
                style === 'boxed' && [
                  "rounded-md",
                  activeTab === index 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground"
                ]
              )}
            >
              {tab.label}
              
              {/* Animated indicator for underline style */}
              {style === 'underline' && activeTab === index && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 bg-card rounded-xl border"
        >
          <p className="text-muted-foreground leading-relaxed">
            {tabs[activeTab]?.content}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
