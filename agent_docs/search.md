# Søkesystem - samiske.no

> Omfattende søkesystem med 8 kategorier, caching, og avansert funksjonalitet

## Oversikt

Søkesystemet er designet for å søke i hele plattformen på tvers av 8 ulike kategorier:

1. **Brukere** (profiles)
2. **Innlegg** (posts med type='standard')
3. **Arrangementer** (posts med type='event')
4. **Kommentarer** (comments)
5. **Geografi** (language_areas, municipalities, places)
6. **Samfunn** (communities)
7. **Tjenester** (services) - NY
8. **Produkter** (products) - NY

## Arkitektur

### Mappestruktur

```
src/lib/search/
├── searchConstants.ts    # Konfigurasjon og typer
├── searchCache.ts        # In-memory caching
└── searchQueries.ts      # Alle søkefunksjoner

src/components/search/
├── searchTypes.ts               # TypeScript typer
├── useSearch.ts                 # Hoved-søkehook
├── useKeyboardNav.ts            # Tastaturnavigasjon
├── UnifiedSearchBar.tsx         # Hovedkomponent
├── SearchCategoryFilter.tsx     # Kategorifilter
├── SearchResultsList.tsx        # Resultatliste
├── SearchResultItem.tsx         # Generisk resultatkomponent
└── GeographySearchResult.tsx    # Geografi med stjernemerking

src/lib/types/
├── services.ts          # Service typer
└── products.ts          # Product typer
```

### Dataflyt

1. **Brukerinput** → UnifiedSearchBar (debounce 300ms)
2. **Søk** → searchQueries → Supabase
3. **Cache** → searchCache (5 min TTL)
4. **Resultater** → SearchResultsList → SearchResultItem
5. **Interaksjon** → Keyboard nav / Click handlers

## Konfigurasjon

### searchConstants.ts

```typescript
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 1,        // Minimum tegn for søk
  DEBOUNCE_DELAY: 300,        // ms debounce
  DEFAULT_LIMIT: 6,           // Resultater per kategori
  LOAD_MORE_SIZE: 12,         // Antall ved "Vis flere"
  CACHE_TTL: 5 * 60 * 1000,  // 5 minutters cache
}

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

export const SEARCHABLE_CATEGORIES = [
  'brukere',
  'innlegg',
  'arrangementer',
  'kommentarer',
  'geografi',
  'samfunn',
  'tjenester',
  'produkter',
] as const

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
```

## Database Schema

### Services (Tjenester)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'consulting', 'education', 'healthcare', 'legal',
    'translation', 'cultural', 'technology', 'other'
  )),
  images JSONB DEFAULT '[]'::jsonb,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  municipality_id UUID REFERENCES municipalities(id),
  place_id UUID REFERENCES places(id),
  is_online BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false
);

-- Full-text search indexes
CREATE INDEX idx_services_name ON services USING gin(to_tsvector('norwegian', name));
CREATE INDEX idx_services_description ON services USING gin(to_tsvector('norwegian', description));
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_services_community ON services(community_id);
```

### Products (Produkter)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'handicraft', 'art', 'clothing', 'jewelry',
    'food', 'books', 'music', 'home', 'other'
  )),
  images JSONB DEFAULT '[]'::jsonb,
  primary_image TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'NOK',
  price_type TEXT CHECK (price_type IN ('fixed', 'from', 'contact')) DEFAULT 'fixed',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  purchase_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  municipality_id UUID REFERENCES municipalities(id),
  place_id UUID REFERENCES places(id),
  ships_nationally BOOLEAN DEFAULT false,
  ships_internationally BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false
);

-- Full-text search indexes
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('norwegian', name));
CREATE INDEX idx_products_description ON products USING gin(to_tsvector('norwegian', description));
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_community ON products(community_id);
```

### RLS Policies

**Services:**
```sql
-- SELECT: Alle kan se aktive tjenester
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (is_active = true);

-- INSERT/UPDATE/DELETE: Kun community admins
CREATE POLICY "Community admins can manage services"
  ON services FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM community_members
      WHERE community_id = services.community_id
      AND role = 'admin'
    )
  );
```

**Products:**
```sql
-- SELECT: Alle kan se aktive produkter
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);

-- INSERT/UPDATE/DELETE: Kun community admins
CREATE POLICY "Community admins can manage products"
  ON products FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM community_members
      WHERE community_id = products.community_id
      AND role = 'admin'
    )
  );
```

## Søkefunksjoner

