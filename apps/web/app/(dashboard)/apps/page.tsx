'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Grid, List, MoreHorizontal, Eye, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useGetAppsQuery } from '@/store/api/apiSlice'
import { Loader2 } from 'lucide-react'

export default function AppsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const { data: appsData, isLoading, error } = useGetAppsQuery({
    page: 1,
    perPage: 20
  })

  const apps = appsData?.apps || []

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAppTypeColor = (type: string) => {
    const colors = {
      website: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      ecommerce: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      crm: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      blog: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      booking: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      business: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Failed to load apps</h3>
          <p className="text-muted-foreground">There was an error loading your apps. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Apps</h1>
          <p className="text-muted-foreground">
            Manage and monitor your applications
          </p>
        </div>
        <Button onClick={() => router.push('/apps/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create App
        </Button>
      </div>

      {/* Search and View Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Apps Grid/List */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-12">
          {apps.length === 0 ? (
            <>
              <h3 className="text-lg font-medium mb-2">No apps yet</h3>
              <p className="text-muted-foreground mb-4">Create your first app to get started</p>
              <Button onClick={() => router.push('/apps/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First App
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-2">No apps found</h3>
              <p className="text-muted-foreground">Try adjusting your search query</p>
            </>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredApps.map((app) => (
            <Card 
              key={app.id} 
              className={`cursor-pointer hover:border-primary transition-colors ${
                viewMode === 'list' ? 'flex items-center' : ''
              }`}
              onClick={() => router.push(`/apps/${app.id}`)}
            >
              <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <Badge variant={app.is_published ? 'default' : 'secondary'}>
                        {app.is_published ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {app.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/apps/${app.id}`)
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/editor/${app.id}`)
                      }}>
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement delete functionality
                          console.log('Delete app:', app.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className={viewMode === 'list' ? 'py-4' : ''}>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getAppTypeColor(app.app_type)}>
                      {app.app_type}
                    </Badge>
                  </div>
                  <span>Updated {formatDate(app.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}