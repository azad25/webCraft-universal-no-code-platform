'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  rating?: number
}

interface TestimonialWidgetProps {
  title?: string
  subtitle?: string
  testimonials?: Testimonial[]
  layout?: 'grid' | 'carousel' | 'single'
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function TestimonialWidget({
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
  return (
    <section className="w-full py-20 px-6 bg-muted/30">
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
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
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
