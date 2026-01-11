'use client'

import { m, useInView } from 'framer-motion'
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

// Duplicate for infinite scroll
const allTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials]

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <div
      className="w-[350px] md:w-[450px] bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-2xl flex-shrink-0 mx-4 hover:border-blue-500/20 transition-colors"
    >
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <h4 className="font-bold text-lg text-white">{testimonial.name}</h4>
          <p className="text-sm text-blue-400">{testimonial.role}</p>
        </div>
        <Quote className="h-8 w-8 text-white/10" />
      </div>

      <p className="text-slate-300 mb-6 italic leading-relaxed text-lg">"{testimonial.content}"</p>

      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < testimonial.rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-slate-700'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const ref = useRef(null)

  return (
    <section ref={ref} className="py-32 bg-[#0a0f1e] overflow-hidden relative">
      {/* Side Fades for Marquee */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0f1e] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0f1e] to-transparent z-10" />

      <div className="container mx-auto px-4 mb-20">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Loved by Developers & Designers</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Join thousands of satisfied users who have transformed their workflow with our platform.
          </p>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="flex overflow-hidden">
        <m.div
          className="flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {allTestimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </m.div>
      </div>
    </section>
  )
}

export default TestimonialsSection
