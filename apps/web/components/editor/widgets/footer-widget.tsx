'use client'

import { cn } from '@/lib/utils'
import { Twitter, Github, Linkedin, Instagram, Youtube, Facebook } from 'lucide-react'

interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

interface FooterWidgetProps {
  logo?: string
  logoText?: string
  description?: string
  columns?: FooterColumn[]
  socialLinks?: { platform: string; href: string }[]
  copyright?: string
  backgroundColor?: string
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const SOCIAL_ICONS: Record<string, any> = {
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook
}

export function FooterWidget({
  logo,
  logoText = 'WebCraft',
  description = 'Build beautiful websites and apps with our no-code platform.',
  columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Templates', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Status', href: '#' }
      ]
    }
  ],
  socialLinks = [
    { platform: 'twitter', href: '#' },
    { platform: 'github', href: '#' },
    { platform: 'linkedin', href: '#' }
  ],
  copyright = `© ${new Date().getFullYear()} WebCraft. All rights reserved.`,
  backgroundColor = '#0f172a',
  isEditing,
  isPreview,
  onChange
}: FooterWidgetProps) {
  return (
    <footer
      className="w-full py-12 px-6 text-white"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {logo ? (
                <img src={logo} alt={logoText} className="h-8" />
              ) : (
                <span className="text-xl font-bold">{logoText}</span>
              )}
            </div>
            <p className="text-white/70 text-sm mb-4 max-w-xs">
              {description}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = SOCIAL_ICONS[social.platform] || Twitter
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 text-center text-sm text-white/50">
          {copyright}
        </div>
      </div>
    </footer>
  )
}
