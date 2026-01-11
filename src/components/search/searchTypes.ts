// Search result types

import type { SearchCategory } from '@/lib/search/searchConstants'

// Base search result type
export interface BaseSearchResult {
  id: string
  type: Exclude<SearchCategory, 'alle'>
  created_at?: string
}

// User search result
export interface UserSearchResult extends BaseSearchResult {
  type: 'brukere'
  full_name: string
  avatar_url: string | null
}

// Post search result
export interface PostSearchResult extends BaseSearchResult {
  type: 'innlegg'
  title: string | null
  content: string | null
  image_url: string | null
  category: {
    name: string
    color: string
  } | null
  user: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

// Event search result
export interface EventSearchResult extends BaseSearchResult {
  type: 'arrangementer'
  title: string | null
  content: string | null
  event_date: string | null
  event_time: string | null
  event_location: string | null
  image_url: string | null
  category: {
    name: string
    color: string
  } | null
}

// Comment search result
export interface CommentSearchResult extends BaseSearchResult {
  type: 'kommentarer'
  content: string
  user: {
    full_name: string | null
    avatar_url: string | null
  } | null
  post: {
    id: string
    title: string | null
  } | null
}

// Geography search result
export interface GeographySearchResult extends BaseSearchResult {
  type: 'geografi'
  name: string
  name_sami: string | null
  location_type: 'language_area' | 'municipality' | 'place'
  slug?: string
  code?: string // For language areas
  parent?: string // Parent location name
  country_code?: string
  // For places - need municipality info for routing
  municipality_slug?: string
}

// Community search result
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
// export interface CommunitySearchResult extends BaseSearchResult {
//   type: 'samfunn'
//   name: string
//   slug: string
//   logo_url: string | null
//   category: string
//   follower_count: number
//   is_verified: boolean
// }

// Service search result
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
// export interface ServiceSearchResult extends BaseSearchResult {
//   type: 'tjenester'
//   name: string
//   slug: string
//   description: string | null
//   category: string
//   images: string[]
//   is_online: boolean
//   community: {
//     id: string
//     name: string
//     slug: string
//     logo_url: string | null
//   } | null
// }

// Product search result
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
// export interface ProductSearchResult extends BaseSearchResult {
//   type: 'produkter'
//   name: string
//   slug: string
//   description: string | null
//   category: string
//   primary_image: string | null
//   price: number | null
//   currency: string
//   in_stock: boolean
//   community: {
//     id: string
//     name: string
//     slug: string
//     logo_url: string | null
//   } | null
// }

// Union type of all search results
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
export type SearchResult =
  | UserSearchResult
  | PostSearchResult
  | EventSearchResult
  | CommentSearchResult
  | GeographySearchResult
  // | CommunitySearchResult
  // | ServiceSearchResult
  // | ProductSearchResult

// Category results state
export interface CategoryResultsState {
  items: SearchResult[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  total: number
}

// All categories results
export type AllCategoryResults = Record<
  Exclude<SearchCategory, 'alle'>,
  CategoryResultsState
>
