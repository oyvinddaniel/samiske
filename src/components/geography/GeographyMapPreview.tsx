'use client'

import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GeographyMapPreviewProps {
  latitude?: number | null
  longitude?: number | null
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function GeographyMapPreview({
  latitude,
  longitude,
  name,
  className,
  size = 'md',
}: GeographyMapPreviewProps) {
  const hasCoordinates = latitude !== null && latitude !== undefined &&
                         longitude !== null && longitude !== undefined

  // Size configurations
  const sizeConfig = {
    sm: { width: 120, height: 90, zoom: 10 },
    md: { width: 200, height: 150, zoom: 11 },
    lg: { width: 300, height: 200, zoom: 12 },
  }

  const config = sizeConfig[size]

  // Open in Google Maps
  const handleClick = () => {
    if (hasCoordinates) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      // Search by name if no coordinates
      const searchQuery = encodeURIComponent(`${name}, Norway`)
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank')
    }
  }

  // If we have coordinates, show a static map (or placeholder for now)
  // Note: For production, you'd use Google Maps Static API with an API key
  // For now, we show a styled placeholder that links to Google Maps

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-green-100',
        'hover:shadow-lg transition-all group',
        'flex items-center justify-center',
        className
      )}
      style={{ width: config.width, height: config.height }}
      aria-label={`Åpne ${name} i Google Maps`}
    >
      {/* Map placeholder with gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        {/* Simulated map elements */}
        <div className="absolute inset-0 opacity-20">
          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(90deg, #3b82f6 1px, transparent 1px), linear-gradient(#3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        </div>

        {/* "Roads" simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50" stroke="#6b7280" strokeWidth="1" fill="none" />
          <path d="M50,0 Q70,25 50,50 T50,100" stroke="#6b7280" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Location marker */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="w-3 h-3 bg-red-500 transform rotate-45 -mt-1.5 shadow" />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-2">
        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3 h-3" />
          Åpne i kart
        </div>
      </div>

      {/* Coordinates badge (if available) */}
      {hasCoordinates && (
        <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600">
          {latitude?.toFixed(2)}°, {longitude?.toFixed(2)}°
        </div>
      )}
    </button>
  )
}

// Alternative: OpenStreetMap embed (iframe based, doesn't require API key)
interface OpenStreetMapPreviewProps {
  latitude: number
  longitude: number
  name: string
  className?: string
  zoom?: number
}

export function OpenStreetMapPreview({
  latitude,
  longitude,
  name,
  className,
  zoom = 12,
}: OpenStreetMapPreviewProps) {
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.1},${latitude - 0.1},${longitude + 0.1},${latitude + 0.1}&layer=mapnik&marker=${latitude},${longitude}`
  const linkUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        title={`Kart over ${name}`}
        loading="lazy"
      />
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <ExternalLink className="w-3 h-3" />
        Vis større kart
      </a>
    </div>
  )
}
