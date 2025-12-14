// Search configuration constants

export const SEARCH_CONFIG = {
  // Minimum characters to trigger search
  MIN_QUERY_LENGTH: 1,

  // Debounce delay in milliseconds
  DEBOUNCE_DELAY: 300,

  // Default result limits per category
  DEFAULT_LIMIT: 6,

  // Load more batch size
  LOAD_MORE_SIZE: 12,

  // Cache TTL in milliseconds (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,
} as const

export const SEARCH_LIMITS = {
  brukere: 6,
  innlegg: 6,
  arrangementer: 6,
  kommentarer: 6,
  geografi: 6,
  samfunn: 6,
  tjenester: 6,
  produkter: 6,
} as const

// Search category type
export type SearchCategory =
  | 'alle'
  | 'brukere'
  | 'innlegg'
  | 'arrangementer'
  | 'kommentarer'
  | 'geografi'
  | 'samfunn'
  | 'tjenester'
  | 'produkter'

// Category names in Norwegian
export const CATEGORY_NAMES: Record<SearchCategory, string> = {
  alle: 'Alle',
  brukere: 'Brukere',
  innlegg: 'Innlegg',
  arrangementer: 'Arrangementer',
  kommentarer: 'Kommentarer',
  geografi: 'Hvor?',
  samfunn: 'Samfunn',
  tjenester: 'Tjenester',
  produkter: 'Produkter',
}

// All categories except 'alle'
export const SEARCHABLE_CATEGORIES: Exclude<SearchCategory, 'alle'>[] = [
  'brukere',
  'innlegg',
  'arrangementer',
  'kommentarer',
  'geografi',
  'samfunn',
  'tjenester',
  'produkter',
]
