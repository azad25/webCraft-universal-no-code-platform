'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, CheckCircle, Sparkles } from 'lucide-react'

interface NewsletterWidgetProps {
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
  successMessage?: string
  style?: 'inline' | 'stacked' | 'card'
  backgroundColor?: string
  showIcon?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function NewsletterWidget({
  title = 'Subscribe to our Newsletter',
  subtitle = 'Get the latest updates, tips, and exclusive content delivered to your inbox.',
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  successMessage = 'Thanks for subscribing! Check your inbox for confirmation.',
  style = 'card',
  backgroundColor,
  showIcon = true,
  isEditing,
  isPreview,
  onChange
}: NewsletterWidgetProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing || !email) return
    
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setEmail('')
  }

  const renderInline = () => (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
      <Input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
    </form>
  )

  const renderStacked = () => (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
      <Input
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full"
        required
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Subscribing...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </form>
  )

  const renderCard = () => (
    <div className="max-w-xl mx-auto p-8 bg-card rounded-2xl border shadow-lg">
      {showIcon && (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-primary" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-center mb-2">{title}</h3>
      <p className="text-muted-foreground text-center mb-6">{subtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            buttonText
          )}
        </Button>
      </form>
    </div>
  )

  if (isSubmitted) {
    return (
      <section 
        className="w-full py-12 px-6"
        style={{ backgroundColor }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto text-center p-8"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">You're Subscribed!</h3>
          <p className="text-muted-foreground">{successMessage}</p>
        </motion.div>
      </section>
    )
  }

  return (
    <section 
      className={cn(
        "w-full py-12 px-6",
        style !== 'card' && "text-center"
      )}
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        {style !== 'card' && (
          <>
            {showIcon && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-7 h-7 text-primary" />
              </motion.div>
            )}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold mb-4"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              {subtitle}
            </motion.p>
          </>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {style === 'inline' && renderInline()}
          {style === 'stacked' && renderStacked()}
          {style === 'card' && renderCard()}
        </motion.div>
      </div>
    </section>
  )
}