### searchQueries.ts

**Brukere (searchUsers)**
```typescript
export async function searchUsers(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  offset = 0
): Promise<UserSearchResult[]> {
  const supabase = createClient()

  let queryBuilder = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.ilike('full_name', `%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []).map((user) => ({
    type: 'brukere',
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
  }))
}
```

**Innlegg (searchPosts)**
```typescript
export async function searchPosts(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  offset = 0
): Promise<PostSearchResult[]> {
  const supabase = createClient()

  let queryBuilder = supabase
    .from('posts')
    .select('id, title, content, created_at, category:categories(name, color)')
    .eq('type', 'standard')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []).map((post) => ({
    type: 'innlegg',
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
  }))
}
```

**Arrangementer (searchEvents)**
```typescript
export async function searchEvents(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  offset = 0
): Promise<EventSearchResult[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  let queryBuilder = supabase
    .from('posts')
    .select('id, title, content, event_date, event_location, category:categories(name, color)')
    .eq('type', 'event')
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  if (query) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%,event_location.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []).map((event) => ({
    type: 'arrangementer',
    id: event.id,
    title: event.title,
    content: event.content,
    event_date: event.event_date,
    event_location: event.event_location,
    category: event.category,
  }))
}
```

**Geografi (searchGeography)**
```typescript
export async function searchGeography(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT
): Promise<GeographySearchResult[]> {
  const supabase = createClient()

  // Søk i language_areas, municipalities, og places parallelt
  const [languageAreasRes, municipalitiesRes, placesRes] = await Promise.allSettled([
    supabase
      .from('language_areas')
      .select('id, name, name_sami, code')
      .or(query ? `name.ilike.%${query}%,name_sami.ilike.%${query}%` : '')
      .limit(Math.ceil(limit / 3)),
    supabase
      .from('municipalities')
      .select('id, name, name_sami, slug')
      .or(query ? `name.ilike.%${query}%,name_sami.ilike.%${query}%` : '')
      .limit(Math.ceil(limit / 3)),
    supabase
      .from('places')
      .select('id, name, name_sami, slug, municipality:municipalities(name)')
      .or(query ? `name.ilike.%${query}%,name_sami.ilike.%${query}%` : '')
      .limit(Math.ceil(limit / 3)),
  ])

  const results: GeographySearchResult[] = []

  // Language areas
  if (languageAreasRes.status === 'fulfilled' && languageAreasRes.value.data) {
    results.push(
      ...languageAreasRes.value.data.map((area) => ({
        type: 'geografi' as const,
        id: area.id,
        name: area.name,
        name_sami: area.name_sami,
        location_type: 'language_area' as const,
        parent: null,
      }))
    )
  }

  // Municipalities
  if (municipalitiesRes.status === 'fulfilled' && municipalitiesRes.value.data) {
    results.push(
      ...municipalitiesRes.value.data.map((muni) => ({
        type: 'geografi' as const,
        id: muni.id,
        name: muni.name,
        name_sami: muni.name_sami,
        location_type: 'municipality' as const,
        parent: null,
      }))
    )
  }

  // Places
  if (placesRes.status === 'fulfilled' && placesRes.value.data) {
    results.push(
      ...placesRes.value.data.map((place) => ({
        type: 'geografi' as const,
        id: place.id,
        name: place.name,
        name_sami: place.name_sami,
        location_type: 'place' as const,
        parent: place.municipality?.name || null,
      }))
    )
  }

  return results.slice(0, limit)
}
```

**Tjenester (searchServices)**
```typescript
export async function searchServices(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  offset = 0
): Promise<ServiceSearchResult[]> {
  const supabase = createClient()

  let queryBuilder = supabase
    .from('services')
    .select('id, name, description, category, images, community:communities(name, logo_url)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []).map((service) => ({
    type: 'tjenester',
    id: service.id,
    name: service.name,
    description: service.description,
    category: service.category,
    images: service.images,
    community: service.community,
  }))
}
```

**Produkter (searchProducts)**
```typescript
export async function searchProducts(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT,
  offset = 0
): Promise<ProductSearchResult[]> {
  const supabase = createClient()

  let queryBuilder = supabase
    .from('products')
    .select('id, name, description, category, primary_image, price, currency, in_stock, community:communities(name, logo_url)')
    .eq('is_active', true)
    .eq('in_stock', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []).map((product) => ({
    type: 'produkter',
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    primary_image: product.primary_image,
    price: product.price,
    currency: product.currency,
    in_stock: product.in_stock,
    community: product.community,
  }))
}
```

**Alle kategorier (searchAll)**
```typescript
export async function searchAll(
  query: string,
  limit = SEARCH_CONFIG.DEFAULT_LIMIT
): Promise<AllCategoryResults> {
  // Kjør alle søk parallelt
  const results = await Promise.allSettled([
    searchUsers(query, limit),
    searchPosts(query, limit),
    searchEvents(query, limit),
    searchComments(query, limit),
    searchGeography(query, limit),
    searchCommunities(query, limit),
    searchServices(query, limit),
    searchProducts(query, limit),
  ])

  return {
    brukere: {
      items: results[0].status === 'fulfilled' ? results[0].value : [],
      loading: false,
      error: results[0].status === 'rejected' ? results[0].reason : null,
    },
    innlegg: {
      items: results[1].status === 'fulfilled' ? results[1].value : [],
      loading: false,
      error: results[1].status === 'rejected' ? results[1].reason : null,
    },
    // ... osv for alle 8 kategorier
  }
}
```

## Caching

### searchCache.ts

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SearchCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttl: number = SEARCH_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  cleanup(): void {
    const now = Date.now()
    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const searchCache = new SearchCache()

// Automatisk cleanup hvert 5. minutt
setInterval(() => searchCache.cleanup(), 5 * 60 * 1000)
```

