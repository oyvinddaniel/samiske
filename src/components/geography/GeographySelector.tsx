'use client'

import { useState, useEffect } from 'react'
import { Globe, Building2, MapPin, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import type { Municipality, Place, Country } from '@/lib/types/geography'

interface GeographySelectorProps {
  value?: {
    municipalityId?: string | null
    placeId?: string | null
  }
  onChange: (value: { municipalityId: string | null; placeId: string | null }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

interface GroupedMunicipalities {
  country: Country
  municipalities: Municipality[]
}

interface PlaceWithMunicipality extends Place {
  municipality: Municipality
}

export function GeographySelector({
  value,
  onChange,
  placeholder = 'Velg sted',
  className = '',
  disabled = false
}: GeographySelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groupedMunicipalities, setGroupedMunicipalities] = useState<GroupedMunicipalities[]>([])
  const [allPlaces, setAllPlaces] = useState<PlaceWithMunicipality[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load countries, municipalities, and ALL places on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const supabase = createClient()

      // Fetch countries
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .order('sort_order')

      // Fetch all municipalities with country
      const { data: municipalitiesData } = await supabase
        .from('municipalities')
        .select('*, country:countries(*)')
        .order('name')

      // Fetch ALL places with their municipalities
      const { data: placesData } = await supabase
        .from('places')
        .select('*, municipality:municipalities(*)')
        .order('name')

      console.log('🗺️ Loaded all places:', placesData?.length || 0)

      if (countriesData && municipalitiesData) {
        // Group municipalities by country
        const grouped: GroupedMunicipalities[] = countriesData.map(country => ({
          country,
          municipalities: municipalitiesData.filter(m => m.country_id === country.id) as Municipality[]
        })).filter(g => g.municipalities.length > 0)

        setGroupedMunicipalities(grouped)
      }

      if (placesData) {
        setAllPlaces(placesData as PlaceWithMunicipality[])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Load selected values on mount
  useEffect(() => {
    if (!value?.municipalityId && !value?.placeId) return

    const loadSelected = async () => {
      const supabase = createClient()

      if (value.placeId) {
        const { data: place } = await supabase
          .from('places')
          .select('*, municipality:municipalities(*)')
          .eq('id', value.placeId)
          .single()

        if (place) {
          setSelectedPlace(place as Place)
          setSelectedMunicipality(place.municipality as Municipality)
        }
      } else if (value.municipalityId) {
        const { data: municipality } = await supabase
          .from('municipalities')
          .select('*')
          .eq('id', value.municipalityId)
          .single()

        if (municipality) {
          setSelectedMunicipality(municipality as Municipality)
        }
      }
    }

    loadSelected()
  }, [value?.municipalityId, value?.placeId])

  const handleSelectMunicipality = (municipality: Municipality) => {
    setSelectedMunicipality(municipality)
    setSelectedPlace(null)
    onChange({ municipalityId: municipality.id, placeId: null })
    setOpen(false)
  }

  const handleSelectPlace = (place: PlaceWithMunicipality) => {
    setSelectedPlace(place)
    setSelectedMunicipality(place.municipality)
    onChange({ municipalityId: place.municipality.id, placeId: place.id })
    setOpen(false)
  }

  const handleClear = () => {
    setSelectedMunicipality(null)
    setSelectedPlace(null)
    onChange({ municipalityId: null, placeId: null })
    setOpen(false)
  }

  // Filter places based on search query
  const filteredPlaces = searchQuery
    ? allPlaces.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.name_sami?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.municipality.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Get display text
  const getDisplayText = () => {
    if (selectedPlace) {
      return `${selectedPlace.name}, ${selectedMunicipality?.name}`
    }
    if (selectedMunicipality) {
      return selectedMunicipality.name
    }
    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`justify-between ${className}`}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedPlace ? (
              <MapPin className="h-4 w-4 shrink-0" />
            ) : selectedMunicipality ? (
              <Building2 className="h-4 w-4 shrink-0" />
            ) : (
              <Globe className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{getDisplayText()}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Søk etter sted eller kommune..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Laster...' : 'Ingen resultater funnet.'}
            </CommandEmpty>

            {/* Clear option if something is selected */}
            {(selectedMunicipality || selectedPlace) && (
              <CommandGroup>
                <CommandItem onSelect={handleClear} className="text-muted-foreground">
                  Fjern valg
                </CommandItem>
              </CommandGroup>
            )}

            {/* Show filtered places if user is searching */}
            {searchQuery && filteredPlaces.length > 0 && (
              <CommandGroup heading={`Steder (${filteredPlaces.length})`}>
                {filteredPlaces.slice(0, 20).map((place) => (
                  <CommandItem
                    key={place.id}
                    value={`${place.name} ${place.municipality.name}`}
                    onSelect={() => handleSelectPlace(place)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{place.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {place.municipality.name}
                      </span>
                    </div>
                    {selectedPlace?.id === place.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
                {filteredPlaces.length > 20 && (
                  <CommandItem disabled>
                    <span className="text-xs text-muted-foreground">
                      + {filteredPlaces.length - 20} flere resultater...
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            )}

            {/* Show municipalities if not searching or no place results */}
            {!searchQuery && groupedMunicipalities.map(({ country, municipalities }) => (
              <CommandGroup key={country.id} heading={country.name}>
                {municipalities.map((municipality) => (
                  <CommandItem
                    key={municipality.id}
                    value={`${municipality.name} ${country.name}`}
                    onSelect={() => handleSelectMunicipality(municipality)}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{municipality.name}</span>
                    {municipality.name_sami && municipality.name_sami !== municipality.name && (
                      <span className="ml-2 text-xs text-muted-foreground italic">
                        {municipality.name_sami}
                      </span>
                    )}
                    {selectedMunicipality?.id === municipality.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
