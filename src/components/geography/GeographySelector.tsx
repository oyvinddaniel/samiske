'use client'

import { useState, useEffect } from 'react'
import { Globe, Building2, MapPin, ChevronDown, Check } from 'lucide-react'
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

export function GeographySelector({
  value,
  onChange,
  placeholder = 'Velg sted',
  className = '',
  disabled = false
}: GeographySelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [groupedMunicipalities, setGroupedMunicipalities] = useState<GroupedMunicipalities[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [step, setStep] = useState<'municipality' | 'place'>('municipality')

  // Load countries and municipalities
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

      if (countriesData && municipalitiesData) {
        setCountries(countriesData)

        // Group municipalities by country
        const grouped: GroupedMunicipalities[] = countriesData.map(country => ({
          country,
          municipalities: municipalitiesData.filter(m => m.country_id === country.id) as Municipality[]
        })).filter(g => g.municipalities.length > 0)

        setGroupedMunicipalities(grouped)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Load places when municipality changes
  useEffect(() => {
    if (!selectedMunicipality) {
      setPlaces([])
      return
    }

    const loadPlaces = async () => {
      const supabase = createClient()
      const { data: placesData } = await supabase
        .from('places')
        .select('*')
        .eq('municipality_id', selectedMunicipality.id)
        .order('name')

      setPlaces(placesData || [])
    }

    loadPlaces()
  }, [selectedMunicipality])

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
          setStep('place')
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
    setStep('place')
    // Don't close yet - let user optionally select a place
  }

  const handleSelectPlace = (place: Place) => {
    setSelectedPlace(place)
    onChange({ municipalityId: selectedMunicipality?.id || null, placeId: place.id })
    setOpen(false)
  }

  const handleConfirmMunicipality = () => {
    if (selectedMunicipality) {
      onChange({ municipalityId: selectedMunicipality.id, placeId: null })
      setOpen(false)
    }
  }

  const handleClear = () => {
    setSelectedMunicipality(null)
    setSelectedPlace(null)
    setStep('municipality')
    onChange({ municipalityId: null, placeId: null })
    setOpen(false)
  }

  const handleBack = () => {
    setStep('municipality')
    setSelectedPlace(null)
  }

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

  // Get display icon
  const getDisplayIcon = () => {
    if (selectedPlace) return MapPin
    if (selectedMunicipality) return Building2
    return Globe
  }

  const DisplayIcon = getDisplayIcon()

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
            <DisplayIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{getDisplayText()}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={step === 'municipality' ? 'Sok etter kommune...' : 'Sok etter sted...'}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Laster...' : 'Ingen resultater funnet.'}
            </CommandEmpty>

            {step === 'municipality' && (
              <>
                {/* Clear option if something is selected */}
                {(selectedMunicipality || selectedPlace) && (
                  <CommandGroup>
                    <CommandItem onSelect={handleClear} className="text-muted-foreground">
                      Fjern valg
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Municipalities grouped by country */}
                {groupedMunicipalities.map(({ country, municipalities }) => (
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
              </>
            )}

            {step === 'place' && selectedMunicipality && (
              <>
                {/* Back button */}
                <CommandGroup>
                  <CommandItem onSelect={handleBack} className="text-muted-foreground">
                    Tilbake til kommuner
                  </CommandItem>
                </CommandGroup>

                {/* Confirm municipality only */}
                <CommandGroup heading={`Velg hele ${selectedMunicipality.name}`}>
                  <CommandItem onSelect={handleConfirmMunicipality}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Hele {selectedMunicipality.name} kommune</span>
                    {!selectedPlace && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                </CommandGroup>

                {/* Places in municipality */}
                {places.length > 0 && (
                  <CommandGroup heading={`Steder i ${selectedMunicipality.name}`}>
                    {places.map((place) => (
                      <CommandItem
                        key={place.id}
                        value={`${place.name} ${selectedMunicipality.name}`}
                        onSelect={() => handleSelectPlace(place)}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>{place.name}</span>
                        {place.name_sami && place.name_sami !== place.name && (
                          <span className="ml-2 text-xs text-muted-foreground italic">
                            {place.name_sami}
                          </span>
                        )}
                        {selectedPlace?.id === place.id && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {places.length === 0 && !loading && (
                  <CommandGroup>
                    <CommandItem disabled>
                      Ingen steder registrert i denne kommunen
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
