'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Product Manager at TechCorp',
    content: 'This page builder has transformed how we create and manage our web presence. The intuitive interface and powerful features save us countless hours of development time.',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Founder of StartupX',
    content: 'As a non-technical founder, I was able to create a professional-looking website in just a few hours. The templates are beautiful and the customization options are endless.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Marketing Director at BrandCo',
    content: 'The speed and performance of the pages we build are outstanding. Our bounce rates have dropped significantly since we started using this tool.',
    rating: 4
  }
]

type TestimonialCardProps = {
  testimonial: typeof testimonials[0]
  index: number
}

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col h-full"
    >
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{testimonial.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
        </div>
        <Quote className="h-6 w-6 text-gray-300 dark:text-gray-600" />
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4 flex-1">"{testimonial.content}"</p>
      
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-5 w-5',
              i < testimonial.rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Loved by Developers & Designers</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their workflow with our page builder
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
