'use client'

import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapWidgetProps {
  address?: string
  latitude?: number
  longitude?: number
  zoom?: number
  mapType?: 'roadmap' | 'satellite' | 'terrain'
  showMarker?: boolean
  height?: string
  borderRadius?: string
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
  isEditing = false,
  onChange
}: MapWidgetProps) {
  // Generate Google Maps embed URL
  const getMapUrl = () => {
    const baseUrl = 'https://www.google.com/maps/embed/v1/place'
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    
    if (latitude && longitude) {
      return `${baseUrl}?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}&maptype=${mapType}`
    }
    
    return `${baseUrl}?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=${zoom}&maptype=${mapType}`
  }

  // Fallback if no API key
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!hasApiKey) {
    return (
      <div
        className={cn(
          "w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800"
        )}
        style={{ height, borderRadius }}
      >
        <MapPin className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center px-4">
          {address}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          Open in Google Maps
        </a>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height, borderRadius, overflow: 'hidden' }}>
      <iframe
        src={getMapUrl()}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
