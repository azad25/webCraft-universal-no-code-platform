'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles,
  Layers,
  ShoppingCart,
  BarChart3,
  Zap,
  Globe
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
  { name: 'Pricing', href: '/pricing' },
  { name: 'Enterprise', href: '/enterprise' },
  { name: 'Resources', href: '/resources' },
  { name: 'Docs', href: '/docs/index.html', external: true },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b shadow-sm' 
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-bold text-xl">WebCraft</span>
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
                    'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    'hover:bg-accent hover:text-accent-foreground'
                  )}
                  {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {item.name}
                  {item.children && <ChevronDown className="w-4 h-4" />}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-72 bg-card rounded-xl border shadow-xl p-2"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <child.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{child.name}</div>
                            <div className="text-xs text-muted-foreground">{child.description}</div>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="gap-2">
              <Link href="/signup">
                <Sparkles className="w-4 h-4" />
                Start Free
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                      {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                    >
                      {item.name}
                    </Link>
                    {item.children && (
                      <div className="pl-4 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4 px-4 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/signup">Start Free</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
