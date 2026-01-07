'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface NavItem {
  label: string
  href: string
}

interface NavbarWidgetProps {
  logo?: string
  logoText?: string
  items?: NavItem[]
  ctaText?: string
  ctaLink?: string
  sticky?: boolean
  transparent?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function NavbarWidget({
  logo,
  logoText = 'WebCraft',
  items = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ],
  ctaText = 'Get Started',
  ctaLink = '#',
  sticky = true,
  transparent = false,
  isEditing,
  isPreview,
  onChange
}: NavbarWidgetProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      className={cn(
        "w-full py-4 px-6",
        transparent ? "bg-transparent" : "bg-background border-b",
        sticky && "sticky top-0 z-50"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button asChild>
            <a href={ctaLink}>{ctaText}</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
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
            className="md:hidden mt-4 pb-4 border-t"
          >
            <div className="flex flex-col gap-2 pt-4">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 pt-2">
                <Button className="w-full" asChild>
                  <a href={ctaLink}>{ctaText}</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
