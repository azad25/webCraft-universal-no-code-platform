'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Filter,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Clock,
  ArrowRight,
  Palette,
  Layout,
  ShoppingCart,
  Briefcase,
  Camera,
  FileText,
  Star,
  MoreHorizontal,
  Eye,
  Settings,
  Trash2,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

import { useGetAppsQuery } from '@/store/api/apiSlice'

const APP_TYPE_ICONS = {
  website: Globe,
  ecommerce: ShoppingCart,
  business: Briefcase,
  portfolio: Camera,
  blog: FileText,
  landing: Sparkles,
  crm: Users,
  dashboard: BarChart3,
}

const APP_TYPE_COLORS = {
  website: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  ecommerce: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  business: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  portfolio: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
  blog: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  landing: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  crm: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  dashboard: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
}

const QUICK_START_TEMPLATES = [
  {
    id: 'business-landing',
    name: 'Business Landing',
    description: 'Professional landing page for businesses',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    popular: true,
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Complete online store with cart & checkout',
    icon: ShoppingCart,
    color: 'from-green-500 to-teal-600',
    popular: true,
  },
  {
    id: 'portfolio-site',
    name: 'Portfolio Site',
    description: 'Showcase your work and skills',
    icon: Camera,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'blog-site',
    name: 'Blog Site',
    description: 'Content-focused blog with CMS',
    icon: FileText,
    color: 'from-orange-500 to-red-600',
  },
]

export default function AppsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated')

  const { data: appsData, isLoading, error } = useGetAppsQuery({
    page: 1,
    perPage: 20
  })

  const apps = appsData?.apps || []

  const filteredApps = apps.filter((app: any) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || app.app_type === filterType
    return matchesSearch && matchesType
  })

  const sortedApps = [...filteredApps].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const handleCreateApp = (templateId?: string) => {
    if (templateId) {
      router.push(`/dashboard/apps/new?template=${templateId}`)
    } else {
      router.push('/dashboard/apps/new')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading your apps...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Failed to load apps</h3>
            <p className="text-muted-foreground mb-4">There was an error loading your apps. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Apps</h1>
              <p className="text-muted-foreground mt-1">
                Create, manage, and deploy your applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/templates')}
                className="hidden sm:flex"
              >
                <Layout className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
              <Button
                onClick={() => handleCreateApp()}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Start Section */}
        {apps.length === 0 && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to WebCraft</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start building your first application with our professional templates
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_START_TEMPLATES.map((template, index) => {
                const Icon = template.icon
                return (
                  <m.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="card-interactive group relative overflow-hidden"
                      onClick={() => handleCreateApp(template.id)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {template.popular && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                        <div className="flex items-center text-primary mt-3 text-sm font-medium group-hover:translate-x-1 transition-transform">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </m.div>
                )
              })}
            </div>
          </m.div>
        )}

        {/* Apps Section */}
        {apps.length > 0 && (
          <div>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search apps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Updated</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 w-7 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 w-7 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Apps Grid/List */}
            {sortedApps.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No apps found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }
              >
                {sortedApps.map((app: any, index: number) => {
                  const Icon = APP_TYPE_ICONS[app.app_type as keyof typeof APP_TYPE_ICONS] || Globe
                  const typeColor = APP_TYPE_COLORS[app.app_type as keyof typeof APP_TYPE_COLORS] || APP_TYPE_COLORS.website
                  
                  return (
                    <m.div
                      key={app.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="card-interactive group"
                        onClick={() => router.push(`/editor/${app.id}`)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                                  {app.is_published && (
                                    <div className="w-2 h-2 bg-success rounded-full" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-xs ${typeColor}`}>
                                    {app.app_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(app.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/editor/${app.id}`)
                                }}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle preview
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview
                                </DropdownMenuItem>
                                {app.is_published && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle view live
                                  }}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Live
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-2 mb-3">
                            {app.description || `A ${app.app_type} application built with WebCraft`}
                          </CardDescription>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 mr-1" />
                              Updated {formatDate(app.updated_at)}
                            </div>
                            <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                              Edit
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </m.div>
                  )
                })}
              </m.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}