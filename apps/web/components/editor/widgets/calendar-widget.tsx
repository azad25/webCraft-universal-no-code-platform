'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Users, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  location?: string
  description?: string
  color?: string
  attendees?: number
}

interface CalendarWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Calendar configuration
  events?: CalendarEvent[]
  view?: 'month' | 'week' | 'agenda' | 'mini'
  showEventDetails?: boolean
  showAddEvent?: boolean
  allowEventClick?: boolean
  primaryColor?: string
  title?: string
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function CalendarWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Calendar props
  events = [
    {
      id: '1',
      title: 'Team Meeting',
      date: '2024-01-15',
      time: '10:00 AM',
      location: 'Conference Room A',
      description: 'Weekly team sync',
      color: 'blue',
      attendees: 8
    },
    {
      id: '2',
      title: 'Product Launch',
      date: '2024-01-20',
      time: '2:00 PM',
      location: 'Main Auditorium',
      description: 'New product announcement',
      color: 'green',
      attendees: 50
    },
    {
      id: '3',
      title: 'Workshop',
      date: '2024-01-25',
      time: '9:00 AM',
      description: 'Design thinking workshop',
      color: 'purple',
      attendees: 15
    }
  ],
  view = 'month',
  showEventDetails = true,
  showAddEvent = true,
  allowEventClick = true,
  primaryColor = 'blue',
  title = 'Calendar',
  isEditing = false,
  onChange
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  // Data source state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source events if available, otherwise use static events
  const activeEvents = dataSourceId && calendarEvents.length > 0 ? calendarEvents : events

  // Fetch events from data source
  const fetchCalendarEvents = async () => {
    if (!dataSourceId || !dataEndpointId) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to calendar event format
      let transformedEvents = response.data
      if (Array.isArray(transformedEvents)) {
        transformedEvents = transformedEvents.map((item: any, index: number) => ({
          id: item.id || `event-${index}`,
          title: item.title || item.name || item.summary || 'Untitled Event',
          date: item.date || item.start_date || item.event_date,
          time: item.time || item.start_time,
          location: item.location || item.venue || item.address,
          description: item.description || item.details || item.notes,
          color: item.color || 'blue',
          attendees: parseInt(item.attendees || item.participants || 0)
        }))
      } else if (transformedEvents && typeof transformedEvents === 'object') {
        // Single event
        const item = transformedEvents as any
        transformedEvents = [{
          id: item.id || 'event-1',
          title: item.title || item.name || 'Untitled Event',
          date: item.date || item.start_date,
          time: item.time || item.start_time,
          location: item.location || item.venue,
          description: item.description || item.details,
          color: item.color || 'blue',
          attendees: parseInt(item.attendees || 0)
        }]
      } else {
        transformedEvents = []
      }
      
      setCalendarEvents(transformedEvents)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events')
      console.error('Failed to fetch calendar events:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && dataEndpointId && !isEditing) {
      fetchCalendarEvents()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchCalendarEvents, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId && dataEndpointId) {
      fetchCalendarEvents()
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      red: 'bg-red-500 text-white',
      orange: 'bg-orange-500 text-white',
      pink: 'bg-pink-500 text-white'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Edit Calendar
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Calendar title"
            />
          </div>
          
          <div>
            <Label>View Type</Label>
            <Select value={view} onValueChange={(value) => handleInputChange('view', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="agenda">Agenda View</SelectItem>
                <SelectItem value="mini">Mini Calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Primary Color</Label>
            <Select value={primaryColor} onValueChange={(value) => handleInputChange('primaryColor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showEventDetails ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showEventDetails', !showEventDetails)}
              >
                Event Details
              </Button>
              <Button
                variant={showAddEvent ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('showAddEvent', !showAddEvent)}
              >
                Add Event Button
              </Button>
              <Button
                variant={allowEventClick ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('allowEventClick', !allowEventClick)}
              >
                Clickable Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'mini') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded-lg cursor-pointer transition-colors",
                  getColorClass(event.color || primaryColor)
                )}
                onClick={() => allowEventClick && setSelectedEvent(event)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{event.title}</span>
                  <span className="text-xs opacity-75">{formatDate(event.date)}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </div>
                )}
              </div>
            ))}
            {events.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{events.length - 3} more events
              </p>
            )}
          </div>
          {showAddEvent && (
            <Button className="w-full mt-4" size="sm">
              Add Event
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (view === 'agenda') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {title}
            </div>
            {showAddEvent && (
              <Button size="sm">Add Event</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all",
                  allowEventClick && "hover:border-primary"
                )}
                onClick={() => allowEventClick && setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getColorClass(event.color || primaryColor)}>
                        {formatDate(event.date)}
                      </Badge>
                      {event.time && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.attendees && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees} attendees
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Month and Week views (simplified)
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
            {showAddEvent && (
              <Button size="sm" className="ml-2">Add Event</Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {view === 'week' ? (
          <div className="space-y-2">
            {/* Week view - simplified */}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() + i)
              const dayEvents = events.filter(event => 
                new Date(event.date).toDateString() === date.toDateString()
              )
              
              return (
                <div key={i} className="flex items-center gap-4 p-2 border rounded">
                  <div className="w-16 text-sm font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 flex gap-2">
                    {dayEvents.map((event) => (
                      <Badge
                        key={event.id}
                        className={cn(
                          "cursor-pointer",
                          getColorClass(event.color || primaryColor)
                        )}
                        onClick={() => allowEventClick && setSelectedEvent(event)}
                      >
                        {event.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Month view - simplified calendar grid */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6)
              const dayEvents = events.filter(event => 
                new Date(event.date).toDateString() === date.toDateString()
              )
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[60px] p-1 border rounded text-sm",
                    !isCurrentMonth && "text-gray-400 bg-gray-50",
                    isCurrentMonth && "hover:bg-gray-50"
                  )}
                >
                  <div className="font-medium mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded cursor-pointer truncate",
                          getColorClass(event.color || primaryColor)
                        )}
                        onClick={() => allowEventClick && setSelectedEvent(event)}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}