'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Database, RefreshCw, Loader2 } from 'lucide-react'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  features: { text: string; included: boolean }[]
  buttonText: string
  buttonLink: string
  popular?: boolean
}

interface PricingWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Pricing configuration
  title?: string
  subtitle?: string
  plans?: PricingPlan[]
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function PricingWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Pricing props
  title = 'Simple, Transparent Pricing',
  subtitle = 'Choose the plan that works best for you',
  plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        { text: '1 Website', included: true },
        { text: '1GB Storage', included: true },
        { text: 'Basic Templates', included: true },
        { text: 'Community Support', included: true },
        { text: 'Custom Domain', included: false },
        { text: 'Analytics', included: false }
      ],
      buttonText: 'Get Started',
      buttonLink: '#'
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'Best for professionals',
      features: [
        { text: 'Unlimited Websites', included: true },
        { text: '50GB Storage', included: true },
        { text: 'Premium Templates', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Custom Domain', included: true },
        { text: 'Advanced Analytics', included: true }
      ],
      buttonText: 'Start Free Trial',
      buttonLink: '#',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large teams',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited Storage', included: true },
        { text: 'White Label', included: true },
        { text: 'Dedicated Support', included: true },
        { text: 'SLA Guarantee', included: true },
        { text: 'Custom Integrations', included: true }
      ],
      buttonText: 'Contact Sales',
      buttonLink: '#'
    }
  ],
  isEditing,
  isPreview,
  onChange
}: PricingWidgetProps) {
  // Data source state
  const [pricingData, setPricingData] = useState<PricingPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activePlans = dataSourceId && pricingData.length > 0 ? pricingData : plans

  // Fetch data from data source
  const fetchPricingData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to pricing format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          name: item.name || item.title || item.plan_name || 'Plan',
          price: item.price || item.cost || item.amount || '$0',
          period: item.period || item.billing_period || '/month',
          description: item.description || item.subtitle || 'Plan description',
          features: item.features || [],
          buttonText: item.buttonText || item.cta || item.button || 'Get Started',
          buttonLink: item.buttonLink || item.link || item.url || '#',
          popular: item.popular || item.recommended || false
        }))
      } else {
        transformedData = []
      }
      
      setPricingData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing data')
      console.error('Failed to fetch pricing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchPricingData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchPricingData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchPricingData()
    }
  }
  return (
    <section className="w-full py-20 px-6">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activePlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative p-8 rounded-2xl border bg-card",
                plan.popular && "border-primary shadow-lg scale-105"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm",
                      !feature.included && "text-muted-foreground/50"
                    )}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <a href={plan.buttonLink}>{plan.buttonText}</a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
