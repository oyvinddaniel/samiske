'use client'

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
}

export function SearchCategoryFilter({
  selected,
  onSelect,
  results,
}: SearchCategoryFilterProps) {
  // All categories including 'alle'
  const allCategories: SearchCategory[] = ['alle', ...SEARCHABLE_CATEGORIES]

  // Calculate result counts
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

      {/* Mobile: Compact horizontal icons with title */}
      <div className="md:hidden border-b border-gray-200">
        {/* Selected category title */}
        <div className="px-4 py-2 text-sm text-gray-600">
          Søk i: <span className="font-semibold text-blue-600">{CATEGORY_NAMES[selected]}</span>
        </div>

        {/* Horizontal icon buttons */}
        <div className="flex flex-wrap gap-1.5 px-3 pt-1 pb-2">
          {allCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category]
            const count = getCategoryCount(category)
            const isSelected = selected === category

            return (
              <button
                key={category}
                onClick={() => onSelect(category)}
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
    </>
  )
}
