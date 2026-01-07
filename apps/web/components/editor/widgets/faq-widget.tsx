'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, Minus } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQWidgetProps {
  title?: string
  subtitle?: string
  items?: FAQItem[]
  layout?: 'accordion' | 'grid'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
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
  onChange
}: FAQWidgetProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="w-full py-20 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-xl overflow-hidden"
            >
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