**Cache nøkler:**
- Format: `search:{category}:{query}:{offset}`
- Eksempel: `search:brukere:john:0`
- Tom query for forhåndspopulerte resultater: `search:arrangementer::0`

**Cache invalidering:**
```typescript
// Invalider alle produktsøk når produkt oppdateres
searchCache.invalidate('produkter')

// Invalider spesifikk søk
searchCache.clear()
```

## React Hooks

### useSearch.ts

```typescript
export function useSearch() {
  const [results, setResults] = useState<AllCategoryResults>(/* initial state */)

  const search = useCallback(async (
    query: string,
    category: SearchCategory
  ) => {
    const cacheKey = `search:${category}:${query}:0`

    // Sjekk cache
    const cached = searchCache.get(cacheKey)
    if (cached) {
      setResults((prev) => ({
        ...prev,
        [category]: { items: cached, loading: false, error: null },
      }))
      return
    }

    // Start loading
    setResults((prev) => ({
      ...prev,
      [category]: { ...prev[category], loading: true },
    }))

    try {
      const searchFn = searchFunctions[category]
      const data = await searchFn(query)

      searchCache.set(cacheKey, data)

      setResults((prev) => ({
        ...prev,
        [category]: { items: data, loading: false, error: null },
      }))
    } catch (error) {
      console.error('Search error:', error)
      toast.error(`Kunne ikke søke i ${CATEGORY_NAMES[category]}`)

      setResults((prev) => ({
        ...prev,
        [category]: { ...prev[category], loading: false, error },
      }))
    }
  }, [])

  const loadMore = useCallback(async (category: SearchCategory) => {
    const currentCount = results[category].items.length
    // ... implementering
  }, [results])

  return { results, search, loadMore }
}
```

### useKeyboardNav.ts

```typescript
export function useKeyboardNav(
  results: SearchResult[],
  onSelect: (result: SearchResult) => void,
  onClose: () => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[highlightedIndex]) {
            onSelect(results[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [results, highlightedIndex, onSelect, onClose])

  return { highlightedIndex, setHighlightedIndex }
}
```

## Komponenter

### UnifiedSearchBar.tsx

**Hovedfunksjoner:**
- Debouncing (300ms)
- Forhåndspopulerte resultater (ved fokus uten query)
- Click-outside lukking
- Tastaturnavigasjon
- Kategoribytte

