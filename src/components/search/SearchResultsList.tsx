'use client'

import { forwardRef, useEffect, useRef } from 'react'
import { Loader2, Search as SearchIcon } from 'lucide-react'
import type { SearchCategory } from '@/lib/search/searchConstants'
import { CATEGORY_NAMES, SEARCHABLE_CATEGORIES, SEARCH_CONFIG } from '@/lib/search/searchConstants'
import type { AllCategoryResults, SearchResult } from './searchTypes'
import { SearchResultItem } from './SearchResultItem'

interface SearchResultsListProps {
  results: AllCategoryResults
  category: SearchCategory
  query: string
  highlightedIndex: number
  onLoadMore: (category: Exclude<SearchCategory, 'alle'>) => void
  onRetry: (category: Exclude<SearchCategory, 'alle'>) => void
  onSelectResult: (result: SearchResult) => void
}

export const SearchResultsList = forwardRef<HTMLDivElement, SearchResultsListProps>(function SearchResultsList({
  results,
  category,
  query,
  highlightedIndex,
  onLoadMore,
  onRetry,
  onSelectResult,
}, ref) {
  const loadingRef = useRef<Set<string>>(new Set())

  // Determine which categories to show
  const categoriesToShow =
    category === 'alle' ? SEARCHABLE_CATEGORIES : [category]

  // Infinite scroll for individual categories (not "alle")
  useEffect(() => {
    if (category === 'alle') return // Manual loading for "alle"
    if (!ref || typeof ref === 'function') return

    const container = ref.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight

      // Calculate how far from bottom
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight

      // If within threshold and has more to load
      categoriesToShow.forEach((cat) => {
        const categoryResults = results[cat]
        const hasResults = categoryResults.items.length > 0
        const loadingKey = `${cat}-${categoryResults.items.length}`

        // Auto-load when:
        // 1. User has scrolled (scrollTop > 50)
        // 2. Near bottom (within 200px)
        // 3. Has more results
        // 4. Not currently loading
        // 5. Not already loaded this batch
        if (
          scrollTop > 50 &&
          scrolledToBottom < 200 &&
          hasResults &&
          categoryResults.hasMore &&
          !categoryResults.loading &&
          !loadingRef.current.has(loadingKey)
        ) {
          loadingRef.current.add(loadingKey)
          onLoadMore(cat)

          // Clear the loading flag after a delay
          setTimeout(() => {
            loadingRef.current.delete(loadingKey)
          }, 1000)
        }
      })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [category, categoriesToShow, results, onLoadMore, ref])

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto max-h-[70vh] pb-[50vh]"
      role="region"
      aria-label="Søkeresultater"
      aria-live="polite"
    >
      {categoriesToShow.map((cat) => {
        const categoryResults = results[cat]
        const hasResults = categoryResults.items.length > 0

        return (
          <div key={cat} className="mb-6 last:mb-0">
            {/* Category Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-2 sm:px-4 py-1.5 sm:py-2 z-10">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                {CATEGORY_NAMES[cat]}
                {hasResults && (
                  <span className="ml-2 text-gray-400">
                    ({categoryResults.items.length})
                  </span>
                )}
              </h3>
            </div>

            {/* Loading State */}
            {categoryResults.loading && !hasResults && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-3 text-sm text-gray-600">Søker...</span>
              </div>
            )}

            {/* Error State */}
            {categoryResults.error && !hasResults && (
              <div className="px-2 sm:px-4 py-6 sm:py-8 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 mb-2 sm:mb-3">
                  <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-red-800 mb-1">
                  Kunne ikke laste {CATEGORY_NAMES[cat].toLowerCase()}
                </p>
                <p className="text-[10px] sm:text-xs text-red-600 mb-2 sm:mb-3">
                  {categoryResults.error.message}
                </p>
                <button
                  onClick={() => onRetry(cat)}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 underline font-medium"
                >
                  Prøv igjen
                </button>
              </div>
            )}

            {/* Empty State */}
            {!categoryResults.loading &&
              !categoryResults.error &&
              !hasResults && (
                <div className="px-2 sm:px-4 py-8 sm:py-12 text-center">
                  <SearchIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Ingen {CATEGORY_NAMES[cat].toLowerCase()} funnet
                  </p>
                  {query && (
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      Prøv et annet søkeord
                    </p>
                  )}
                </div>
              )}

            {/* Results */}
            {hasResults && (
              <div className="divide-y divide-gray-100">
                {categoryResults.items.map((result, index) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    isHighlighted={
                      category === cat &&
                      index === highlightedIndex
                    }
                    onClick={() => onSelectResult(result)}
                  />
                ))}
              </div>
            )}

            {/* Load More Button - only for "alle" category */}
            {category === 'alle' && hasResults && categoryResults.hasMore && (
              <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-100">
                <button
                  onClick={() => onLoadMore(cat)}
                  disabled={categoryResults.loading}
                  className="w-full py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryResults.loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      Laster...
                    </span>
                  ) : (
                    'Vis flere'
                  )}
                </button>
              </div>
            )}

            {/* Loading indicator for infinite scroll (individual categories) */}
            {category !== 'alle' && categoryResults.loading && hasResults && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Laster flere...</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
)
