'use client'

import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileCode, LayoutGrid, Smartphone, Palette, Code2, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const templates = [
  {
    icon: LayoutGrid,
    title: 'Landing Pages',
    description: 'Beautiful, conversion-focused landing page templates for any purpose.',
    count: 12,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile Apps',
    description: 'Responsive app templates that work perfectly on all devices.',
    count: 8,
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Palette,
    title: 'Dashboards',
    description: 'Data-rich dashboard templates with charts and analytics.',
    count: 6,
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FileCode,
    title: 'Portfolio',
    description: 'Showcase your work with stunning portfolio templates.',
    count: 10,
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Code2,
    title: 'Developer Docs',
    description: 'Clean, organized templates for technical documentation.',
    count: 5,
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Database,
    title: 'Admin Panels',
    description: 'Powerful admin templates with data management features.',
    count: 7,
    color: 'from-yellow-500 to-amber-500',
  },
]

type TemplateCardProps = {
  template: typeof templates[0]
  index: number
}

function TemplateCard({ template, index }: TemplateCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-8 shadow-sm transition-all hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1"
    >
      <div className="absolute right-4 top-4 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
        {template.count}+ Templates
      </div>
      <div className={cn(
        "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-inner",
        template.color
      )}>
        <template.icon className="h-7 w-7" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{template.title}</h3>
      <p className="text-slate-400 leading-relaxed">{template.description}</p>
    </m.div>
  )
}

export function TemplatesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 bg-[#0d1226] relative">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Beautiful Templates for Every Need
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-400"
          >
            Jumpstart your project with our professionally designed templates,
            fully customizable to match your brand style.
          </m.p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <TemplateCard key={template.title} template={template} index={index} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <m.button
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-white/10 border border-white/10 px-8 py-4 text-base font-medium text-white shadow-lg transition-all hover:bg-white/20 hover:scale-105 backdrop-blur-md"
          >
            Browse All Templates
          </m.button>
        </div>
      </div>
    </section>
  )
}
