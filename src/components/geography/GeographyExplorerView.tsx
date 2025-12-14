'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Loader2, MapPin, Globe, Languages, Pencil, Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SuggestChangeModal } from './SuggestChangeModal'

interface LanguageArea {
  id: string
  name: string
  name_sami: string | null
  code: string
  color?: string
}

interface Municipality {
  id: string
  name: string
  name_sami: string | null
  slug: string
  language_area_id: string | null
  country_id?: string
}

interface Place {
  id: string
  name: string
  name_sami: string | null
  slug: string
  place_type: string
  municipality_id: string
}

type EntityType = 'language_area' | 'municipality' | 'place'
type SuggestionType = 'new_item' | 'edit_name' | 'edit_relationship'

interface GeographyExplorerViewProps {
  onClose: () => void
}

export function GeographyExplorerView({ onClose }: GeographyExplorerViewProps) {
  const supabase = useMemo(() => createClient(), [])

  // Data state
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [places, setPlaces] = useState<Place[]>([])

  // Selection state
  const [selectedLanguageArea, setSelectedLanguageArea] = useState<string | null>(null)
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null)

  // Starred state
  const [starredLanguageAreas, setStarredLanguageAreas] = useState<Set<string>>(new Set())
  const [starredMunicipalities, setStarredMunicipalities] = useState<Set<string>>(new Set())
  const [starredPlaces, setStarredPlaces] = useState<Set<string>>(new Set())

  // Loading state
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [allMunicipalities, setAllMunicipalities] = useState<Municipality[]>([])
  const [allPlaces, setAllPlaces] = useState<Place[]>([])

  // Suggestion modal state
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)
  const [suggestionEntityType, setSuggestionEntityType] = useState<EntityType>('language_area')
  const [suggestionType, setSuggestionType] = useState<SuggestionType>('new_item')
  const [suggestionEntity, setSuggestionEntity] = useState<LanguageArea | Municipality | Place | null>(null)
  const [suggestionParentId, setSuggestionParentId] = useState<string | undefined>(undefined)

  // Open suggestion modal
  const openSuggestionModal = (
    entityType: EntityType,
    suggType: SuggestionType,
    entity?: LanguageArea | Municipality | Place,
    parentId?: string
  ) => {
    setSuggestionEntityType(entityType)
    setSuggestionType(suggType)
    setSuggestionEntity(entity || null)
    setSuggestionParentId(parentId)
    setSuggestionModalOpen(true)
  }

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch language areas and all data for search
  useEffect(() => {
    const fetchInitialData = async () => {
      const [languageAreasRes, municipalitiesRes, placesRes] = await Promise.all([
        supabase.from('language_areas').select('id, name, name_sami, code').order('sort_order'),
        supabase.from('municipalities').select('id, name, name_sami, slug, language_area_id').order('name'),
        supabase.from('places').select('id, name, name_sami, slug, place_type, municipality_id').order('name'),
      ])

      if (languageAreasRes.data) setLanguageAreas(languageAreasRes.data)
      if (municipalitiesRes.data) setAllMunicipalities(municipalitiesRes.data)
      if (placesRes.data) setAllPlaces(placesRes.data)
      setLoading(false)
    }
    fetchInitialData()
  }, [supabase])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return []

    const query = searchQuery.toLowerCase()
    const results: Array<{
      type: 'language_area' | 'municipality' | 'place'
      item: LanguageArea | Municipality | Place
      matchField: 'name' | 'name_sami'
    }> = []

    // Search language areas
    languageAreas.forEach(area => {
      if (area.name.toLowerCase().includes(query)) {
        results.push({ type: 'language_area', item: area, matchField: 'name' })
      } else if (area.name_sami?.toLowerCase().includes(query)) {
        results.push({ type: 'language_area', item: area, matchField: 'name_sami' })
      }
    })

    // Search municipalities
    allMunicipalities.forEach(muni => {
      if (muni.name.toLowerCase().includes(query)) {
        results.push({ type: 'municipality', item: muni, matchField: 'name' })
      } else if (muni.name_sami?.toLowerCase().includes(query)) {
        results.push({ type: 'municipality', item: muni, matchField: 'name_sami' })
      }
    })

    // Search places
    allPlaces.forEach(place => {
      if (place.name.toLowerCase().includes(query)) {
        results.push({ type: 'place', item: place, matchField: 'name' })
      } else if (place.name_sami?.toLowerCase().includes(query)) {
        results.push({ type: 'place', item: place, matchField: 'name_sami' })
      }
    })

    return results.slice(0, 20) // Limit to 20 results
  }, [searchQuery, languageAreas, allMunicipalities, allPlaces])

  // Fetch municipalities when language area is selected
  useEffect(() => {
    const fetchMunicipalities = async () => {
      if (!selectedLanguageArea) {
        setMunicipalities([])
        return
      }

      const { data } = await supabase
        .from('municipalities')
        .select('id, name, name_sami, slug, language_area_id')
        .eq('language_area_id', selectedLanguageArea)
        .order('name')

      if (data) {
        setMunicipalities(data)
      }
    }
    fetchMunicipalities()
    setSelectedMunicipality(null)
    setPlaces([])
  }, [selectedLanguageArea, supabase])

  // Fetch places when municipality is selected
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!selectedMunicipality) {
        setPlaces([])
        return
      }

      const { data } = await supabase
        .from('places')
        .select('id, name, name_sami, slug, place_type, municipality_id')
        .eq('municipality_id', selectedMunicipality)
        .order('name')

      if (data) {
        setPlaces(data)
      }
    }
    fetchPlaces()
  }, [selectedMunicipality, supabase])

  // Fetch starred items
  const fetchStarredItems = useCallback(async () => {
    if (!currentUserId) return

    const [languageAreasResult, municipalitiesResult, placesResult] = await Promise.all([
      supabase
        .from('user_starred_language_areas')
        .select('language_area_id')
        .eq('user_id', currentUserId),
      supabase
        .from('user_starred_municipalities')
        .select('municipality_id')
        .eq('user_id', currentUserId),
      supabase
        .from('user_starred_places')
        .select('place_id')
        .eq('user_id', currentUserId),
    ])

    if (languageAreasResult.data) {
      setStarredLanguageAreas(new Set(languageAreasResult.data.map(r => r.language_area_id)))
    }
    if (municipalitiesResult.data) {
      setStarredMunicipalities(new Set(municipalitiesResult.data.map(r => r.municipality_id)))
    }
    if (placesResult.data) {
      setStarredPlaces(new Set(placesResult.data.map(r => r.place_id)))
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchStarredItems()
  }, [fetchStarredItems])

  // Toggle star handlers
  const toggleStarLanguageArea = async (id: string, name: string) => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å stjernemerke')
      return
    }

    const isStarred = starredLanguageAreas.has(id)

    if (isStarred) {
      await supabase
        .from('user_starred_language_areas')
        .delete()
        .eq('user_id', currentUserId)
        .eq('language_area_id', id)

      setStarredLanguageAreas(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success(`${name} fjernet fra Mine steder`)
    } else {
      await supabase
        .from('user_starred_language_areas')
        .insert({ user_id: currentUserId, language_area_id: id })

      setStarredLanguageAreas(prev => new Set([...prev, id]))
      toast.success(`${name} lagt til i Mine steder`)
    }
  }

  const toggleStarMunicipality = async (id: string, name: string) => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å stjernemerke')
      return
    }

    const isStarred = starredMunicipalities.has(id)

    if (isStarred) {
      await supabase
        .from('user_starred_municipalities')
        .delete()
        .eq('user_id', currentUserId)
        .eq('municipality_id', id)

      setStarredMunicipalities(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success(`${name} fjernet fra Mine steder`)
    } else {
      await supabase
        .from('user_starred_municipalities')
        .insert({ user_id: currentUserId, municipality_id: id })

      setStarredMunicipalities(prev => new Set([...prev, id]))
      toast.success(`${name} lagt til i Mine steder`)
    }
  }

  const toggleStarPlace = async (id: string, name: string) => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å stjernemerke')
      return
    }

    const isStarred = starredPlaces.has(id)

    if (isStarred) {
      await supabase
        .from('user_starred_places')
        .delete()
        .eq('user_id', currentUserId)
        .eq('place_id', id)

      setStarredPlaces(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success(`${name} fjernet fra Mine steder`)
    } else {
      await supabase
        .from('user_starred_places')
        .insert({ user_id: currentUserId, place_id: id })

      setStarredPlaces(prev => new Set([...prev, id]))
      toast.success(`${name} lagt til i Mine steder`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Helper to get type label in Norwegian
  const getTypeLabel = (type: 'language_area' | 'municipality' | 'place') => {
    switch (type) {
      case 'language_area': return 'Språkområde'
      case 'municipality': return 'Kommune'
      case 'place': return 'By/sted'
    }
  }

  // Helper to get type icon and color
  const getTypeStyle = (type: 'language_area' | 'municipality' | 'place') => {
    switch (type) {
      case 'language_area': return { icon: Languages, color: 'text-blue-600', bg: 'bg-blue-100' }
      case 'municipality': return { icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'place': return { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-100' }
    }
  }

  // Navigate to detail view
  const openDetailView = (type: 'language_area' | 'municipality' | 'place', id: string, name: string) => {
    window.dispatchEvent(new CustomEvent('open-location-panel', {
      detail: { type, id, name }
    }))
  }

  // Handle search result click - opens detail view
  const handleSearchResultClick = (result: typeof searchResults[0]) => {
    setSearchQuery('')
    openDetailView(result.type, result.item.id, result.item.name)
  }

  // Star a search result
  const handleStarSearchResult = async (result: typeof searchResults[0]) => {
    if (result.type === 'language_area') {
      await toggleStarLanguageArea(result.item.id, result.item.name)
    } else if (result.type === 'municipality') {
      await toggleStarMunicipality(result.item.id, result.item.name)
    } else if (result.type === 'place') {
      await toggleStarPlace(result.item.id, result.item.name)
    }
  }

  // Check if a result is starred
  const isResultStarred = (result: typeof searchResults[0]) => {
    if (result.type === 'language_area') return starredLanguageAreas.has(result.item.id)
    if (result.type === 'municipality') return starredMunicipalities.has(result.item.id)
    return starredPlaces.has(result.item.id)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Globe className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Utforsk Sápmi</h1>
            <p className="text-sm text-gray-500">Finn og følg områder</p>
          </div>
        </div>

        {/* Search Field - prominent with whitespace */}
        <div className="py-6 px-4 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Søk etter språkområde, kommune eller sted..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 py-6 text-lg rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 max-w-xl mx-auto bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto">
              {searchResults.map((result, idx) => {
                const style = getTypeStyle(result.type)
                const Icon = style.icon
                return (
                  <div
                    key={`${result.type}-${result.item.id}-${idx}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className={cn('p-2 rounded-lg', style.bg)}>
                      <Icon className={cn('w-4 h-4', style.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.item.name}
                        {result.item.name_sami && (
                          <span className="ml-2 text-gray-500 font-normal">
                            ({result.item.name_sami})
                          </span>
                        )}
                      </p>
                      <p className={cn('text-xs font-medium', style.color)}>
                        {getTypeLabel(result.type)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStarSearchResult(result)
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        isResultStarred(result)
                          ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                          : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'
                      )}
                      title="Favoritt"
                    >
                      <Star className={cn('w-5 h-5', isResultStarred(result) && 'fill-current')} />
                    </button>
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </div>
                )
              })}
            </div>
          )}

          {/* No results message */}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="mt-4 max-w-xl mx-auto text-center py-6 text-gray-500">
              <p>Ingen treff for &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => openSuggestionModal('place', 'new_item')}
                className="mt-2 text-emerald-600 hover:underline text-sm"
              >
                Foreslå å legge til dette stedet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Divider with text */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">eller bla gjennom</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Three column layout */}
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {/* Column 1: Language Areas */}
        <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-sm text-gray-700">Språkområder</h2>
              </div>
              <button
                onClick={() => openSuggestionModal('language_area', 'new_item')}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Foreslå nytt språkområde"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {languageAreas.map((area) => (
              <div
                key={area.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-100 transition-colors',
                  selectedLanguageArea === area.id
                    ? 'bg-blue-50 border-l-2 border-l-blue-600'
                    : 'hover:bg-gray-50'
                )}
                onClick={() => setSelectedLanguageArea(area.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    selectedLanguageArea === area.id ? 'text-blue-700' : 'text-gray-900'
                  )}>
                    {area.name}
                  </p>
                  {area.name_sami && (
                    <p className="text-xs text-gray-500 truncate">{area.name_sami}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStarLanguageArea(area.id, area.name)
                    }}
                    className={cn(
                      'p-1 rounded transition-colors',
                      starredLanguageAreas.has(area.id)
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-300 hover:text-gray-400'
                    )}
                    title="Favoritt"
                  >
                    <Star className={cn(
                      'w-4 h-4',
                      starredLanguageAreas.has(area.id) && 'fill-current'
                    )} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openDetailView('language_area', area.id, area.name)
                    }}
                    className="p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all"
                    title="Hjelp til å redigere"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {/* Add new language area at bottom */}
            <button
              onClick={() => openSuggestionModal('language_area', 'new_item')}
              className="flex items-center gap-2 px-3 py-3 w-full text-left text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Legg til nytt språkområde</span>
            </button>
          </div>
        </div>

        {/* Column 2: Municipalities */}
        <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <h2 className="font-semibold text-sm text-gray-700">Kommuner</h2>
              </div>
              {selectedLanguageArea && (
                <button
                  onClick={() => openSuggestionModal('municipality', 'new_item', undefined, selectedLanguageArea)}
                  className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                  title="Foreslå ny kommune"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedLanguageArea ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Velg et språkområde
              </div>
            ) : (
              <>
                {municipalities.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Ingen kommuner funnet
                  </div>
                )}
                {municipalities.map((municipality) => (
                  <div
                    key={municipality.id}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-100 transition-colors',
                      selectedMunicipality === municipality.id
                        ? 'bg-orange-50 border-l-2 border-l-orange-600'
                        : 'hover:bg-gray-50'
                    )}
                    onClick={() => setSelectedMunicipality(municipality.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        selectedMunicipality === municipality.id ? 'text-orange-700' : 'text-gray-900'
                      )}>
                        {municipality.name}
                      </p>
                      {municipality.name_sami && (
                        <p className="text-xs text-gray-500 truncate">{municipality.name_sami}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStarMunicipality(municipality.id, municipality.name)
                        }}
                        className={cn(
                          'p-1 rounded transition-colors',
                          starredMunicipalities.has(municipality.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-300 hover:text-gray-400'
                        )}
                        title="Favoritt"
                      >
                        <Star className={cn(
                          'w-4 h-4',
                          starredMunicipalities.has(municipality.id) && 'fill-current'
                        )} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDetailView('municipality', municipality.id, municipality.name)
                        }}
                        className="p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 hover:text-orange-600 transition-all"
                        title="Hjelp til å redigere"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add new municipality at bottom */}
                <button
                  onClick={() => openSuggestionModal('municipality', 'new_item', undefined, selectedLanguageArea)}
                  className="flex items-center gap-2 px-3 py-3 w-full text-left text-orange-600 hover:bg-orange-50 transition-colors border-t border-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Legg til ny kommune</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Column 3: Places */}
        <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-sm text-gray-700">Byer & steder</h2>
              </div>
              {selectedMunicipality && (
                <button
                  onClick={() => openSuggestionModal('place', 'new_item', undefined, selectedMunicipality)}
                  className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                  title="Foreslå ny by/sted"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedMunicipality ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Velg en kommune
              </div>
            ) : (
              <>
                {places.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Ingen steder funnet
                  </div>
                )}
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="group flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {place.name}
                      </p>
                      {place.name_sami && (
                        <p className="text-xs text-gray-500 truncate">{place.name_sami}</p>
                      )}
                      <p className="text-xs text-gray-400 capitalize">{place.place_type}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleStarPlace(place.id, place.name)}
                        className={cn(
                          'p-1 rounded transition-colors',
                          starredPlaces.has(place.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-300 hover:text-gray-400'
                        )}
                        title="Favoritt"
                      >
                        <Star className={cn(
                          'w-4 h-4',
                          starredPlaces.has(place.id) && 'fill-current'
                        )} />
                      </button>
                      <button
                        onClick={() => openDetailView('place', place.id, place.name)}
                        className="p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 hover:text-purple-600 transition-all"
                        title="Hjelp til å redigere"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add new place at bottom */}
                <button
                  onClick={() => openSuggestionModal('place', 'new_item', undefined, selectedMunicipality)}
                  className="flex items-center gap-2 px-3 py-3 w-full text-left text-purple-600 hover:bg-purple-50 transition-colors border-t border-gray-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Legg til ny by/sted</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg space-y-1">
        <p className="text-xs text-blue-700">
          <Star className="w-3 h-3 inline mr-1 fill-yellow-500 text-yellow-500" />
          Klikk på stjernen for å legge til et område i <strong>Mine steder</strong>.
        </p>
        <p className="text-xs text-blue-700">
          <Pencil className="w-3 h-3 inline mr-1" />
          Klikk på blyanten for å hjelpe til med å redigere navn, beskrivelse og bilder.
        </p>
        <p className="text-xs text-blue-700">
          <Plus className="w-3 h-3 inline mr-1" />
          Klikk + for å foreslå nye områder, kommuner eller steder.
        </p>
      </div>

      {/* Suggestion Modal */}
      <SuggestChangeModal
        open={suggestionModalOpen}
        onOpenChange={setSuggestionModalOpen}
        entityType={suggestionEntityType}
        entity={suggestionEntity}
        suggestionType={suggestionType}
        parentId={suggestionParentId}
      />
    </div>
  )
}
