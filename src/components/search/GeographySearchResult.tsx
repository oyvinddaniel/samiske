'use client'

import { useState, useEffect } from 'react'
import { MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { GeographySearchResult as GeographyResultType } from './searchTypes'
import {
  starMunicipality,
  unstarMunicipality,
  starPlace,
  unstarPlace,
  starLanguageArea,
  unstarLanguageArea,
  isLocationStarred,
} from '@/lib/geography'
import { createClient } from '@/lib/supabase/client'

interface GeographySearchResultProps {
  location: GeographyResultType
  isHighlighted: boolean
}

export function GeographySearchResult({
  location,
  isHighlighted,
}: GeographySearchResultProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [isStarring, setIsStarring] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null)
    })
  }, [])

  // Check if location is starred
  useEffect(() => {
    if (!currentUserId) return

    const checkStarred = async () => {
      const starred = await isLocationStarred(
        currentUserId,
        location.id,
        location.location_type
      )
      setIsStarred(starred)
    }

    checkStarred()
  }, [currentUserId, location.id, location.location_type])

  // Handle star toggle
  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation

    if (!currentUserId) {
      toast.error('Du må være logget inn for å stjernemerke steder')
      return
    }

    setIsStarring(true)

    try {
      let success = false

      if (isStarred) {
        // Unstar
        if (location.location_type === 'language_area') {
          success = await unstarLanguageArea(currentUserId, location.id)
        } else if (location.location_type === 'municipality') {
          success = await unstarMunicipality(currentUserId, location.id)
        } else {
          success = await unstarPlace(currentUserId, location.id)
        }

        if (success) {
          setIsStarred(false)
          toast.success('Stjerne fjernet')
        }
      } else {
        // Star
        if (location.location_type === 'language_area') {
          success = await starLanguageArea(currentUserId, location.id)
        } else if (location.location_type === 'municipality') {
          success = await starMunicipality(currentUserId, location.id)
        } else {
          success = await starPlace(currentUserId, location.id)
        }

        if (success) {
          setIsStarred(true)
          toast.success('Stjernemerket')
        }
      }

      if (!success) {
        toast.error('Kunne ikke oppdatere stjerne')
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      toast.error('Kunne ikke oppdatere stjerne')
    } finally {
      setIsStarring(false)
    }
  }

  // Get location type label
  const getLocationTypeLabel = () => {
    switch (location.location_type) {
      case 'language_area':
        return 'Språkområde'
      case 'municipality':
        return 'Kommune'
      case 'place':
        return 'Sted'
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
        isHighlighted && 'bg-blue-50 ring-2 ring-blue-500'
      )}
    >
      {/* Left: Icon + Content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {location.name}
            {location.name_sami && location.name_sami !== location.name && (
              <span className="text-gray-500 ml-1">({location.name_sami})</span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {getLocationTypeLabel()}
            {location.parent && ` · ${location.parent}`}
          </p>
        </div>
      </div>

      {/* Right: Star Button (only if logged in) */}
      {currentUserId && (
        <button
          onClick={handleStarToggle}
          disabled={isStarring}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            isStarred
              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100',
            isStarring && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={isStarred ? 'Fjern stjerne' : 'Legg til stjerne'}
          title={isStarred ? 'Fjern stjerne' : 'Legg til stjerne'}
        >
          <Star
            className={cn('w-5 h-5', isStarred && 'fill-current')}
          />
        </button>
      )}
    </div>
  )
}
