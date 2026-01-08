'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Zap, Sparkles, Code, Server, BarChart, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tiers = [
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '#',
    priceMonthly: '$29',
    description: 'Perfect for small projects and individuals',
    features: [
      'Up to 5 websites',
      'Basic templates',
      'Email support',
      '1GB storage',
      'Basic analytics',
    ],
    featured: false,
    icon: Zap,
  },
  {
    name: 'Professional',
    id: 'tier-professional',
    href: '#',
    priceMonthly: '$99',
    description: 'For growing businesses and professionals',
    features: [
      'Up to 20 websites',
      'Premium templates',
      'Priority support',
      '10GB storage',
      'Advanced analytics',
      'API access',
      'Custom domains',
    ],
    featured: true,
    icon: Sparkles,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited websites',
      'All templates',
      '24/7 dedicated support',
      'Unlimited storage',
      'Advanced analytics',
      'API access',
      'Custom domains',
      'SSO & SAML',
      'Custom integrations',
    ],
    featured: false,
    icon: Server,
  },
]

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type PricingCardProps = {
  tier: typeof tiers[0]
  index: number
}

function PricingCard({ tier, index }: PricingCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl border p-8',
        tier.featured
          ? 'border-2 border-primary bg-primary/5 shadow-lg'
          : 'border-gray-200 bg-white',
      )}
    >
      {tier.featured && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-4 py-1.5 text-sm font-medium text-white">
          Most popular
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center">
          <tier.icon
            className={cn(
              'h-8 w-8',
              tier.featured ? 'text-primary' : 'text-gray-900',
            )}
            aria-hidden="true"
          />
          <h3
            className={cn(
              'ml-3 text-2xl font-bold',
              tier.featured ? 'text-primary' : 'text-gray-900',
            )}
          >
            {tier.name}
          </h3>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {tier.description}
        </p>
        <p className="mt-6 flex items-baseline gap-x-1">
          <span className="text-4xl font-bold tracking-tight text-gray-900">
            {tier.priceMonthly}
          </span>
          <span className="text-sm font-semibold leading-6 text-gray-600">
            {tier.priceMonthly !== 'Custom' && '/month'}
          </span>
        </p>
        <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
          {tier.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon className="h-6 w-5 flex-none text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <Button
        className={cn(
          'mt-auto',
          tier.featured
            ? 'bg-primary hover:bg-primary/90'
            : 'bg-gray-900 text-white hover:bg-gray-800',
        )}
      >
        Get started
      </Button>
    </motion.div>
  )
}

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      id="pricing"
      className="bg-gradient-to-b from-background to-muted/20 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            Choose an affordable plan that's packed with the best features for
            engaging your audience, creating customer loyalty, and driving sales.
          </motion.p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <PricingCard key={tier.id} tier={tier} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-lg bg-muted/50 p-6"
          >
            <h3 className="text-lg font-medium">Need something else?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We offer custom solutions for large teams and enterprises.
            </p>
            <Button variant="outline" className="mt-4">
              Contact sales
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
