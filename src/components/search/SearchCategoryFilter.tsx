'use client'

import {
  Grid3x3,
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
  alle: Grid3x3,
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
              aria-label={`Søk i ${CATEGORY_NAMES[category]}`}
              aria-pressed={isSelected}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium whitespace-nowrap">
                {CATEGORY_NAMES[category]}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-bold',
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
    </>
  )
}
