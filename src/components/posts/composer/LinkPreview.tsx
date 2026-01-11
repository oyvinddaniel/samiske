'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Globe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
}

interface LinkPreviewProps {
  url: string
  onRemove?: () => void
  className?: string
  compact?: boolean
}

// Cache for previews to avoid refetching
const previewCache = new Map<string, LinkPreviewData>()

export function LinkPreview({
  url,
  onRemove,
  className,
  compact = false,
}: LinkPreviewProps) {
  const [data, setData] = useState<LinkPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreview = async () => {
      // Check cache first
      if (previewCache.has(url)) {
        setData(previewCache.get(url)!)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Failed to fetch preview')
        }

        const previewData = await response.json()
        previewCache.set(url, previewData)
        setData(previewData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [url])

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-3 bg-gray-50 rounded-lg', className)}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Laster forhåndsvisning...</span>
      </div>
    )
  }

  if (error || !data) {
    return null // Silent fail - don't show error for link previews
  }

  const hostname = (() => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  })()

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group',
          className
        )}
      >
        {data.favicon ? (
          <img
            src={data.favicon}
            alt=""
            className="w-4 h-4 rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <Globe className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-sm text-gray-600 truncate flex-1">
          {data.title || hostname}
        </span>
        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    )
  }

  return (
    <div className={cn('relative border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-gray-50 transition-colors"
      >
        {/* Image */}
        {data.image && (
          <div className="relative w-full h-40 bg-gray-100">
            <img
              src={data.image}
              alt={data.title || ''}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          {/* Site info */}
          <div className="flex items-center gap-2 mb-1">
            {data.favicon ? (
              <img
                src={data.favicon}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <Globe className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {data.siteName || hostname}
            </span>
          </div>

          {/* Title */}
          {data.title && (
            <h4 className="font-medium text-gray-900 line-clamp-2 leading-snug">
              {data.title}
            </h4>
          )}

          {/* Description */}
          {data.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {data.description}
            </p>
          )}
        </div>
      </a>
    </div>
  )
}

// Hook to detect URLs in text and manage preview state
export function useLinkPreview(content: string) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // URL detection regex
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

  // Detect first URL in content
  useEffect(() => {
    const matches = content.match(urlRegex)

    if (!matches || matches.length === 0) {
      setPreviewUrl(null)
      return
    }

    // Find first URL that hasn't been dismissed
    const firstValidUrl = matches.find((url) => !dismissed.has(url))
    setPreviewUrl(firstValidUrl || null)
  }, [content, dismissed])

  const dismissPreview = useCallback(() => {
    if (previewUrl) {
      setDismissed((prev) => new Set([...prev, previewUrl]))
    }
  }, [previewUrl])

  const clearDismissed = useCallback(() => {
    setDismissed(new Set())
  }, [])

  return {
    previewUrl,
    dismissPreview,
    clearDismissed,
  }
}

// Standalone component for showing preview in post cards
export function PostLinkPreview({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  // Extract first URL from content
  const urlMatch = content.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i)

  if (!urlMatch) {
    return null
  }

  return <LinkPreview url={urlMatch[0]} className={className} />
}
