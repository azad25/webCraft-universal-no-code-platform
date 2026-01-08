'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Mail, Loader2, CheckCircle, Sparkles, Database, RefreshCw } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface NewsletterWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Newsletter configuration
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
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Newsletter props
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
  // Data source state
  const [newsletterConfig, setNewsletterConfig] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeTitle = (dataSourceId && newsletterConfig?.title) || title
  const activeSubtitle = (dataSourceId && newsletterConfig?.subtitle) || subtitle
  const activePlaceholder = (dataSourceId && newsletterConfig?.placeholder) || placeholder
  const activeButtonText = (dataSourceId && newsletterConfig?.buttonText) || buttonText
  const activeSuccessMessage = (dataSourceId && newsletterConfig?.successMessage) || successMessage

  // Fetch data from data source
  const fetchNewsletterConfig = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoadingData(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to newsletter config format
      let transformedData = response.data
      if (Array.isArray(transformedData) && transformedData.length > 0) {
        transformedData = transformedData[0] // Use first item for newsletter config
      }
      
      if (transformedData && typeof transformedData === 'object') {
        setNewsletterConfig({
          title: transformedData.title || transformedData.newsletter_title,
          subtitle: transformedData.subtitle || transformedData.description,
          placeholder: transformedData.placeholder || transformedData.email_placeholder,
          buttonText: transformedData.buttonText || transformedData.cta || transformedData.button,
          successMessage: transformedData.successMessage || transformedData.success_text
        })
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletter config')
      console.error('Failed to fetch newsletter config:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchNewsletterConfig()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchNewsletterConfig, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchNewsletterConfig()
    }
  }

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
        placeholder={activePlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          activeButtonText
        )}
      </Button>
    </form>
  )

  const renderStacked = () => (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
      <Input
        type="email"
        placeholder={activePlaceholder}
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
            {activeButtonText}
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
      <div className="flex items-center justify-center gap-4 mb-2">
        <h3 className="text-xl font-semibold text-center">{activeTitle}</h3>
        {dataSourceId && (
          <Badge variant="outline" className="text-xs">
            <Database className="w-3 h-3 mr-1" />
            {dataSourceType === 'collection' ? 'Collection' : 
             dataSourceType === 'scraper' ? 'Scraper' : 'API'}
          </Badge>
        )}
        {isLoadingData && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-muted-foreground text-center mb-6">{activeSubtitle}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={activePlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            activeButtonText
          )}
        </Button>
      </form>
      {dataSourceId && lastRefresh && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xs text-muted-foreground">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoadingData}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      )}
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
          <p className="text-muted-foreground">{activeSuccessMessage}</p>
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
              {activeTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              {activeSubtitle}
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
