'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Share2, MapPin, Pencil, Upload, Flag, ExternalLink, Copy, Locate, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { geocodePlace, geocodeMunicipality, updatePlaceCoordinates, updateMunicipalityCoordinates } from '@/lib/geography'

type EntityType = 'language_area' | 'municipality' | 'place'

interface GeographyActionMenuProps {
  entityType: EntityType
  entityId: string
  entityName: string
  entityNameSami?: string | null
  latitude?: number | null
  longitude?: number | null
  isLoggedIn: boolean
  hasImages?: boolean
  onEdit?: () => void
  onUploadImages?: () => void
  onManageImages?: () => void
  onReport?: () => void
  onCoordinatesUpdated?: (lat: number, lng: number) => void
  municipalityName?: string
  className?: string
  variant?: 'default' | 'overlay'
}

export function GeographyActionMenu({
  entityType,
  entityId,
  entityName,
  entityNameSami,
  latitude,
  longitude,
  isLoggedIn,
  hasImages = false,
  onEdit,
  onUploadImages,
  onManageImages,
  onReport,
  onCoordinatesUpdated,
  municipalityName,
  className,
  variant = 'default',
}: GeographyActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const hasCoordinates = latitude !== null && latitude !== undefined &&
                         longitude !== null && longitude !== undefined

  // Build share URL
  const getShareUrl = () => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }

  // Handle share
  const handleShare = async () => {
    const url = getShareUrl()
    const title = entityNameSami ? `${entityName} (${entityNameSami})` : entityName

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink()
        }
      }
    } else {
      handleCopyLink()
    }
    setOpen(false)
  }

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      toast.success('Link kopiert til utklippstavle')
    } catch {
      toast.error('Kunne ikke kopiere link')
    }
  }

  // Open in Google Maps
  const handleOpenInMaps = () => {
    if (hasCoordinates) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    } else {
      // Search by name if no coordinates
      const searchQuery = encodeURIComponent(`${entityName}, Norway`)
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank')
    }
    setOpen(false)
  }

  // Copy coordinates
  const handleCopyCoordinates = async () => {
    if (!hasCoordinates) return
    try {
      await navigator.clipboard.writeText(`${latitude}, ${longitude}`)
      toast.success('Koordinater kopiert')
    } catch {
      toast.error('Kunne ikke kopiere')
    }
    setOpen(false)
  }

  // Get entity type label
  const getEntityLabel = () => {
    switch (entityType) {
      case 'language_area': return 'språkområdet'
      case 'municipality': return 'kommunen'
      case 'place': return 'stedet'
    }
  }

  // Auto-fetch coordinates
  const handleFetchCoordinates = async () => {
    if (entityType === 'language_area') {
      toast.error('Kan ikke hente koordinater for språkområder')
      return
    }

    setIsGeocoding(true)
    try {
      let result
      if (entityType === 'municipality') {
        result = await geocodeMunicipality(entityName, 'no')
        if (result) {
          await updateMunicipalityCoordinates(entityId, result.latitude, result.longitude)
        }
      } else if (entityType === 'place') {
        result = await geocodePlace(entityName, municipalityName, 'no')
        if (result) {
          await updatePlaceCoordinates(entityId, result.latitude, result.longitude)
        }
      }

      if (result) {
        toast.success(`Fant koordinater: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`)
        onCoordinatesUpdated?.(result.latitude, result.longitude)
      } else {
        toast.error('Fant ingen koordinater for dette stedet')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Kunne ikke hente koordinater')
    } finally {
      setIsGeocoding(false)
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-lg transition-colors',
            variant === 'overlay'
              ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full',
            className
          )}
          aria-label="Flere handlinger"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Sharing & Navigation */}
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Del
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleOpenInMaps}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Åpne i Google Maps
        </DropdownMenuItem>

        {hasCoordinates && (
          <DropdownMenuItem onClick={handleCopyCoordinates}>
            <Copy className="w-4 h-4 mr-2" />
            Kopier koordinater
          </DropdownMenuItem>
        )}

        {/* Fetch coordinates if missing */}
        {!hasCoordinates && entityType !== 'language_area' && isLoggedIn && (
          <DropdownMenuItem onClick={handleFetchCoordinates} disabled={isGeocoding}>
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Locate className="w-4 h-4 mr-2" />
            )}
            {isGeocoding ? 'Henter...' : 'Hent kartposisjon'}
          </DropdownMenuItem>
        )}

        {/* Editing (logged in only) */}
        {isLoggedIn && (
          <>
            <DropdownMenuSeparator />

            {onEdit && (
              <DropdownMenuItem onClick={() => { onEdit(); setOpen(false); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Rediger informasjon
              </DropdownMenuItem>
            )}

            {onUploadImages && (
              <DropdownMenuItem onClick={() => { onUploadImages(); setOpen(false); }}>
                <Upload className="w-4 h-4 mr-2" />
                Last opp bilder
              </DropdownMenuItem>
            )}

            {hasImages && onManageImages && (
              <DropdownMenuItem onClick={() => { onManageImages(); setOpen(false); }}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Administrer bilder
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* Reporting */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { onReport?.(); setOpen(false); }}
          className="text-orange-600 focus:text-orange-600"
        >
          <Flag className="w-4 h-4 mr-2" />
          Rapporter feil i {getEntityLabel()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
