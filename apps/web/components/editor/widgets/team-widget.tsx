'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Twitter, Linkedin, Github } from 'lucide-react'

interface TeamMember {
  name: string
  role: string
  image?: string
  bio?: string
  social?: { platform: string; href: string }[]
}

interface TeamWidgetProps {
  title?: string
  subtitle?: string
  members?: TeamMember[]
  columns?: 2 | 3 | 4
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const SOCIAL_ICONS: Record<string, any> = {
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github
}

export function TeamWidget({
  title = 'Meet Our Team',
  subtitle = 'The people behind the product',
  members = [
    { name: 'Alex Johnson', role: 'CEO & Founder', social: [{ platform: 'twitter', href: '#' }, { platform: 'linkedin', href: '#' }] },
    { name: 'Sarah Chen', role: 'CTO', social: [{ platform: 'github', href: '#' }, { platform: 'linkedin', href: '#' }] },
    { name: 'Mike Williams', role: 'Head of Design', social: [{ platform: 'twitter', href: '#' }] },
    { name: 'Emily Davis', role: 'Head of Marketing', social: [{ platform: 'linkedin', href: '#' }] }
  ],
  columns = 4,
  isEditing,
  isPreview,
  onChange
}: TeamWidgetProps) {
  return (
    <section className="w-full py-20 px-6">
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

        {/* Team Grid */}
        <div
          className={cn(
            "grid gap-8",
            columns === 2 && "grid-cols-1 md:grid-cols-2",
            columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              {/* Avatar */}
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              
              {/* Info */}
              <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
              <p className="text-muted-foreground text-sm mb-3">{member.role}</p>
              
              {/* Social Links */}
              {member.social && (
                <div className="flex justify-center gap-2">
                  {member.social.map((social, socialIndex) => {
                    const Icon = SOCIAL_ICONS[social.platform] || Twitter
                    return (
                      <a
                        key={socialIndex}
                        href={social.href}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    )
                  })}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
