'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { m, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AnimatedLogo } from '@/components/brand/animated-logo'
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  ShoppingCart,
  BarChart3,
  Zap,
  Globe,
  Users,
  Newspaper,
  Building,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Products',
    href: '#',
    children: [
      { name: 'Website Builder', href: '/products/website', icon: Globe, description: 'Create stunning websites' },
      { name: 'App Builder', href: '/products/apps', icon: Layers, description: 'Build mobile & web apps' },
      { name: 'E-commerce', href: '/products/ecommerce', icon: ShoppingCart, description: 'Launch online stores' },
      { name: 'Automation', href: '/products/automation', icon: Zap, description: 'Automate workflows' },
      { name: 'Analytics', href: '/products/analytics', icon: BarChart3, description: 'Track performance' },
    ]
  },
  { name: 'Templates', href: '/templates' },
  { name: 'Showcase', href: '/showcase' },
  { name: 'Pricing', href: '/pricing' },
  {
    name: 'Company',
    href: '#',
    children: [
      { name: 'About Us', href: '/about', icon: Users, description: 'Our story & team' },
      { name: 'Blog', href: '/blog', icon: Newspaper, description: 'Latest news & updates' },
      { name: 'Careers', href: '/careers', icon: Building, description: 'Join our team' },
      { name: 'Contact', href: '/contact', icon: Mail, description: 'Get in touch' },
    ]
  },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 transition-all duration-300">
      <m.header
        layout
        className={cn(
          "w-full transition-all duration-500 ease-in-out border border-transparent",
          isScrolled
            ? "max-w-5xl bg-slate-900/80 backdrop-blur-xl rounded-full shadow-2xl border-white/10"
            : "max-w-7xl bg-transparent"
        )}
      >
        <nav className={cn(
          "flex items-center justify-between transition-all duration-300",
          isScrolled ? "px-6 py-2" : "px-0 py-4"
        )}>
          {/* Logo */}
          <Link href="/" className="relative z-10 transition-transform hover:scale-105">
            <AnimatedLogo showText={!isScrolled} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300',
                    'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  {item.name}
                  {item.children && <ChevronDown className="w-4 h-4 opacity-50" />}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.name && (
                    <m.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-4 w-72 bg-[#0a0f1e] rounded-2xl border border-white/10 shadow-2xl p-2 overflow-hidden ring-1 ring-white/5"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                            <child.icon className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-white">{child.name}</div>
                            <div className="text-xs text-slate-400 group-hover:text-slate-300">{child.description}</div>
                          </div>
                        </Link>
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10 rounded-full">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="gap-2 rounded-full bg-white text-black hover:bg-slate-200">
              <Link href="/signup">
                <Sparkles className="w-4 h-4" />
                Get Started
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <m.div
              initial={{ opacity: 0, height: 0, borderRadius: "0 0 2rem 2rem" }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/10 bg-[#0a0f1e]/95 backdrop-blur-xl overflow-hidden rounded-b-3xl"
            >
              <div className="p-6 space-y-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <div className="font-medium text-white mb-2 ml-2">{item.name}</div>
                    {item.children && (
                      <div className="space-y-1 pl-4 border-l border-white/10 ml-2">
                        {item.children.map(child => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block py-2 text-sm text-slate-400 hover:text-white"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full rounded-xl border-white/10 text-white hover:bg-white/5" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-500" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.header>
    </div>
  )
}
