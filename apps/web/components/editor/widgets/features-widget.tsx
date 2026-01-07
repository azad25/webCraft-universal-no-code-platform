'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Globe, 
  Layers, 
  Smartphone,
  BarChart3,
  Lock,
  Rocket
} from 'lucide-react'

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeaturesWidgetProps {
  title?: string
  subtitle?: string
  features?: Feature[]
  columns?: 2 | 3 | 4
  layout?: 'grid' | 'list' | 'cards'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const ICONS: Record<string, any> = {
  zap: Zap,
  shield: Shield,
  sparkles: Sparkles,
  globe: Globe,
  layers: Layers,
  smartphone: Smartphone,
  chart: BarChart3,
  lock: Lock,
  rocket: Rocket
}

export function FeaturesWidget({
  title = 'Powerful Features',
  subtitle = 'Everything you need to build amazing products',
  features = [
    { icon: 'zap', title: 'Lightning Fast', description: 'Optimized for speed and performance' },
    { icon: 'shield', title: 'Secure by Default', description: 'Enterprise-grade security built-in' },
    { icon: 'sparkles', title: 'AI Powered', description: 'Smart suggestions and automation' },
    { icon: 'globe', title: 'Global CDN', description: 'Deploy worldwide in seconds' },
    { icon: 'layers', title: 'Modular Design', description: 'Build with reusable components' },
    { icon: 'smartphone', title: 'Mobile Ready', description: 'Responsive on all devices' }
  ],
  columns = 3,
  layout = 'grid',
  isEditing,
  isPreview,
  onChange
}: FeaturesWidgetProps) {
  return (
    <section className="w-full py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Features Grid */}
        <div
          className={cn(
            "grid gap-8",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {features.map((feature, index) => {
            const Icon = ICONS[feature.icon] || Zap
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "group p-6 rounded-2xl transition-all duration-300",
                  layout === 'cards' && "bg-card border shadow-sm hover:shadow-lg"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
