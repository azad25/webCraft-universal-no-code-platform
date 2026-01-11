'use client'

import { m, useInView } from 'framer-motion'
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
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-300',
        tier.featured
          ? 'border-blue-500 bg-slate-900/80 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] z-10 scale-105'
          : 'border-white/10 bg-white/5 hover:border-white/20',
      )}
    >
      {tier.featured && (
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg">
          Most popular
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center">
          <tier.icon
            className={cn(
              'h-8 w-8',
              tier.featured ? 'text-blue-400' : 'text-slate-400',
            )}
            aria-hidden="true"
          />
          <h3
            className={cn(
              'ml-3 text-2xl font-bold',
              tier.featured ? 'text-white' : 'text-white',
            )}
          >
            {tier.name}
          </h3>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          {tier.description}
        </p>
        <p className="mt-6 flex items-baseline gap-x-1">
          <span className="text-5xl font-bold tracking-tight text-white">
            {tier.priceMonthly}
          </span>
          <span className="text-sm font-semibold leading-6 text-slate-500">
            {tier.priceMonthly !== 'Custom' && '/month'}
          </span>
        </p>
        <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-300">
          {tier.features.map((feature) => (
            <li key={feature} className="flex gap-x-3 items-start">
              <CheckIcon className={cn("h-6 w-5 flex-none", tier.featured ? "text-blue-400" : "text-slate-500")} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <Button
        className={cn(
          'mt-auto w-full py-6 text-lg rounded-xl transition-all',
          tier.featured
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
            : 'bg-white/10 text-white hover:bg-white/20',
        )}
      >
        Get started
      </Button>
    </m.div>
  )
}

export function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      id="pricing"
      className="bg-[#0a0f1e] py-16 sm:py-24 relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            Simple, transparent pricing
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-400"
          >
            Choose an affordable plan that's packed with the best features for
            engaging your audience, creating customer loyalty, and driving sales.
          </m.p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <PricingCard key={tier.id} tier={tier} index={index} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-block rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md"
          >
            <h3 className="text-xl font-medium text-white">Need something else?</h3>
            <p className="mt-2 text-slate-400">
              We offer custom solutions for large teams and enterprises.
            </p>
            <Button variant="outline" className="mt-6 border-white/20 text-white hover:bg-white/10 hover:text-white">
              Contact sales
            </Button>
          </m.div>
        </div>
      </div>
    </section>
  )
}
