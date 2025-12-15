// Geography types for Sapmi platform

export type GeographyScope = 'place' | 'municipality' | 'language_area' | 'country' | 'sapmi'

export interface Region {
  id: string
  name: string
  name_sami: string | null
  description: string | null
  created_at: string
}

export interface Country {
  id: string
  region_id: string
  name: string
  name_sami: string | null
  code: string  // 'NO', 'SE', 'FI', 'RU'
  sort_order: number
  created_at: string
}

export interface LanguageArea {
  id: string
  region_id: string
  name: string
  name_sami: string | null
  code: string  // 'north', 'south', 'lule', etc.
  description: string | null
  sort_order: number
  created_at: string
}

export interface LanguageAreaCountry {
  id: string
  language_area_id: string
  country_id: string
  created_at: string
}

export interface Municipality {
  id: string
  country_id: string
  language_area_id: string | null
  name: string
  name_sami: string | null
  slug: string
  population: number | null
  area_km2: number | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface Place {
  id: string
  municipality_id: string
  name: string
  name_sami: string | null
  slug: string
  description: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  created_by: string | null
}

export interface UserStarredMunicipality {
  id: string
  user_id: string
  municipality_id: string
  starred_at: string
}

export interface UserStarredPlace {
  id: string
  user_id: string
  place_id: string
  starred_at: string
}

// Extended types with relations

export interface MunicipalityWithRelations extends Municipality {
  country?: Country
  language_area?: LanguageArea | null
  places?: Place[]
}

export interface PlaceWithRelations extends Place {
  municipality?: MunicipalityWithRelations
}

export interface CountryWithRelations extends Country {
  region?: Region
  municipalities?: Municipality[]
  language_areas?: LanguageArea[]
}

export interface LanguageAreaWithRelations extends LanguageArea {
  region?: Region
  countries?: Country[]
  municipalities?: Municipality[]
}

// Hierarchy types for breadcrumbs

export interface MunicipalityHierarchy {
  municipality_name: string
  municipality_slug: string
  language_area_name: string | null
  language_area_code: string | null
  country_name: string
  country_code: string
  region_name: string
}

export interface PlaceHierarchy extends MunicipalityHierarchy {
  place_name: string
  place_slug: string
}

// Starred location type (combined)

export interface StarredLocation {
  location_type: 'municipality' | 'place'
  location_id: string
  location_name: string
  location_slug: string
  municipality_name: string | null  // Only for places
  municipality_slug: string         // For URL building (same as location_slug for municipalities)
  country_code: string
}

// Geography context for posts

export interface PostGeography {
  municipality_id: string | null
  place_id: string | null
  geography_scope: GeographyScope
  municipality?: {
    id: string
    name: string
    slug: string
  } | null
  place?: {
    id: string
    name: string
    slug: string
  } | null
}

// Profile geography fields

export interface ProfileGeography {
  home_municipality_id: string | null
  home_place_id: string | null
  current_municipality_id: string | null
  current_place_id: string | null
  home_municipality?: Municipality | null
  home_place?: Place | null
  current_municipality?: Municipality | null
  current_place?: Place | null
}

// Navigation/selection types

export interface GeographyOption {
  id: string
  name: string
  name_sami?: string | null
  type: 'region' | 'country' | 'language_area' | 'municipality' | 'place'
  parent_id?: string
  parent_name?: string
  code?: string
  slug?: string
}

export interface GeographyBreadcrumb {
  type: 'region' | 'country' | 'language_area' | 'municipality' | 'place'
  id: string
  name: string
  slug?: string
  code?: string
  href: string
}
