'use client'

import { m, useInView } from 'framer-motion'
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
import { BuilderMockup, AIMockup, AnalyticsMockup, MobileMockup } from './landing-illustrations'

const features = [
  {
    icon: Layers,
    title: 'Visual Drag & Drop',
    description: 'Build complex layouts with intuitive drag-and-drop. No coding required.',
    color: 'from-blue-500 to-cyan-500',
    illustration: BuilderMockup
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Design',
    description: 'Let AI generate content, suggest designs, and optimize your creations.',
    color: 'from-purple-500 to-pink-500',
    illustration: AIMockup
  },
  // ... other features ...
  {
    icon: Smartphone,
    title: 'Mobile-First APIs',
    description: 'Full REST & GraphQL APIs for building native mobile apps.',
    color: 'from-indigo-500 to-violet-500',
    illustration: MobileMockup
  },
  // ...
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track visitors, conversions, and performance in real-time.',
    color: 'from-sky-500 to-blue-500',
    illustration: AnalyticsMockup
  },
  // ...
]

function FeatureCard({ feature, index }: { feature: any, index: number }) {
  // ... existing refs and motion ...

  return (
    <m.div
    // ... props ...
    >
      <div className="h-full relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)] overflow-hidden flex flex-col">

        {/* Illustration Area (Only if exists) */}
        {feature.illustration && (
          <div className="w-full h-48 mb-6 rounded-xl overflow-hidden border border-white/5 bg-black/20 relative z-10 group-hover:scale-105 transition-transform duration-500">
            <feature.illustration />
          </div>
        )}

        {/* Hover Gradient Overlay */}
        {/* ... */}

        {/* Icon & Content */}
        <div className="relative z-10">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg bg-gradient-to-br ring-1 ring-white/20',
            feature.color
          )}>
            <feature.icon className="w-7 h-7" />
          </div>

          <h3 className="font-bold text-xl mb-3 text-white group-hover:text-blue-100 transition-colors">{feature.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {feature.description}
          </p>
        </div>

        {/* Arrow ... */}
      </div>
    </m.div>
  )
}

export function FeaturesSection() {
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true })

  return (
    <section className="py-32 bg-[#0a0f1e] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <m.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            Powerful Features
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">build & scale</span>
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed">
            From simple landing pages to complex business applications,
            WebCraft provides all the tools you need in one platform.
          </p>
        </m.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
          {features.map((feature, index) => {
            // Bento Grid Spanning Logic
            // 0, 1: Large (Half width)
            // 2, 3, 4: Medium (Third width)
            // 5: Large (Full width or Half) -> Large
            // 6: Large
            // ... pattern
            const isLarge = index === 0 || index === 1 || index === 5 || index === 6;
            const spanClass = isLarge ? 'md:col-span-3 lg:col-span-6' : 'md:col-span-2 lg:col-span-4';

            return (
              <div key={feature.title} className={cn("relative group", spanClass)}>
                <FeatureCard feature={feature} index={index} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
