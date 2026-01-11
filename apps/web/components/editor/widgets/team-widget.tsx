'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Twitter, Linkedin, Github, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface TeamMember {
  name: string
  role: string
  image?: string
  bio?: string
  social?: { platform: string; href: string }[]
}

interface TeamWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper' | 'collection'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Team configuration
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
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Team props
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
  // Data source state
  const [teamData, setTeamData] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use static data
  const activeMembers = dataSourceId && teamData.length > 0 ? teamData : members

  // Fetch data from data source
  const fetchTeamData = async () => {
    if (!dataSourceId || (!dataEndpointId && dataSourceType !== 'collection')) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to team format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData.map((item: any) => ({
          name: item.name || item.full_name || 'Team Member',
          role: item.role || item.position || item.title || 'Team Member',
          image: item.image || item.photo || item.avatar || item.picture,
          bio: item.bio || item.description || item.about,
          social: item.social || []
        }))
      } else {
        transformedData = []
      }
      
      setTeamData(transformedData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team data')
      console.error('Failed to fetch team data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && !isEditing) {
      fetchTeamData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchTeamData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId) {
      fetchTeamData()
    }
  }
  return (
    <section className="w-full py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <m.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              {title}
            </m.h2>
            {dataSourceId && (
              <Badge variant="outline" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                {dataSourceType === 'collection' ? 'Collection' : 
                 dataSourceType === 'scraper' ? 'Scraper' : 'API'}
              </Badge>
            )}
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            {subtitle}
          </m.p>
          {dataSourceId && lastRefresh && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          )}
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
          {activeMembers.map((member, index) => (
            <m.div
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
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
