'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, MapPin, Building2, Languages, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type GeographyType = 'language_area' | 'municipality' | 'place'

export interface GeographySelection {
  type: GeographyType
  id: string
  name: string
  nameSami?: string | null
}

interface GeographySearchInputProps {
  value: GeographySelection | null
  onChange: (value: GeographySelection | null) => void
  placeholder?: string
  className?: string
}

interface SearchResult {
  type: GeographyType
  id: string
  name: string
  name_sami: string | null
  parent_name?: string
}

export function GeographySearchInput({
  value,
  onChange,
  placeholder = 'Søk etter sted...',
  className
}: GeographySearchInputProps) {
  const supabase = useMemo(() => createClient(), [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search function
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      const searchLower = searchQuery.toLowerCase()

      // Search language areas
      const { data: languageAreas } = await supabase
        .from('language_areas')
        .select('id, name, name_sami')
        .or(`name.ilike.%${searchQuery}%,name_sami.ilike.%${searchQuery}%`)
        .limit(5)

      // Search municipalities
      const { data: municipalities } = await supabase
        .from('municipalities')
        .select('id, name, name_sami, language_areas!municipalities_language_area_id_fkey(name)')
        .or(`name.ilike.%${searchQuery}%,name_sami.ilike.%${searchQuery}%`)
        .limit(10)

      // Search places
      const { data: places } = await supabase
        .from('places')
        .select('id, name, name_sami, municipalities!places_municipality_id_fkey(name)')
        .or(`name.ilike.%${searchQuery}%,name_sami.ilike.%${searchQuery}%`)
        .limit(10)

      const allResults: SearchResult[] = []

      // Add language areas
      if (languageAreas) {
        languageAreas.forEach(la => {
          allResults.push({
            type: 'language_area',
            id: la.id,
            name: la.name,
            name_sami: la.name_sami
          })
        })
      }

      // Add municipalities
      if (municipalities) {
        municipalities.forEach(m => {
          const parent = m.language_areas as unknown as { name: string } | null
          allResults.push({
            type: 'municipality',
            id: m.id,
            name: m.name,
            name_sami: m.name_sami,
            parent_name: parent?.name
          })
        })
      }

      // Add places
      if (places) {
        places.forEach(p => {
          const parent = p.municipalities as unknown as { name: string } | null
          allResults.push({
            type: 'place',
            id: p.id,
            name: p.name,
            name_sami: p.name_sami,
            parent_name: parent?.name
          })
        })
      }

      // Sort by relevance (exact match first, then by name)
      allResults.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchLower || a.name_sami?.toLowerCase() === searchLower
        const bExact = b.name.toLowerCase() === searchLower || b.name_sami?.toLowerCase() === searchLower
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.name.localeCompare(b.name, 'nb')
      })

      setResults(allResults.slice(0, 15))
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) search(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    onChange({
      type: result.type,
      id: result.id,
      name: result.name,
      nameSami: result.name_sami
    })
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setQuery('')
    setResults([])
  }

  const getIcon = (type: GeographyType) => {
    switch (type) {
      case 'language_area': return <MapPin className="w-4 h-4 text-blue-500" />
      case 'municipality': return <MapPin className="w-4 h-4 text-orange-500" />
      case 'place': return <MapPin className="w-4 h-4 text-purple-500" />
    }
  }

  const getTypeLabel = (type: GeographyType) => {
    switch (type) {
      case 'language_area': return 'Språkområde'
      case 'municipality': return 'Kommune'
      case 'place': return 'Sted'
    }
  }

  // If a value is selected, show it as a tag
  if (value) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
          {getIcon(value.type)}
          <span className="font-medium">{value.name}</span>
          {value.nameSami && value.nameSami !== value.name && (
            <span className="text-gray-500">({value.nameSami})</span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-8 h-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Ingen treff for &quot;{query}&quot;
            </div>
          ) : (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
              >
                {getIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{result.name}</span>
                    {result.name_sami && result.name_sami !== result.name && (
                      <span className="text-gray-500 text-sm truncate">({result.name_sami})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>{getTypeLabel(result.type)}</span>
                    {result.parent_name && (
                      <>
                        <span>·</span>
                        <span>{result.parent_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
