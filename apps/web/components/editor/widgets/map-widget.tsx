'use client'

import { useState } from 'react'
import { MapPin, Navigation, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface MapWidgetProps {
  address?: string
  latitude?: number
  longitude?: number
  zoom?: number
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  showMarker?: boolean
  height?: string
  borderRadius?: string
  title?: string
  description?: string
  showControls?: boolean
  showStreetView?: boolean
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function MapWidget({
  address = '1600 Amphitheatre Parkway, Mountain View, CA',
  latitude,
  longitude,
  zoom = 15,
  mapType = 'roadmap',
  showMarker = true,
  height = '300px',
  borderRadius = '8px',
  title = '',
  description = '',
  showControls = true,
  showStreetView = false,
  isEditing = false,
  onChange
}: MapWidgetProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords
          setCurrentLocation({ lat, lng })
          handleInputChange('latitude', lat)
          handleInputChange('longitude', lng)
          handleInputChange('address', `${lat}, ${lng}`)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Generate Google Maps embed URL
  const getMapUrl = () => {
    const baseUrl = 'https://www.google.com/maps/embed/v1/place'
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo'
    
    let params = `key=${apiKey}&zoom=${zoom}&maptype=${mapType}`
    
    if (latitude && longitude) {
      params += `&q=${latitude},${longitude}`
    } else {
      params += `&q=${encodeURIComponent(address)}`
    }
    
    return `${baseUrl}?${params}`
  }

  // Fallback if no API key
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Edit Map
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Title (Optional)</Label>
            <Input
              value={title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Map title"
            />
          </div>
          
          <div>
            <Label>Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Map description"
            />
          </div>
          
          <div>
            <Label>Address or Location</Label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address or coordinates"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                className="flex-shrink-0"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Use Current
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude (Optional)</Label>
              <Input
                type="number"
                value={latitude || ''}
                onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="37.4221"
                step="any"
              />
            </div>
            <div>
              <Label>Longitude (Optional)</Label>
              <Input
                type="number"
                value={longitude || ''}
                onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="-122.0841"
                step="any"
              />
            </div>
          </div>
          
          <div>
            <Label>Zoom Level: {zoom}</Label>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => handleInputChange('zoom', value)}
              min={1}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label>Map Type</Label>
            <Select value={mapType} onValueChange={(value) => handleInputChange('mapType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Roadmap</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Height</Label>
            <Select value={height} onValueChange={(value) => handleInputChange('height', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="200px">Small (200px)</SelectItem>
                <SelectItem value="300px">Medium (300px)</SelectItem>
                <SelectItem value="400px">Large (400px)</SelectItem>
                <SelectItem value="500px">Extra Large (500px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showMarker"
                checked={showMarker}
                onCheckedChange={(checked: boolean) => handleInputChange('showMarker', checked)}
              />
              <Label htmlFor="showMarker">Show location marker</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showControls"
                checked={showControls}
                onCheckedChange={(checked: boolean) => handleInputChange('showControls', checked)}
              />
              <Label htmlFor="showControls">Show map controls</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showStreetView"
                checked={showStreetView}
                onCheckedChange={(checked: boolean) => handleInputChange('showStreetView', checked)}
              />
              <Label htmlFor="showStreetView">Enable Street View</Label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Title and Description */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {description && <p className="text-gray-600 text-sm">{description}</p>}
        </div>
      )}
      
      {/* Map Container */}
      <div 
        className="w-full relative overflow-hidden border"
        style={{ height, borderRadius }}
      >
        {hasApiKey ? (
          <iframe
            src={getMapUrl()}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={title || `Map of ${address}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <MapPin className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center px-4 mb-2">
              {title && <span className="font-medium block mb-1">{title}</span>}
              {address}
            </p>
            {description && (
              <p className="text-xs text-gray-400 text-center px-4 mb-3">
                {description}
              </p>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              Open in Google Maps
            </a>
          </div>
        )}
        
        {/* Overlay for editing mode */}
        {isEditing && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white rounded-lg p-3 shadow-lg flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Click to edit map settings</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Address Display */}
      {!title && !description && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{address}</span>
        </div>
      )}
    </div>
  )
}
