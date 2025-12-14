import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Country, LanguageArea, Municipality, Place, Suggestion } from './types'

export function useGeographyData() {
  const supabase = useMemo(() => createClient(), [])

  // Data state
  const [countries, setCountries] = useState<Country[]>([])
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Fetch all data
  const fetchData = useCallback(async () => {
    const [countriesRes, languageAreasRes, municipalitiesRes, placesRes, suggestionsRes] = await Promise.all([
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('language_areas').select('*').order('sort_order'),
      supabase.from('municipalities').select(`
        *,
        country:countries(*),
        language_area:language_areas(*)
      `).order('name'),
      supabase.from('places').select(`
        *,
        municipality:municipalities(
          *,
          country:countries(*)
        )
      `).order('name'),
      supabase.from('geography_suggestions').select(`
        *,
        user:profiles(id, full_name, email)
      `).order('created_at', { ascending: false }),
    ])

    if (countriesRes.data) setCountries(countriesRes.data)
    if (languageAreasRes.data) setLanguageAreas(languageAreasRes.data)
    if (municipalitiesRes.data) {
      setMunicipalities(municipalitiesRes.data.map(m => ({
        ...m,
        country: Array.isArray(m.country) ? m.country[0] : m.country,
        language_area: Array.isArray(m.language_area) ? m.language_area[0] : m.language_area,
      })))
    }
    if (placesRes.data) {
      setPlaces(placesRes.data.map(p => ({
        ...p,
        municipality: Array.isArray(p.municipality) ? p.municipality[0] : p.municipality,
      })))
    }
    if (suggestionsRes.data) {
      setSuggestions(suggestionsRes.data.map(s => ({
        ...s,
        user: Array.isArray(s.user) ? s.user[0] : s.user,
      })) as Suggestion[])
    }
  }, [supabase])

  return {
    supabase,
    countries,
    languageAreas,
    municipalities,
    places,
    suggestions,
    fetchData,
  }
}
