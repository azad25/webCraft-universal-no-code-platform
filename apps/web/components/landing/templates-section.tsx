'use client'

import { motion, useInView } from 'framer-motion'
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
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="absolute right-4 top-4 rounded-full bg-muted px-3 py-1 text-xs font-medium">
        {template.count}+ Templates
      </div>
      <div className={cn(
        "mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
        template.color
      )}>
        <template.icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{template.title}</h3>
      <p className="text-muted-foreground">{template.description}</p>
    </motion.div>
  )
}

export function TemplatesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Beautiful Templates for Every Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            Jumpstart your project with our professionally designed templates, fully customizable to match your brand.
          </motion.p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <TemplateCard key={template.title} template={template} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
          >
            Browse All Templates
          </motion.button>
        </div>
      </div>
    </section>
  )
}
