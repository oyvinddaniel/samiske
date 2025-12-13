// Geography helper functions for Sapmi platform

import { createClient } from '@/lib/supabase/client'
import type {
  Region,
  Country,
  LanguageArea,
  Municipality,
  Place,
  MunicipalityWithRelations,
  PlaceWithRelations,
  GeographyBreadcrumb,
  StarredLocation,
  GeographyScope
} from '@/lib/types/geography'

// Create Supabase client
const getSupabase = () => createClient()

// =====================================================
// FETCH FUNCTIONS
// =====================================================

export async function getRegion(): Promise<Region | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching region:', error)
    return null
  }
  return data
}

export async function getCountries(): Promise<Country[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('Error fetching countries:', error)
    return []
  }
  return data || []
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('code', code)
    .single()

  if (error) {
    console.error('Error fetching country:', error)
    return null
  }
  return data
}

export async function getLanguageAreas(): Promise<LanguageArea[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('language_areas')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('Error fetching language areas:', error)
    return []
  }
  return data || []
}

export async function getLanguageAreaByCode(code: string): Promise<LanguageArea | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('language_areas')
    .select('*')
    .eq('code', code)
    .single()

  if (error) {
    console.error('Error fetching language area:', error)
    return null
  }
  return data
}

export async function getLanguageAreasForCountry(countryId: string): Promise<LanguageArea[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('language_area_countries')
    .select(`
      language_area:language_areas(*)
    `)
    .eq('country_id', countryId)

  if (error) {
    console.error('Error fetching language areas for country:', error)
    return []
  }

  return (data || [])
    .map(item => item.language_area as unknown as LanguageArea)
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function getMunicipalitiesForCountry(countryId: string): Promise<Municipality[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('country_id', countryId)
    .order('name')

  if (error) {
    console.error('Error fetching municipalities:', error)
    return []
  }
  return data || []
}

export async function getMunicipalitiesForLanguageArea(languageAreaId: string): Promise<Municipality[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .eq('language_area_id', languageAreaId)
    .order('name')

  if (error) {
    console.error('Error fetching municipalities:', error)
    return []
  }
  return data || []
}

export async function getMunicipalityBySlug(countryCode: string, slug: string): Promise<MunicipalityWithRelations | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('municipalities')
    .select(`
      *,
      country:countries(*),
      language_area:language_areas(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching municipality:', error)
    return null
  }

  // Verify country code matches
  if (data?.country?.code !== countryCode) {
    return null
  }

  return data as MunicipalityWithRelations
}

export async function getMunicipalityById(id: string): Promise<MunicipalityWithRelations | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('municipalities')
    .select(`
      *,
      country:countries(*),
      language_area:language_areas(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching municipality:', error)
    return null
  }
  return data as MunicipalityWithRelations
}

export async function getPlacesForMunicipality(municipalityId: string): Promise<Place[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('municipality_id', municipalityId)
    .order('name')

  if (error) {
    console.error('Error fetching places:', error)
    return []
  }
  return data || []
}

export async function getPlaceBySlug(municipalitySlug: string, placeSlug: string): Promise<PlaceWithRelations | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      municipality:municipalities(
        *,
        country:countries(*),
        language_area:language_areas(*)
      )
    `)
    .eq('slug', placeSlug)
    .single()

  if (error) {
    console.error('Error fetching place:', error)
    return null
  }

  // Verify municipality slug matches
  if (data?.municipality?.slug !== municipalitySlug) {
    return null
  }

  return data as PlaceWithRelations
}

export async function getPlaceById(id: string): Promise<PlaceWithRelations | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      municipality:municipalities(
        *,
        country:countries(*),
        language_area:language_areas(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching place:', error)
    return null
  }
  return data as PlaceWithRelations
}

// =====================================================
// STARRED LOCATIONS
// =====================================================

export async function getUserStarredLocations(userId: string): Promise<StarredLocation[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .rpc('get_user_starred_locations', { user_id_param: userId })

  if (error) {
    console.error('Error fetching starred locations:', error)
    return []
  }
  return data || []
}

export async function starMunicipality(userId: string, municipalityId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_municipalities')
    .insert({ user_id: userId, municipality_id: municipalityId })

  if (error) {
    console.error('Error starring municipality:', error)
    return false
  }
  return true
}

export async function unstarMunicipality(userId: string, municipalityId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_municipalities')
    .delete()
    .eq('user_id', userId)
    .eq('municipality_id', municipalityId)

  if (error) {
    console.error('Error unstarring municipality:', error)
    return false
  }
  return true
}

export async function starPlace(userId: string, placeId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_places')
    .insert({ user_id: userId, place_id: placeId })

  if (error) {
    console.error('Error starring place:', error)
    return false
  }
  return true
}

export async function unstarPlace(userId: string, placeId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_places')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId)

  if (error) {
    console.error('Error unstarring place:', error)
    return false
  }
  return true
}

export async function isLocationStarred(
  userId: string,
  locationId: string,
  locationType: 'municipality' | 'place'
): Promise<boolean> {
  const supabase = getSupabase()
  const table = locationType === 'municipality' ? 'user_starred_municipalities' : 'user_starred_places'
  const idColumn = locationType === 'municipality' ? 'municipality_id' : 'place_id'

  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq(idColumn, locationId)

  if (error) {
    console.error('Error checking starred status:', error)
    return false
  }
  return (count || 0) > 0
}

// =====================================================
// BREADCRUMB HELPERS
// =====================================================

export function buildBreadcrumbsForMunicipality(municipality: MunicipalityWithRelations): GeographyBreadcrumb[] {
  const breadcrumbs: GeographyBreadcrumb[] = [
    {
      type: 'region',
      id: municipality.country?.region_id || '',
      name: 'Sapmi',
      href: '/sapmi'
    },
    {
      type: 'country',
      id: municipality.country?.id || '',
      name: municipality.country?.name || '',
      code: municipality.country?.code,
      href: `/sapmi/${municipality.country?.code?.toLowerCase()}`
    }
  ]

  if (municipality.language_area) {
    breadcrumbs.push({
      type: 'language_area',
      id: municipality.language_area.id,
      name: municipality.language_area.name,
      code: municipality.language_area.code,
      href: `/sapmi/${municipality.country?.code?.toLowerCase()}/${municipality.language_area.code}`
    })
  }

  breadcrumbs.push({
    type: 'municipality',
    id: municipality.id,
    name: municipality.name,
    slug: municipality.slug,
    href: `/sapmi/${municipality.country?.code?.toLowerCase()}/${municipality.language_area?.code || '_'}/${municipality.slug}`
  })

  return breadcrumbs
}

export function buildBreadcrumbsForPlace(place: PlaceWithRelations): GeographyBreadcrumb[] {
  if (!place.municipality) return []

  const breadcrumbs = buildBreadcrumbsForMunicipality(place.municipality)

  breadcrumbs.push({
    type: 'place',
    id: place.id,
    name: place.name,
    slug: place.slug,
    href: `/sapmi/${place.municipality.country?.code?.toLowerCase()}/${place.municipality.language_area?.code || '_'}/${place.municipality.slug}/${place.slug}`
  })

  return breadcrumbs
}

// =====================================================
// URL HELPERS
// =====================================================

export function getGeographyUrl(
  type: 'country' | 'language_area' | 'municipality' | 'place',
  params: {
    countryCode?: string
    languageAreaCode?: string
    municipalitySlug?: string
    placeSlug?: string
  }
): string {
  const base = '/sapmi'

  switch (type) {
    case 'country':
      return `${base}/${params.countryCode?.toLowerCase()}`
    case 'language_area':
      return `${base}/${params.countryCode?.toLowerCase()}/${params.languageAreaCode}`
    case 'municipality':
      return `${base}/${params.countryCode?.toLowerCase()}/${params.languageAreaCode || '_'}/${params.municipalitySlug}`
    case 'place':
      return `${base}/${params.countryCode?.toLowerCase()}/${params.languageAreaCode || '_'}/${params.municipalitySlug}/${params.placeSlug}`
    default:
      return base
  }
}

// =====================================================
// GEOGRAPHY SCOPE HELPERS
// =====================================================

export function getGeographyScopeLabel(scope: GeographyScope): string {
  const labels: Record<GeographyScope, string> = {
    place: 'Sted',
    municipality: 'Kommune',
    language_area: 'Sprakområde',
    country: 'Land',
    sapmi: 'Hele Sapmi'
  }
  return labels[scope]
}

export function getDefaultGeographyScope(): GeographyScope {
  return 'sapmi'
}
