// Search configuration constants

export const SEARCH_CONFIG = {
  // Minimum characters to trigger search
  MIN_QUERY_LENGTH: 1,

  // Debounce delay in milliseconds
  DEBOUNCE_DELAY: 300,

  // Default result limits per category
  DEFAULT_LIMIT: 10,

  // Load more batch size (infinite scroll)
  LOAD_MORE_SIZE: 10,

  // Infinite scroll threshold (load more when this many items from bottom)
  INFINITE_SCROLL_THRESHOLD: 10,

  // Cache TTL in milliseconds (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,
} as const

export const SEARCH_LIMITS = {
  brukere: 10,
  innlegg: 10,
  arrangementer: 10,
  kommentarer: 10,
  geografi: 10,
  // Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
  // samfunn: 10,
  // tjenester: 10,
  // produkter: 10,
} as const

// Search category type
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
export type SearchCategory =
  | 'alle'
  | 'brukere'
  | 'innlegg'
  | 'arrangementer'
  | 'kommentarer'
  | 'geografi'
  // | 'samfunn'
  // | 'tjenester'
  // | 'produkter'

// Category names in Norwegian
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
export const CATEGORY_NAMES: Record<SearchCategory, string> = {
  alle: 'Alle',
  brukere: 'Brukere',
  innlegg: 'Innlegg',
  arrangementer: 'Arrangementer',
  kommentarer: 'Kommentarer',
  geografi: 'Hvor?',
  // samfunn: 'Samfunn',
  // tjenester: 'Tjenester',
  // produkter: 'Produkter',
}

// All categories except 'alle'
// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
export const SEARCHABLE_CATEGORIES: Exclude<SearchCategory, 'alle'>[] = [
  'brukere',
  'innlegg',
  'arrangementer',
  'kommentarer',
  'geografi',
  // 'samfunn',
  // 'tjenester',
  // 'produkter',
]
