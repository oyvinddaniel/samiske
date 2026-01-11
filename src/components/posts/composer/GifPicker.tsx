'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GifData {
  id: string
  title: string
  preview: string
  url: string
  fullUrl: string
  width: number
  height: number
}

interface GifPickerProps {
  onSelect: (gif: GifData) => void
  onClose: () => void
  className?: string
}

export function GifPicker({ onSelect, onClose, className }: GifPickerProps) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState<GifData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextPos, setNextPos] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch GIFs
  const fetchGifs = useCallback(async (searchQuery: string, position?: string) => {
    if (position) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setGifs([])
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        type: searchQuery ? 'search' : 'featured',
        limit: '24',
      })

      if (searchQuery) {
        params.set('q', searchQuery)
      }

      if (position) {
        params.set('pos', position)
      }

      const response = await fetch(`/api/gif?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Kunne ikke hente GIF-er')
      }

      const data = await response.json()

      if (position) {
        setGifs((prev) => [...prev, ...data.gifs])
      } else {
        setGifs(data.gifs)
      }

      setNextPos(data.next || null)
    } catch (err) {
      console.error('GIF fetch error:', err)
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial load - featured GIFs
  useEffect(() => {
    fetchGifs('')
  }, [fetchGifs])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchGifs(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, fetchGifs])

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !nextPos || loadingMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchGifs(query, nextPos)
    }
  }, [nextPos, loadingMore, query, fetchGifs])

  const handleSelect = (gif: GifData) => {
    onSelect(gif)
  }

  return (
    <div className={cn('flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-sm">Velg GIF</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sok etter GIF-er..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* GIF grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 max-h-[400px] min-h-[200px]"
      >
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGifs(query)}
            >
              Prov igjen
            </Button>
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              {query ? 'Ingen GIF-er funnet' : 'Kunne ikke laste GIF-er'}
            </p>
          </div>
        )}

        {!loading && !error && gifs.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => handleSelect(gif)}
                  className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Tenor attribution */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <a
          href="https://tenor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <span>Drevet av</span>
          <img
            src="https://tenor.com/assets/img/tenor-logo-light.svg"
            alt="Tenor"
            className="h-3"
          />
        </a>
      </div>
    </div>
  )
}

// Inline trigger button
interface GifButtonProps {
  onClick: () => void
  className?: string
}

export function GifButton({ onClick, className }: GifButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors',
        className
      )}
    >
      <span className="text-base">GIF</span>
    </button>
  )
}
