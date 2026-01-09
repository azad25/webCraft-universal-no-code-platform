'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Star, Quote, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  rating?: number
}

interface TestimonialWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Testimonial configuration
  title?: string
  subtitle?: string
  testimonials?: Testimonial[]
  layout?: 'grid' | 'carousel' | 'single'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function TestimonialWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Testimonial props
  title = 'What Our Customers Say',
  subtitle = 'Join thousands of satisfied users',
  testimonials = [
    {
      quote: 'This platform has completely transformed how we build websites. The drag-and-drop editor is incredibly intuitive.',
      author: 'Sarah Johnson',
      role: 'CEO',
      company: 'TechStart Inc.',
      rating: 5
    },
    {
      quote: 'We reduced our development time by 80%. The templates and components are top-notch quality.',
      author: 'Michael Chen',
      role: 'Product Manager',
      company: 'InnovateCo',
      rating: 5
    },
    {
      quote: 'The best no-code platform I have ever used. Customer support is amazing and features keep getting better.',
      author: 'Emily Davis',
      role: 'Founder',
      company: 'DesignLab',
      rating: 5
    }
  ],
  layout = 'grid',
  isEditing,
  isPreview,
  onChange
}: TestimonialWidgetProps) {
  // Data source state
  const [testimonialData, setTestimonialData] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeTestimonials = dataSourceId && testimonialData.length > 0 ? testimonialData : testimonials

  // Fetch data from data source
  const fetchTestimonialData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId || '', {}, true)
      
      // Transform API response to testimonial format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          quote: item.quote || item.testimonial || item.review || item.comment || item.content,
          author: item.author || item.name || item.customer_name || 'Anonymous',
          role: item.role || item.position || item.title || '',
          company: item.company || item.organization || item.business || '',
          avatar: item.avatar || item.image || item.photo,
          rating: parseInt(item.rating || item.stars || item.score || 5)
        }))
      } else {
        transformedData = []
      }
      
      setTestimonialData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch testimonial data')
      console.error('Failed to fetch testimonial data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchTestimonialData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchTestimonialData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchTestimonialData()
    }
  }

  // Loading state
  if (isLoading && activeTestimonials.length === 0 && !isEditing) {
    return (
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
      </section>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <section className="w-full py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <Database className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load testimonials</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </section>
    )
  }
  return (
    <section className="w-full py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              {title}
            </motion.h2>
            {dataSourceId && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                {dataSourceType === 'collection' ? 'Collection' : 
                 dataSourceType === 'scraper' ? 'Scraper' : 'API'}
              </Badge>
            )}
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
          {dataSourceId && lastRefresh && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-6 rounded-2xl border shadow-sm"
            >
              {/* Rating */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}

              {/* Quote */}
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/10" />
                <p className="text-muted-foreground relative z-10 pl-4">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
