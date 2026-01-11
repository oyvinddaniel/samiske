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

export async function starLanguageArea(userId: string, languageAreaId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_language_areas')
    .insert({ user_id: userId, language_area_id: languageAreaId })

  if (error) {
    console.error('Error starring language area:', error)
    return false
  }
  return true
}

export async function unstarLanguageArea(userId: string, languageAreaId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_starred_language_areas')
    .delete()
    .eq('user_id', userId)
    .eq('language_area_id', languageAreaId)

  if (error) {
    console.error('Error unstarring language area:', error)
    return false
  }
  return true
}

export async function isLocationStarred(
  userId: string,
  locationId: string,
  locationType: 'language_area' | 'municipality' | 'place'
): Promise<boolean> {
  const supabase = getSupabase()
  const table =
    locationType === 'language_area' ? 'user_starred_language_areas' :
    locationType === 'municipality' ? 'user_starred_municipalities' : 'user_starred_places'
  const idColumn =
    locationType === 'language_area' ? 'language_area_id' :
    locationType === 'municipality' ? 'municipality_id' : 'place_id'

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

// =====================================================
// USER LOCATION FUNCTIONS
// =====================================================

export interface UserLocations {
  currentMunicipalityId: string | null
  currentPlaceId: string | null
  homeMunicipalityId: string | null
  homePlaceId: string | null
}

export async function getUserLocations(userId: string): Promise<UserLocations | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('current_municipality_id, current_place_id, home_municipality_id, home_place_id')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user locations:', error)
    return null
  }

  return {
    currentMunicipalityId: data.current_municipality_id,
    currentPlaceId: data.current_place_id,
    homeMunicipalityId: data.home_municipality_id,
    homePlaceId: data.home_place_id
  }
}

export async function setUserLocation(
  userId: string,
  locationType: 'current' | 'home',
  municipalityId: string | null,
  placeId: string | null,
  autoStar: boolean = true
): Promise<boolean> {
  const supabase = getSupabase()

  // Build the update object based on location type
  const updateData = locationType === 'current'
    ? { current_municipality_id: municipalityId, current_place_id: placeId }
    : { home_municipality_id: municipalityId, home_place_id: placeId }

  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('Error setting user location:', error)
    return false
  }

  // Auto-star the location if requested
  if (autoStar) {
    if (placeId) {
      // Check if already starred
      const isStarred = await isLocationStarred(userId, placeId, 'place')
      if (!isStarred) {
        await starPlace(userId, placeId)
      }
    } else if (municipalityId) {
      // Check if already starred
      const isStarred = await isLocationStarred(userId, municipalityId, 'municipality')
      if (!isStarred) {
        await starMunicipality(userId, municipalityId)
      }
    }
  }

  return true
}

export async function completeOnboarding(userId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId)

  if (error) {
    console.error('Error completing onboarding:', error)
    return false
  }
  return true
}

// =====================================================
// GEOCODING (Nominatim / OpenStreetMap)
// =====================================================

export interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
  type: string
}

/**
 * Search for coordinates using Nominatim (OpenStreetMap geocoding API)
 * Free to use, but has usage limits (1 request/second, no heavy usage)
 *
 * @param placeName - Name of the place (e.g., "Kautokeino")
 * @param municipalityName - Optional municipality name for better accuracy
 * @param countryCode - ISO country code (e.g., "no", "se", "fi")
 */
export async function geocodePlace(
  placeName: string,
  municipalityName?: string,
  countryCode: string = 'no'
): Promise<GeocodingResult | null> {
  try {
    // Build search query
    const searchParts = [placeName]
    if (municipalityName && municipalityName !== placeName) {
      searchParts.push(municipalityName)
    }

    // Add country name for better results
    const countryNames: Record<string, string> = {
      no: 'Norway',
      se: 'Sweden',
      fi: 'Finland',
      ru: 'Russia'
    }
    const country = countryNames[countryCode.toLowerCase()] || 'Norway'
    searchParts.push(country)

    const query = encodeURIComponent(searchParts.join(', '))

    // Nominatim API (free, no API key required)
    // Important: Must include a valid User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=${countryCode}`,
      {
        headers: {
          'User-Agent': 'samiske.no/1.0 (https://samiske.no)',
          'Accept-Language': 'no,en'
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status)
      return null
    }

    const results = await response.json()

    if (results.length === 0) {
      console.log(`No geocoding results for: ${searchParts.join(', ')}`)
      return null
    }

    const result = results[0]
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      type: result.type
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Geocode a municipality by name
 */
export async function geocodeMunicipality(
  municipalityName: string,
  countryCode: string = 'no'
): Promise<GeocodingResult | null> {
  return geocodePlace(municipalityName, undefined, countryCode)
}

/**
 * Update coordinates for an existing place in the database
 */
export async function updatePlaceCoordinates(
  placeId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('places')
    .update({ latitude, longitude })
    .eq('id', placeId)

  if (error) {
    console.error('Error updating place coordinates:', error)
    return false
  }
  return true
}

/**
 * Update coordinates for an existing municipality in the database
 */
export async function updateMunicipalityCoordinates(
  municipalityId: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('municipalities')
    .update({ latitude, longitude })
    .eq('id', municipalityId)

  if (error) {
    console.error('Error updating municipality coordinates:', error)
    return false
  }
  return true
}

/**
 * Auto-geocode a place and update the database
 * Returns the coordinates if successful
 */
export async function autoGeocodePlace(
  placeId: string,
  placeName: string,
  municipalityName?: string,
  countryCode: string = 'no'
): Promise<{ latitude: number; longitude: number } | null> {
  const result = await geocodePlace(placeName, municipalityName, countryCode)

  if (!result) return null

  const success = await updatePlaceCoordinates(placeId, result.latitude, result.longitude)

  if (success) {
    return { latitude: result.latitude, longitude: result.longitude }
  }
  return null
}

/**
 * Auto-geocode a municipality and update the database
 */
export async function autoGeocodeMunicipality(
  municipalityId: string,
  municipalityName: string,
  countryCode: string = 'no'
): Promise<{ latitude: number; longitude: number } | null> {
  const result = await geocodeMunicipality(municipalityName, countryCode)

  if (!result) return null

  const success = await updateMunicipalityCoordinates(municipalityId, result.latitude, result.longitude)

  if (success) {
    return { latitude: result.latitude, longitude: result.longitude }
  }
  return null
}