```typescript
export function UnifiedSearchBar() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('brukere')
  const [showResults, setShowResults] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { results, search, loadMore } = useSearch()
  const searchBarRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        search(query, selectedCategory)
      }
    }, SEARCH_CONFIG.DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [query, selectedCategory, search])

  // Load recent items on focus (no query)
  const handleFocus = async () => {
    setShowResults(true)
    if (!query && isInitialLoad) {
      await loadRecentItems(selectedCategory)
      setIsInitialLoad(false)
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showResults])

  return (
    <div ref={searchBarRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        placeholder="Søk etter innlegg, brukere, arrangementer..."
        className="..."
      />

      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl">
          <div className="flex gap-4">
            <SearchCategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              results={results}
            />
            <SearchResultsList
              results={results}
              category={selectedCategory}
              onLoadMore={loadMore}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### SearchCategoryFilter.tsx

**Responsivt design:**
- Desktop: Vertikal sidebar på VENSTRE side
- Mobil: Horisontale ikoner på TOPPEN som bryter til neste linje

```typescript
export function SearchCategoryFilter({
  selected,
  onSelect,
  results,
}: SearchCategoryFilterProps) {
  const allCategories: SearchCategory[] = ['alle', ...SEARCHABLE_CATEGORIES]

  const getCategoryCount = (category: SearchCategory) => {
    if (category === 'alle') {
      return Object.values(results).reduce((sum, r) => sum + r.items.length, 0)
    }
    return results[category].items.length
  }

  return (
    <>
      {/* Desktop: Vertical sidebar on LEFT */}
      <div className="hidden md:flex flex-col gap-1 w-48 p-3 border-r border-gray-200 flex-shrink-0">
        {allCategories.map((category) => {
          const Icon = CATEGORY_ICONS[category]
          const count = getCategoryCount(category)
          const isSelected = selected === category

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                isSelected
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{CATEGORY_NAMES[category]}</span>
              {count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile: Wrapping icons at TOP */}
      <div className="md:hidden flex flex-wrap gap-2 p-3 border-b border-gray-200">
        {allCategories.map((category) => {
          const Icon = CATEGORY_ICONS[category]
          const count = getCategoryCount(category)
          const isSelected = selected === category

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg flex-shrink-0 min-w-[80px] transition-colors',
                isSelected
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium whitespace-nowrap">
                {CATEGORY_NAMES[category]}
              </span>
              {count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-bold',
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
```

**Ikoner (Lucide React):**
- Alle: Grid3x3
- Brukere: User
- Innlegg: FileText
- Arrangementer: Calendar
- Kommentarer: MessageCircle
- Geografi: MapPin
- Samfunn: Building2
- Tjenester: Briefcase
- Produkter: ShoppingBag

### SearchResultItem.tsx

Generisk resultatkomponent med spesialbehandling for:

**Brukere:**
- Viser ProfileOverlay ved klikk
- Avatar eller initialer
- Full navn

**Geografi:**
- Bruker GeographySearchResult (med stjernemerking)
- Viser type (språkområde/kommune/sted)
- Parent info hvis tilgjengelig

**Andre typer:**
- Type-spesifikke ikoner og farger
- Tittel/navn
- Beskrivelse/innhold (trunkert)
- Metadata (kategori, dato, pris, osv.)

### GeographySearchResult.tsx

**Funksjoner:**
- Viser geografisk sted med ikon
- Stjernemerking direkte fra søkeresultater
- Støtter alle 3 typer: language_area, municipality, place
- Optimistisk UI (oppdaterer umiddelbart)
- Toast-notifikasjoner

```typescript
export function GeographySearchResult({
  location,
  isHighlighted,
}: GeographySearchResultProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [isStarring, setIsStarring] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Check if starred
  useEffect(() => {
    if (!currentUserId) return

    const checkStarred = async () => {
      const starred = await isLocationStarred(
        currentUserId,
        location.id,
        location.location_type
      )
      setIsStarred(starred)
    }

    checkStarred()
  }, [currentUserId, location.id, location.location_type])

  // Handle star toggle
  const handleStarToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!currentUserId) {
      toast.error('Du må være logget inn for å stjernemerke steder')
      return
    }

    setIsStarring(true)

    try {
      let success = false

      if (isStarred) {
        // Unstar
        if (location.location_type === 'language_area') {
          success = await unstarLanguageArea(currentUserId, location.id)
        } else if (location.location_type === 'municipality') {
          success = await unstarMunicipality(currentUserId, location.id)
        } else {
          success = await unstarPlace(currentUserId, location.id)
        }

        if (success) {
          setIsStarred(false)
          toast.success('Stjerne fjernet')
        }
      } else {
        // Star
        if (location.location_type === 'language_area') {
          success = await starLanguageArea(currentUserId, location.id)
        } else if (location.location_type === 'municipality') {
          success = await starMunicipality(currentUserId, location.id)
        } else {
          success = await starPlace(currentUserId, location.id)
        }

        if (success) {
          setIsStarred(true)
          toast.success('Stjernemerket')
        }
      }

      if (!success) {
        toast.error('Kunne ikke oppdatere stjerne')
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      toast.error('Kunne ikke oppdatere stjerne')
    } finally {
      setIsStarring(false)
    }
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-3 hover:bg-gray-50 transition-colors',
      isHighlighted && 'bg-blue-50 ring-2 ring-blue-500'
    )}>
      {/* Location info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {location.name}
            {location.name_sami && location.name_sami !== location.name && (
              <span className="text-gray-500 ml-1">({location.name_sami})</span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {getLocationTypeLabel()}
            {location.parent && ` · ${location.parent}`}
          </p>
        </div>
      </div>

      {/* Star button (only if logged in) */}
      {currentUserId && (
        <button
          onClick={handleStarToggle}
          disabled={isStarring}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            isStarred
              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100',
            isStarring && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Star className={cn('w-5 h-5', isStarred && 'fill-current')} />
        </button>
      )}
    </div>
  )
}
```

## Geografi-stjernemerking

### Utvidelser i geography.ts

```typescript
export async function starLanguageArea(
  userId: string,
  languageAreaId: string
): Promise<boolean> {
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

export async function unstarLanguageArea(
  userId: string,
  languageAreaId: string
): Promise<boolean> {
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
```

## Forhåndspopulerte resultater

Når bruker klikker i søkefeltet uten å skrive, vises 6 siste/mest relevante per kategori:

**Brukere**: 6 nyeste brukere
```typescript
.order('created_at', { ascending: false })
```

**Innlegg**: 6 nyeste innlegg
```typescript
.order('created_at', { ascending: false })
```

**Arrangementer**: 6 kommende arrangementer
```typescript
.gte('event_date', today)
.order('event_date', { ascending: true })
```

**Kommentarer**: 6 nyeste kommentarer
```typescript
.order('created_at', { ascending: false })
```

**Geografi**: Mix av språkområder, kommuner, steder
```typescript
// Hent 2 språkområder, 2 kommuner, 2 steder
```

**Samfunn**: 6 mest fulgte samfunn
```typescript
.order('follower_count', { ascending: false })
```

**Tjenester**: 6 nyeste/fremhevede tjenester
```typescript
.order('is_featured', { ascending: false })
.order('created_at', { ascending: false })
```

**Produkter**: 6 nyeste/fremhevede produkter på lager
```typescript
.eq('in_stock', true)
.order('is_featured', { ascending: false })
.order('created_at', { ascending: false })
```

## Ytelsesoptimalisering

### Database

**Full-text search indekser:**
```sql
CREATE INDEX idx_services_name ON services
  USING gin(to_tsvector('norwegian', name));
CREATE INDEX idx_services_description ON services
  USING gin(to_tsvector('norwegian', description));
```

**Tidsstempel indekser:**
```sql
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

**Foreign key indekser:**
```sql
CREATE INDEX idx_services_community ON services(community_id);
CREATE INDEX idx_products_community ON products(community_id);
```

### Frontend

**Debouncing:**
```typescript
const timer = setTimeout(() => {
  search(query, category)
}, 300)
```

**Memoization:**
```typescript
const ResultItem = React.memo(SearchResultItem)

const flatResults = useMemo(() => {
  return Object.values(results).flatMap(r => r.items)
}, [results])
```

**Parallelle spørringer:**
```typescript
const results = await Promise.allSettled([
  searchUsers(query),
  searchPosts(query),
  // ... alle 8 kategorier
])
```

### Cache

- 5 minutters TTL
- Automatisk cleanup hvert 5. minutt
- Manuell invalidering ved mutations

## Accessibility

**ARIA attributes:**
```typescript
<button
  aria-label={`Søk i ${CATEGORY_NAMES[category]}`}
  aria-pressed={isSelected}
>
```

**Keyboard navigation:**
- ArrowDown / ArrowUp: Naviger resultater
- Enter: Velg resultat
- Escape: Lukk søk
- Tab: Bytt kategori (i kategorifilter)

**Focus management:**
- Auto-focus på input når søk åpnes
- Synlig fokusring: `focus-visible:ring-2 ring-blue-500`
- Skip links for skjermlesere

**Screen reader support:**
```typescript
<div role="search" aria-live="polite">
  {/* Resultater */}
</div>
```

## Feilhåndtering

**Søkefeil:**
```typescript
try {
  const data = await searchUsers(query)
  setResults(data)
} catch (error) {
  console.error('Search error:', error)
  toast.error('Kunne ikke hente søkeresultater', {
    description: 'Prøv igjen om litt.',
    action: {
      label: 'Prøv igjen',
      onClick: () => retry()
    }
  })

  // Fallback til cached data hvis tilgjengelig
  const cached = searchCache.get(cacheKey)
  if (cached) {
    setResults(cached)
    toast.info('Viser tidligere søkeresultater')
  }
}
```

**Loading states:**
```typescript
{loading && <LoadingSkeleton count={6} />}
```

**Empty states:**
```typescript
{results.length === 0 && (
  <EmptyState category={category} />
)}
```

## Testing

### Manuell testing

**Test søk i alle 8 kategorier:**
1. Brukere - søk på navn
2. Innlegg - søk på tittel/innhold
3. Arrangementer - søk på tittel/sted
4. Kommentarer - søk på innhold
5. Geografi - søk på stedsnavn
6. Samfunn - søk på samfunnsnavn
7. Tjenester - søk på tjenestenavn/beskrivelse
8. Produkter - søk på produktnavn/beskrivelse

**Test forhåndspopulerte resultater:**
- Klikk i søkefeltet uten å skrive
- Sjekk at 6 resultater vises per kategori
- Sjekk at arrangementer er kommende (ikke tidligere)
- Sjekk at produkter er på lager

**Test kategorifilter:**
- Desktop: Vertikal sidebar til venstre
- Mobil: Horisontale ikoner som bryter til neste linje
- Sjekk at resultattellere vises
- Sjekk at valgt kategori highlightes

**Test geografi-stjernemerking:**
- Klikk stjerne på et geografisk sted
- Sjekk at toast vises
- Sjekk at stjernen fylles
- Klikk igjen for å fjerne stjerne

**Test tastaturnavigasjon:**
- ArrowDown/Up: Naviger resultater
- Enter: Velg resultat
- Escape: Lukk søk

**Test "Vis flere":**
- Klikk "Vis flere" i en kategori
- Sjekk at 12 flere resultater lastes
- Sjekk at knappen forsvinner hvis ingen flere resultater

## Migrasjon fra gammelt søk

**Før:**
```typescript
<InlineSearchBar
  placeholder="Søk etter innlegg, brukere, arrangementer..."
  className="..."
/>
```

**Etter:**
```typescript
<UnifiedSearchBar />
```

**Filer å oppdatere:**
- `src/components/layout/Header.tsx` (linje 357)

**Filer å slette:**
- `src/components/search/InlineSearchBar.tsx` (gammel søkekomponent)

## Feilsøking

**Ingen resultater vises:**
- Sjekk at database har data
- Sjekk at RLS policies er korrekte
- Sjekk nettverksfanen for feil

**Cache fungerer ikke:**
- Sjekk at TTL ikke er utløpt (5 min)
- Sjekk at cache-nøkler er korrekte
- Kjør `searchCache.clear()` i konsollen

**Geografi-stjernemerking fungerer ikke:**
- Sjekk at bruker er logget inn
- Sjekk at `user_starred_language_areas` tabell eksisterer
- Sjekk RLS policies på stjernemerking-tabeller

**Søk er tregt:**
- Sjekk at database-indekser er opprettet
- Sjekk at caching er aktivert
- Sjekk at parallelle spørringer brukes

## Fremtidige forbedringer

**Forslag:**
- Fuzzy search (typo-toleranse)
- Søkeforslag (autocomplete)
- Infinite scroll i stedet for "Vis flere"
- Søkehistorikk (lagret per bruker)
- Populære søk (trending searches)
- Filtre per kategori (dato, pris, lokasjon)
- Sorteringsalternativer (relevans, nyeste, populært)
- Search analytics (mest søkte termer)
- Voice search
- Image search (for produkter)

## Sikkerhet

**RLS policies:**
- ALLE database-tabeller har RLS aktivert
- SELECT policies: is_active = true
- INSERT/UPDATE/DELETE: Kun community admins

**Input validering:**
- Ingen SQL injection risiko (Supabase håndterer dette)
- XSS-beskyttelse via React (automatisk escaping)

**Rate limiting:**
- Debouncing (300ms) reduserer antall spørringer
- Cache reduserer databasebelastning

## Support

Ved spørsmål eller problemer:
1. Sjekk denne dokumentasjonen
2. Sjekk plan-filen: `/Users/oyvind/.claude/plans/mellow-splashing-noodle.md`
3. Sjekk kildekoden i `src/lib/search/` og `src/components/search/`
4. Spør i prosjektets chat
