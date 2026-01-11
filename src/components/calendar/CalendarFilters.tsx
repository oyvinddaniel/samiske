'use client'

import { useState, useEffect } from 'react'
import { FilterChip } from './FilterChip'
import { User, Users, Building2, Globe, MapPin, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export interface CalendarFilter {
  who: ('me' | 'friends' | 'groups' | 'all')[]
  location: string | null // Single location name
  locationId: string | null // Location ID for filtering
  locationType: 'language_area' | 'municipality' | 'place' | 'user_locations' | 'sapmi' | null
}

interface CalendarFiltersProps {
  currentUserId: string | null
  filters: CalendarFilter
  onFiltersChange: (filters: CalendarFilter) => void
  eventCount: number
  className?: string
}

interface LocationResult {
  id: string
  name: string
  type: 'language_area' | 'municipality' | 'place'
  displayName: string // E.g., "Karasjok (Kommune)" or "Sápmi (Språkområde)"
}

export function CalendarFilters({
  currentUserId,
  filters,
  onFiltersChange,
  eventCount,
  className,
}: CalendarFiltersProps) {
  const [locationSearch, setLocationSearch] = useState('')
  const [searchResults, setSearchResults] = useState<LocationResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const supabase = createClient()

  // Search for locations when user types
  useEffect(() => {
    const searchLocations = async () => {
      if (locationSearch.length < 2) {
        setSearchResults([])
        return
      }

      const results: LocationResult[] = []
      const searchTerm = locationSearch.toLowerCase()

      // Search language areas
      const { data: langAreas } = await supabase
        .from('language_areas')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5)

      langAreas?.forEach((area) => {
        results.push({
          id: area.id,
          name: area.name,
          type: 'language_area',
          displayName: `${area.name} (Språkområde)`,
        })
      })

      // Search municipalities
      const { data: municipalities } = await supabase
        .from('municipalities')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5)

      municipalities?.forEach((muni) => {
        results.push({
          id: muni.id,
          name: muni.name,
          type: 'municipality',
          displayName: `${muni.name} (Kommune)`,
        })
      })

      // Search places
      const { data: places } = await supabase
        .from('places')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5)

      places?.forEach((place) => {
        results.push({
          id: place.id,
          name: place.name,
          type: 'place',
          displayName: `${place.name} (Sted)`,
        })
      })

      setSearchResults(results)
    }

    const debounceTimer = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounceTimer)
  }, [locationSearch, supabase])

  const toggleWhoFilter = (type: 'me' | 'friends' | 'groups' | 'all') => {
    let newWho: ('me' | 'friends' | 'groups' | 'all')[]

    if (type === 'all') {
      // Hvis bruker klikker "Alle", fjern alle andre og sett kun "all"
      newWho = ['all']
    } else {
      // Hvis bruker klikker en spesifikk type (Meg/Venner/Grupper)
      if (filters.who.includes(type)) {
        // Hvis den allerede er valgt, fjern den
        newWho = filters.who.filter((w) => w !== type && w !== 'all')
        // Hvis ingen igjen, gå tilbake til "all"
        if (newWho.length === 0) {
          newWho = ['all']
        }
      } else {
        // Hvis den ikke er valgt, legg den til og fjern "all"
        newWho = [...filters.who.filter(w => w !== 'all'), type]
      }
    }

    onFiltersChange({
      ...filters,
      who: newWho,
    })
  }

  const selectLocation = (location: LocationResult) => {
    onFiltersChange({
      ...filters,
      location: location.name,
      locationId: location.id,
      locationType: location.type,
    })
    setLocationSearch('')
    setShowResults(false)
  }

  const selectMyLocations = () => {
    onFiltersChange({
      ...filters,
      location: 'Mine steder',
      locationId: null,
      locationType: 'user_locations',
    })
    setLocationSearch('')
  }

  const selectAllSapmi = () => {
    onFiltersChange({
      ...filters,
      location: 'Hele Sápmi',
      locationId: null,
      locationType: 'sapmi',
    })
    setLocationSearch('')
  }

  const clearLocation = () => {
    onFiltersChange({
      ...filters,
      location: null,
      locationId: null,
      locationType: null,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      who: ['all'],
      location: null,
      locationId: null,
      locationType: null,
    })
    setLocationSearch('')
  }

  const hasActiveFilters =
    filters.who.length > 1 ||
    !filters.who.includes('all') ||
    filters.location !== null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with event count and clear button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {eventCount} {eventCount === 1 ? 'arrangement' : 'arrangementer'}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Nullstill
          </button>
        )}
      </div>

      {/* "Hvem" filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterChip
          icon={User}
          label="Meg"
          active={filters.who.includes('me')}
          onClick={() => toggleWhoFilter('me')}
        />
        <FilterChip
          icon={Users}
          label="Venner"
          active={filters.who.includes('friends')}
          onClick={() => toggleWhoFilter('friends')}
        />
        <FilterChip
          icon={Building2}
          label="Grupper"
          active={filters.who.includes('groups')}
          onClick={() => toggleWhoFilter('groups')}
        />
        <FilterChip
          icon={Globe}
          label="Alle"
          active={filters.who.includes('all')}
          onClick={() => toggleWhoFilter('all')}
        />
      </div>

      {/* Location search with quick filter buttons */}
      <div className="flex items-center gap-2">
        {/* Selected location display or search input */}
        <div className="flex-1 relative">
          {filters.location ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500 bg-blue-50">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 flex-1">{filters.location}</span>
              <button
                onClick={clearLocation}
                className="p-0.5 hover:bg-blue-100 rounded"
                aria-label="Fjern lokasjon"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk sted, kommune eller område..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => setShowResults(true)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 rounded-lg text-sm',
                  'border border-gray-200 bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'placeholder:text-gray-400'
                )}
              />
            </div>
          )}

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && !filters.location && (
            <>
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => selectLocation(result)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{result.displayName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Click outside to close */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowResults(false)}
              />
            </>
          )}

          {/* No results message */}
          {showResults && locationSearch.length >= 2 && searchResults.length === 0 && !filters.location && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
              <p className="text-sm text-gray-500 text-center">
                Ingen steder funnet for &quot;{locationSearch}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Quick filter buttons */}
        <button
          onClick={selectMyLocations}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
            'border transition-colors',
            filters.locationType === 'user_locations'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          Mine steder
        </button>
        <button
          onClick={selectAllSapmi}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
            'border transition-colors',
            filters.locationType === 'sapmi'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          )}
        >
          Hele Sápmi
        </button>
      </div>
    </div>
  )
}
