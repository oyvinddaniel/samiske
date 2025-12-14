'use client'

import { useEffect } from 'react'
import { Globe, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedFilterType = 'sapmi' | 'mine' | 'venner'

interface FeedFiltersProps {
  currentFilter: FeedFilterType
  onFilterChange: (filter: FeedFilterType) => void
  isLoggedIn: boolean
}

const filters: { id: FeedFilterType; label: string; icon: React.ReactNode; requiresAuth: boolean }[] = [
  {
    id: 'sapmi',
    label: 'Sapmi',
    icon: <Globe className="w-4 h-4" />,
    requiresAuth: false
  },
  {
    id: 'mine',
    label: 'Mine steder',
    icon: <Star className="w-4 h-4" />,
    requiresAuth: true
  },
  {
    id: 'venner',
    label: 'Venner',
    icon: <Users className="w-4 h-4" />,
    requiresAuth: true
  },
]

export function FeedFilters({ currentFilter, onFilterChange, isLoggedIn }: FeedFiltersProps) {
  // Load saved filter preference from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('feedFilter') as FeedFilterType | null
    if (savedFilter && (savedFilter === 'sapmi' || (isLoggedIn && ['mine', 'venner'].includes(savedFilter)))) {
      onFilterChange(savedFilter)
    }
  }, [isLoggedIn, onFilterChange])

  const handleFilterChange = (filter: FeedFilterType) => {
    onFilterChange(filter)
    localStorage.setItem('feedFilter', filter)
  }

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map((filter) => {
        // Skip auth-required filters for non-logged in users
        if (filter.requiresAuth && !isLoggedIn) return null

        const isActive = currentFilter === filter.id

        return (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            )}
          >
            <span className={cn(
              'transition-colors',
              isActive ? 'text-white' : 'text-gray-400'
            )}>
              {filter.icon}
            </span>
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
