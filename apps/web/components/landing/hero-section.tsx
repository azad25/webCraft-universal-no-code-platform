'use client'

import React from 'react'
import Link from 'next/link'
import { m, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Zap, Globe, Smartphone, Star } from 'lucide-react'
import { TypewriterEffect } from '@/components/ui/typewriter-effect'
import { CircuitBackground } from '@/components/auth/CircuitBackground'

const appTypes = [
  "Websites",
  "Mobile Apps",
  "E-commerce Stores",
  "CRM Systems",
  "ERP Solutions",
  "Booking Platforms",
  "Inventory Systems",
  "Project Management",
  "Social Platforms"
]

export function HeroSection() {
  const { scrollY } = useScroll()

  // Parallax effects
  const yBg = useTransform(scrollY, [0, 1000], [0, 400])
  const yText = useTransform(scrollY, [0, 500], [0, 100])
  const opacityText = useTransform(scrollY, [0, 300], [1, 0])
  const scaleText = useTransform(scrollY, [0, 300], [1, 0.95])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0f1e] pt-20">

      {/* Animated Background with Parallax */}
      <m.div
        style={{ y: yBg, translateZ: 0 }}
        className="absolute inset-0 z-0 will-change-transform"
      >
        <div className="opacity-40">
          <CircuitBackground />
        </div>
        {/* Additional gradient blobs for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(37,99,235,0.2)_0%,transparent_70%)] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(147,51,234,0.1)_0%,transparent_70%)] mix-blend-screen" />
      </m.div>

      <div className="container mx-auto px-4 relative z-10">
        <m.div
          style={{ y: yText, opacity: opacityText, scale: scaleText, translateZ: 0 }}
          className="text-center max-w-5xl mx-auto will-change-transform"
        >
          {/* Badge */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <Badge variant="secondary" className="glass-card px-4 py-2 text-sm font-medium text-slate-200 bg-white/10 hover:bg-white/20 border-white/10">
              <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
              AI-Powered • No-Code • Universal Platform
            </Badge>
          </m.div>

          {/* Main Headline */}
          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white"
          >
            Build{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
              Anything
            </span>
            <br />
            with No-Code
          </m.h1>

          {/* Typewriter Effect for App Types */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <div className="text-xl md:text-2xl text-slate-300 mb-4 flex items-center justify-center gap-2">
              <span>Create professional</span>
              <TypewriterEffect
                words={appTypes}
                className="text-blue-400 font-semibold"
                cursorClassName="bg-blue-500"
              />
            </div>
          </m.div>

          {/* Description */}
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            From simple websites to complex business applications, our AI-powered platform
            lets you build, customize, and deploy anything with drag-and-drop simplicity.
            No coding required, unlimited possibilities.
          </m.p>

          {/* CTA Buttons */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-8 rounded-full text-lg gap-2 bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
            >
              <Link href="/signup">
                Start Building Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full text-lg gap-2 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all hover:scale-105"
            >
              <Link href="/demo">
                Watch Demo
                <Zap className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </m.div>

          {/* Feature Highlights */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="glass-card p-6 rounded-2xl card-hover bg-slate-900/40 border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-blue-500/30">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">Web & Mobile</h3>
              <p className="text-slate-400 text-sm">
                Build responsive websites and mobile apps with the same codebase
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl card-hover bg-slate-900/40 border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-purple-500/30">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">AI-Powered</h3>
              <p className="text-slate-400 text-sm">
                Generate content, designs, and code with advanced AI assistance
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl card-hover bg-slate-900/40 border-white/10">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto border border-pink-500/30">
                <Smartphone className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">API-First</h3>
              <p className="text-slate-400 text-sm">
                Full API access for custom mobile apps and integrations
              </p>
            </div>
          </m.div>

          {/* Stats */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto border-t border-white/5 pt-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">50K+</div>
              <div className="text-sm text-slate-400">Apps Built</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">200+</div>
              <div className="text-sm text-slate-400">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-slate-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-slate-400">Support</div>
            </div>
          </m.div>
        </m.div>
      </div>

      {/* Scroll Indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <m.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-slate-500/30 rounded-full flex justify-center"
        >
          <m.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-slate-500/50 rounded-full mt-2"
          />
        </m.div>
      </m.div>
    </section>
  )
}