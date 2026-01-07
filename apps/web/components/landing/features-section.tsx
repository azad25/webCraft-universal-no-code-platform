'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Layers, 
  Sparkles, 
  Zap, 
  Globe, 
  Shield, 
  Users,
  Smartphone,
  BarChart3,
  Palette,
  Code2,
  Database,
  Cloud
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Layers,
    title: 'Visual Drag & Drop',
    description: 'Build complex layouts with intuitive drag-and-drop. No coding required.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Design',
    description: 'Let AI generate content, suggest designs, and optimize your creations.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Connect with n8n to automate tasks, sync data, and trigger actions.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Globe,
    title: 'SEO Optimized',
    description: 'Built-in SEO tools, structured data, and AI-crawler optimization.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First APIs',
    description: 'Full REST & GraphQL APIs for building native mobile apps.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'Work together with live cursors, comments, and instant sync.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Palette,
    title: 'Design System',
    description: 'Consistent theming with customizable design tokens and components.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Database,
    title: 'Built-in Database',
    description: 'Store and manage data with our integrated database solution.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with SSO, RBAC, and audit logging.',
    color: 'from-slate-500 to-zinc-500',
  },
  {
    icon: Code2,
    title: 'Custom Code',
    description: 'Extend with custom HTML, CSS, and JavaScript when needed.',
    color: 'from-lime-500 to-green-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track visitors, conversions, and performance in real-time.',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: Cloud,
    title: 'Global CDN',
    description: 'Lightning-fast delivery with edge caching worldwide.',
    color: 'from-violet-500 to-purple-500',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative p-6 rounded-2xl bg-card border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Gradient Background on Hover */}
        <div className={cn(
          'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br',
          feature.color
        )} />
        
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white',
          feature.color
        )}>
          <feature.icon className="w-6 h-6" />
        </div>
        
        {/* Content */}
        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })

  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to{' '}
            <span className="gradient-text">build & scale</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From simple landing pages to complex business applications, 
            WebCraft provides all the tools you need in one platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
