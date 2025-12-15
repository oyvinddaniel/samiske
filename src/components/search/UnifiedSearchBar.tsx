'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from './useSearch'
import { useKeyboardNav } from './useKeyboardNav'
import type { SearchCategory } from '@/lib/search/searchConstants'
import { SEARCH_CONFIG } from '@/lib/search/searchConstants'
import { SearchCategoryFilter } from './SearchCategoryFilter'
import { SearchResultsList } from './SearchResultsList'
import type { SearchResult } from './searchTypes'

export function UnifiedSearchBar() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('brukere')
  const [showResults, setShowResults] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { results, search, loadMore, retry, clearResults } = useSearch()

  // Get flat list of all results for keyboard navigation
  const flatResults = useMemo(() => {
    if (selectedCategory === 'alle') {
      return Object.values(results).flatMap((r) => r.items)
    }
    return results[selectedCategory].items
  }, [results, selectedCategory])

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    // Navigate to result based on type
    switch (result.type) {
      case 'brukere':
        // Will be handled by ProfileOverlay in the result component
        break
      case 'innlegg':
      case 'arrangementer':
        window.location.href = `/#post-${result.id}`
        break
      case 'kommentarer':
        if (result.post?.id) {
          window.location.href = `/#post-${result.post.id}`
        }
        break
      case 'geografi':
        // Navigate to geography page
        if (result.location_type === 'municipality' && result.slug && result.country_code) {
          window.location.href = `/sapmi/${result.country_code}/${result.slug}`
        } else if (result.location_type === 'place' && result.slug && result.parent) {
          // Need municipality slug from parent
          window.location.href = `/#geography-${result.id}`
        }
        break
      case 'samfunn':
        window.location.href = `/samfunn/${result.slug}`
        break
      case 'tjenester':
        if (result.community?.slug) {
          window.location.href = `/samfunn/${result.community.slug}/tjenester/${result.slug}`
        }
        break
      case 'produkter':
        if (result.community?.slug) {
          window.location.href = `/samfunn/${result.community.slug}/produkter/${result.slug}`
        }
        break
    }

    setShowResults(false)
    setQuery('')
  }

  // Keyboard navigation
  const { highlightedIndex } = useKeyboardNav({
    results: flatResults,
    onSelect: handleSelectResult,
    onClose: () => setShowResults(false),
    enabled: showResults,
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, SEARCH_CONFIG.DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [query])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH && showResults) {
      search(debouncedQuery, selectedCategory)
    }
  }, [debouncedQuery, selectedCategory, showResults, search])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle focus - load recent items if no query
  const handleFocus = () => {
    setShowResults(true)

    // If no query, load recent items for selected category
    if (!query) {
      search('', selectedCategory)
    }
  }

  // Handle clear
  const handleClear = () => {
    setQuery('')
    setDebouncedQuery('')
    clearResults()
    inputRef.current?.focus()
  }

  // Handle category change
  const handleCategoryChange = (category: SearchCategory) => {
    setSelectedCategory(category)

    // Re-search with new category if query exists
    if (debouncedQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      search(debouncedQuery, category)
    } else {
      // Load recent items for new category
      search('', category)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Søk..."
          className={cn(
            'w-full pl-9 pr-9 py-2 sm:pl-10 sm:pr-10 sm:py-2.5 rounded-lg border border-gray-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base',
            'transition-shadow'
          )}
          role="search"
          aria-label="Søk"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Tøm søkefelt"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="flex flex-col md:flex-row">
            {/* Category Filter */}
            <SearchCategoryFilter
              selected={selectedCategory}
              onSelect={handleCategoryChange}
              results={results}
              scrollContainerRef={scrollContainerRef}
            />

            {/* Results List */}
            <SearchResultsList
              ref={scrollContainerRef}
              results={results}
              category={selectedCategory}
              query={debouncedQuery}
              highlightedIndex={highlightedIndex}
              onLoadMore={(cat) => loadMore(cat, debouncedQuery)}
              onRetry={(cat) => retry(cat, debouncedQuery)}
              onSelectResult={handleSelectResult}
            />
          </div>
        </div>
      )}
    </div>
  )
}
