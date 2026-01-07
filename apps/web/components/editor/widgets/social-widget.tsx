'use client'

import { motion } from 'framer-motion'
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Mail, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialLink {
  platform: string
  url: string
}

interface SocialWidgetProps {
  links?: SocialLink[]
  layout?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  style?: 'filled' | 'outline' | 'minimal'
  showLabels?: boolean
  isEditing?: boolean
  onChange?: (props: any) => void
}

const defaultLinks: SocialLink[] = [
  { platform: 'facebook', url: 'https://facebook.com' },
  { platform: 'twitter', url: 'https://twitter.com' },
  { platform: 'instagram', url: 'https://instagram.com' },
  { platform: 'linkedin', url: 'https://linkedin.com' }
]

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  email: Mail,
  website: Globe
}

const platformColors: Record<string, string> = {
  facebook: '#1877f2',
  twitter: '#1da1f2',
  instagram: '#e4405f',
  linkedin: '#0a66c2',
  youtube: '#ff0000',
  github: '#333333',
  email: '#ea4335',
  website: '#4285f4'
}

export function SocialWidget({
  links = defaultLinks,
  layout = 'horizontal',
  size = 'md',
  style = 'filled',
  showLabels = false,
  isEditing = false,
  onChange
}: SocialWidgetProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const getButtonStyle = (platform: string) => {
    const color = platformColors[platform] || '#666666'
    
    switch (style) {
      case 'filled':
        return { backgroundColor: color, color: '#ffffff' }
      case 'outline':
        return { border: `2px solid ${color}`, color: color, backgroundColor: 'transparent' }
      case 'minimal':
        return { color: color, backgroundColor: 'transparent' }
      default:
        return {}
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        layout === 'vertical' ? 'flex-col items-start' : 'flex-row items-center justify-center flex-wrap'
      )}
    >
      {links.map((link, index) => {
        const Icon = platformIcons[link.platform] || Globe
        
        return (
          <motion.a
            key={index}
            href={isEditing ? undefined : link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-full transition-all duration-200",
              sizeClasses[size],
              style === 'minimal' ? 'hover:opacity-70' : 'hover:scale-110',
              showLabels && 'px-4 rounded-lg'
            )}
            style={getButtonStyle(link.platform)}
            whileHover={{ scale: isEditing ? 1 : 1.1 }}
            whileTap={{ scale: isEditing ? 1 : 0.95 }}
            onClick={(e) => isEditing && e.preventDefault()}
          >
            <Icon className={iconSizes[size]} />
            {showLabels && (
              <span className="text-sm font-medium capitalize">{link.platform}</span>
            )}
          </motion.a>
        )
      })}
    </div>
  )
}
