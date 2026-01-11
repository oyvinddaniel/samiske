// Main search hook with caching and state management

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { SearchCategory } from '@/lib/search/searchConstants'
import { CATEGORY_NAMES, SEARCHABLE_CATEGORIES } from '@/lib/search/searchConstants'
import type { AllCategoryResults, SearchResult } from './searchTypes'
import { searchCache, getCacheKey } from '@/lib/search/searchCache'
import {
  searchUsers,
  searchPosts,
  searchEvents,
  searchComments,
  searchGeography,
  searchCommunities,
  searchServices,
  searchProducts,
} from '@/lib/search/searchQueries'

// Search function map
const searchFunctions = {
  brukere: searchUsers,
  innlegg: searchPosts,
  arrangementer: searchEvents,
  kommentarer: searchComments,
  geografi: searchGeography,
  samfunn: searchCommunities,
  tjenester: searchServices,
  produkter: searchProducts,
}

// Initial state for all categories
const initialCategoryState = {
  items: [],
  loading: false,
  error: null,
  hasMore: false,
  total: 0,
}

// Samfunn-funksjonalitet midlertidig skjult før offentlig lansering
const initialState: AllCategoryResults = {
  brukere: { ...initialCategoryState },
  innlegg: { ...initialCategoryState },
  arrangementer: { ...initialCategoryState },
  kommentarer: { ...initialCategoryState },
  geografi: { ...initialCategoryState },
  // samfunn: { ...initialCategoryState },
  // tjenester: { ...initialCategoryState },
  // produkter: { ...initialCategoryState },
}

export function useSearch() {
  const [results, setResults] = useState<AllCategoryResults>(initialState)

  /**
   * Search a single category
   */
  const searchCategory = useCallback(
    async (
      category: Exclude<SearchCategory, 'alle'>,
      query: string,
      limit: number = 6,
      offset: number = 0
    ) => {
      const cacheKey = getCacheKey.search(category, query, offset)

      // Check cache first
      const cached = searchCache.get<SearchResult[]>(cacheKey)
      if (cached) {
        setResults((prev) => ({
          ...prev,
          [category]: {
            items: offset === 0 ? cached : [...prev[category].items, ...cached],
            loading: false,
            error: null,
            hasMore: cached.length === limit,
            total: offset === 0 ? cached.length : prev[category].total + cached.length,
          },
        }))
        return
      }

      // Set loading state
      setResults((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          loading: true,
          error: null,
        },
      }))

      try {
        const searchFn = searchFunctions[category]
        const data = await searchFn(query, limit, offset)

        // Cache the results
        searchCache.set(cacheKey, data)

        // Update state
        setResults((prev) => ({
          ...prev,
          [category]: {
            items: offset === 0 ? data : [...prev[category].items, ...data],
            loading: false,
            error: null,
            hasMore: data.length === limit,
            total: offset === 0 ? data.length : prev[category].total + data.length,
          },
        }))
      } catch (error) {
        console.error(`Search error for ${category}:`, error)

        // Show error toast
        toast.error(`Kunne ikke søke i ${CATEGORY_NAMES[category]}`, {
          description: 'Prøv igjen om litt.',
        })

        // Update state with error
        setResults((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            loading: false,
            error: error as Error,
          },
        }))
      }
    },
    []
  )

  /**
   * Search all categories at once
   */
  const searchAll = useCallback(async (query: string, limit: number = 6) => {
    // Set all categories to loading
    setResults((prev) => {
      const newState = { ...prev }
      SEARCHABLE_CATEGORIES.forEach((cat) => {
        newState[cat] = { ...newState[cat], loading: true, error: null }
      })
      return newState
    })

    // Search all categories in parallel
    const promises = SEARCHABLE_CATEGORIES.map(async (category) => {
      const cacheKey = getCacheKey.search(category, query, 0)

      // Check cache
      const cached = searchCache.get<SearchResult[]>(cacheKey)
      if (cached) {
        return { category, data: cached, error: null }
      }

      try {
        const searchFn = searchFunctions[category]
        const data = await searchFn(query, limit, 0)
        searchCache.set(cacheKey, data)
        return { category, data, error: null }
      } catch (error) {
        console.error(`Search error for ${category}:`, error)
        return { category, data: [], error: error as Error }
      }
    })

    const allResults = await Promise.all(promises)

    // Update all results
    setResults((prev) => {
      const newState = { ...prev }
      allResults.forEach(({ category, data, error }) => {
        newState[category] = {
          items: data,
          loading: false,
          error,
          hasMore: data.length === limit,
          total: data.length,
        }
      })
      return newState
    })
  }, [])

  /**
   * Main search function (dispatches to single or all)
   */
  const search = useCallback(
    async (query: string, category: SearchCategory, limit: number = 6) => {
      if (category === 'alle') {
        await searchAll(query, limit)
      } else {
        await searchCategory(category, query, limit, 0)
      }
    },
    [searchAll, searchCategory]
  )

  /**
   * Load more results for a category
   */
  const loadMore = useCallback(
    async (category: Exclude<SearchCategory, 'alle'>, query: string) => {
      const currentCount = results[category].items.length
      await searchCategory(category, query, 12, currentCount)
    },
    [results, searchCategory]
  )

  /**
   * Retry failed search
   */
  const retry = useCallback(
    async (category: Exclude<SearchCategory, 'alle'>, query: string) => {
      await searchCategory(category, query, 6, 0)
    },
    [searchCategory]
  )

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setResults(initialState)
  }, [])

  /**
   * Clear results for a specific category
   */
  const clearCategory = useCallback(
    (category: Exclude<SearchCategory, 'alle'>) => {
      setResults((prev) => ({
        ...prev,
        [category]: { ...initialCategoryState },
      }))
    },
    []
  )

  return {
    results,
    search,
    loadMore,
    retry,
    clearResults,
    clearCategory,
  }
}
