'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  User,
  FileText,
  Calendar,
  MessageCircle,
  MapPin,
  Building2,
  Briefcase,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchCategory } from '@/lib/search/searchConstants'
import { CATEGORY_NAMES, SEARCHABLE_CATEGORIES } from '@/lib/search/searchConstants'
import type { AllCategoryResults } from './searchTypes'

// Category icons mapping
const CATEGORY_ICONS: Record<SearchCategory, React.ElementType> = {
  alle: Globe,
  brukere: User,
  innlegg: FileText,
  arrangementer: Calendar,
  kommentarer: MessageCircle,
  geografi: MapPin,
  samfunn: Building2,
  tjenester: Briefcase,
  produkter: ShoppingBag,
}

interface SearchCategoryFilterProps {
  selected: SearchCategory
  onSelect: (category: SearchCategory) => void
  results: AllCategoryResults
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

export function SearchCategoryFilter({
  selected,
  onSelect,
  results,
  scrollContainerRef,
}: SearchCategoryFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // All categories including 'alle'
  const allCategories: SearchCategory[] = ['alle', ...SEARCHABLE_CATEGORIES]

  // Calculate result counts
  const getCategoryCount = (category: SearchCategory) => {
    if (category === 'alle') {
      return Object.values(results).reduce((sum, r) => sum + r.items.length, 0)
    }
    return results[category].items.length
  }

  // Scroll detection
  useEffect(() => {
    const container = scrollContainerRef?.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      // Collapse when scrolled more than 50px
      if (scrollTop > 50 && !isCollapsed) {
        setIsCollapsed(true)
        setIsExpanded(false)
      }
      // Expand when scrolled near top (within 10px)
      else if (scrollTop < 10 && isCollapsed) {
        setIsCollapsed(false)
        setIsExpanded(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef, isCollapsed])

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
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
              aria-label={`Søk i ${CATEGORY_NAMES[category]}`}
              aria-pressed={isSelected}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{CATEGORY_NAMES[category]}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Mobile: Animated collapsible filter */}
      <div className="md:hidden">
        {/* Collapsed compact tab (sticky within search) */}
        {isCollapsed && !isExpanded && (
          <div
            className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm cursor-pointer"
            onClick={toggleExpanded}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = CATEGORY_ICONS[selected]
                  return <Icon className="w-4 h-4 text-blue-600" />
                })()}
                <span className="text-sm font-semibold text-gray-900">
                  {CATEGORY_NAMES[selected]}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Expanded full filter */}
        <div
          className={cn(
            'border-b border-gray-200 transition-all duration-300',
            isCollapsed && isExpanded ? 'sticky top-0 z-10 bg-white shadow-sm' : '',
            isCollapsed && !isExpanded ? 'hidden' : ''
          )}
        >
          {/* Horizontal icon buttons */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2">
            {allCategories.map((category) => {
              const Icon = CATEGORY_ICONS[category]
              const count = getCategoryCount(category)
              const isSelected = selected === category

              return (
                <button
                  key={category}
                  onClick={() => {
                    onSelect(category)
                    if (isExpanded) setIsExpanded(false)
                  }}
                  className={cn(
                    'relative flex-shrink-0 p-2 rounded-lg transition-colors',
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                  aria-label={`Søk i ${CATEGORY_NAMES[category]}`}
                  aria-pressed={isSelected}
                  title={CATEGORY_NAMES[category]}
                >
                  <Icon className="w-4 h-4" />
                  {count > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-red-500 text-white'
                      )}
                    >
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
