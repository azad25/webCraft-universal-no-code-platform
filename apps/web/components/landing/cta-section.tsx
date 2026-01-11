'use client'

import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="relative overflow-hidden py-32 bg-[#0a0f1e] flex items-center justify-center">
      {/* Massive Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('/grid-pattern.svg')] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500/10 text-blue-300 mb-8 border border-blue-500/20">
            <Zap className="h-4 w-4 mr-2 text-blue-400 fill-blue-400" />
            <span className="text-sm font-semibold tracking-wide uppercase">Ready to launch</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight">
            Build your dream <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">without limits.</span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of creators who are building the future with WebCraft. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button
              size="lg"
              className="bg-white text-slate-950 hover:bg-slate-100 font-bold px-10 py-8 text-xl rounded-2xl shadow-xl shadow-white/5 transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-white/10 hover:bg-white/5 text-white font-semibold px-10 py-8 text-xl rounded-2xl transition-all"
            >
              Book a Demo
            </Button>
          </div>

          <div className="mt-10 text-sm text-slate-500 font-medium">
            <p>14-day free trial • Cancel anytime • No lock-in</p>
          </div>
        </m.div>
      </div>
    </section>
  )
}

export default CTASection
