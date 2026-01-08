'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, Mic, Camera, MapPin, Clock, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface SearchResult {
  id: string
  title: string
  description: string
  url?: string
  image?: string
  category?: string
  date?: string
}

interface SearchWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Search configuration
  placeholder?: string
  showFilters?: boolean
  showVoiceSearch?: boolean
  showImageSearch?: boolean
  showLocationSearch?: boolean
  showRecentSearches?: boolean
  layout?: 'horizontal' | 'vertical' | 'compact'
  categories?: string[]
  recentSearches?: string[]
  results?: SearchResult[]
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function SearchWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Search props
  placeholder = 'Search...',
  showFilters = true,
  showVoiceSearch = false,
  showImageSearch = false,
  showLocationSearch = false,
  showRecentSearches = true,
  layout = 'horizontal',
  categories = ['All', 'Products', 'Articles', 'Videos', 'Images'],
  recentSearches = ['React components', 'Next.js tutorial', 'UI design'],
  results = [
    {
      id: '1',
      title: 'Getting Started with React',
      description: 'Learn the basics of React development with this comprehensive guide.',
      url: '#',
      category: 'Articles',
      date: '2 days ago'
    },
    {
      id: '2',
      title: 'Advanced Next.js Patterns',
      description: 'Explore advanced patterns and techniques for Next.js applications.',
      url: '#',
      category: 'Articles',
      date: '1 week ago'
    }
  ],
  isEditing = false,
  onChange
}: SearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showResults, setShowResults] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  // Data source state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source results if available, otherwise use static results
  const activeResults = dataSourceId && searchResults.length > 0 ? searchResults : results

  // Fetch search results from data source
  const fetchSearchResults = async (query?: string) => {
    if (!dataSourceId || !dataEndpointId) return

    setIsLoading(true)
    setError(null)
    
    try {
      const params = query ? { q: query, query: query, search: query } : {}
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, params, true)
      
      // Transform API response to search result format
      let transformedResults = response.data
      if (Array.isArray(transformedResults)) {
        transformedResults = transformedResults.map((item: any, index: number) => ({
          id: item.id || `result-${index}`,
          title: item.title || item.name || item.headline || 'Untitled',
          description: item.description || item.summary || item.content || '',
          url: item.url || item.link || '#',
          image: item.image || item.thumbnail,
          category: item.category || item.type,
          date: item.date || item.created_at || item.published_at
        }))
      } else if (transformedResults && typeof transformedResults === 'object') {
        // Single result
        const item = transformedResults as any
        transformedResults = [{
          id: item.id || 'result-1',
          title: item.title || item.name || 'Untitled',
          description: item.description || item.summary || '',
          url: item.url || item.link || '#',
          image: item.image || item.thumbnail,
          category: item.category || item.type,
          date: item.date || item.created_at
        }]
      } else {
        transformedResults = []
      }
      
      setSearchResults(transformedResults)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch search results')
      console.error('Failed to fetch search results:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && dataEndpointId && !isEditing) {
      fetchSearchResults()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(() => fetchSearchResults(searchQuery), refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, searchQuery, isEditing])

  const handleRefresh = () => {
    if (dataSourceId && dataEndpointId) {
      fetchSearchResults(searchQuery)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(query.length > 0)
    
    // Fetch from data source if available
    if (dataSourceId && dataEndpointId && query.length > 0) {
      fetchSearchResults(query)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowResults(false)
  }

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleSearch(transcript)
      }
      recognition.start()
    }
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Search className="w-5 h-5" />
          Edit Search
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Placeholder Text</Label>
            <Input
              value={placeholder}
              onChange={(e) => handleInputChange('placeholder', e.target.value)}
              placeholder="Enter placeholder text"
            />
          </div>
          
          <div>
            <Label>Layout</Label>
            <Select value={layout} onValueChange={(value) => handleInputChange('layout', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showFilters"
                  checked={showFilters}
                  onCheckedChange={(checked: boolean) => handleInputChange('showFilters', checked)}
                />
                <Label htmlFor="showFilters">Show category filters</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showVoiceSearch"
                  checked={showVoiceSearch}
                  onCheckedChange={(checked: boolean) => handleInputChange('showVoiceSearch', checked)}
                />
                <Label htmlFor="showVoiceSearch">Voice search</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showImageSearch"
                  checked={showImageSearch}
                  onCheckedChange={(checked: boolean) => handleInputChange('showImageSearch', checked)}
                />
                <Label htmlFor="showImageSearch">Image search</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showLocationSearch"
                  checked={showLocationSearch}
                  onCheckedChange={(checked: boolean) => handleInputChange('showLocationSearch', checked)}
                />
                <Label htmlFor="showLocationSearch">Location search</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showRecentSearches"
                  checked={showRecentSearches}
                  onCheckedChange={(checked: boolean) => handleInputChange('showRecentSearches', checked)}
                />
                <Label htmlFor="showRecentSearches">Recent searches</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (layout === 'compact') {
    return (
      <div className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "w-full space-y-4",
      layout === 'vertical' ? "max-w-md" : "max-w-4xl"
    )}>
      {/* Search Input */}
      <div className={cn(
        "flex gap-2",
        layout === 'vertical' && "flex-col"
      )}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-20"
          />
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {showVoiceSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoiceSearch}
                className={cn(
                  "h-6 w-6 p-0",
                  isListening && "text-red-500"
                )}
              >
                <Mic className="w-3 h-3" />
              </Button>
            )}
            
            {showImageSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Camera className="w-3 h-3" />
              </Button>
            )}
            
            {showLocationSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <MapPin className="w-3 h-3" />
              </Button>
            )}
            
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        <Button>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {showRecentSearches && !showResults && recentSearches.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSearch(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {showResults && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {isLoading ? 'Searching...' : `${activeResults.length} results for "${searchQuery}"`}
                </span>
                {dataSourceId && (
                  <Badge variant="outline" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    {dataSourceType === 'scraper' ? 'Scraper' : 'API'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {dataSourceId && (
                  <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-600 mb-2">Failed to search</p>
                <p className="text-xs text-gray-500 mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : activeResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">No results found</p>
                <p className="text-xs text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeResults.map((result) => (
                  <div key={result.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      {result.image && (
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-16 h-16 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-blue-600 hover:underline cursor-pointer truncate">
                          {result.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          {result.category && (
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                          )}
                          {result.date && (
                            <span>{result.date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}