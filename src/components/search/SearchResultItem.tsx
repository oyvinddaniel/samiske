'use client'

import { useState } from 'react'
import {
  User,
  FileText,
  Calendar,
  MessageCircle,
  Building2,
  Briefcase,
  ShoppingBag,
  UserPlus,
  UserCheck,
  Clock,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from './searchTypes'
import { GeographySearchResult } from './GeographySearchResult'

interface SearchResultItemProps {
  result: SearchResult
  isHighlighted: boolean
  onClick: () => void
}

// Helper to truncate text
const truncate = (text: string | null, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

// Helper to get user initials
const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function SearchResultItem({
  result,
  isHighlighted,
  onClick,
}: SearchResultItemProps) {
  // Special handling for users - navigate to profile
  if (result.type === 'brukere') {
    return (
      <button
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('open-user-profile-panel', {
              detail: { userId: result.id }
            })
          );
        }}
        className={cn(
          'w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left',
          isHighlighted && 'bg-blue-50 ring-2 ring-blue-500'
        )}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {result.avatar_url ? (
            <img
              src={result.avatar_url}
              alt={result.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {getInitials(result.full_name)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {result.full_name}
          </p>
          <p className="text-xs text-gray-500">Bruker</p>
        </div>

        {/* Icon */}
        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
    )
  }

  // Special handling for geography - has starring functionality
  if (result.type === 'geografi') {
    return <GeographySearchResult location={result} isHighlighted={isHighlighted} />
  }

  // Generic result item for all other types
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left',
        isHighlighted && 'bg-blue-50 ring-2 ring-blue-500'
      )}
    >
      {/* Icon Badge */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          result.type === 'innlegg' && 'bg-blue-100',
          result.type === 'arrangementer' && 'bg-red-100',
          result.type === 'kommentarer' && 'bg-purple-100',
          result.type === 'samfunn' && 'bg-green-100',
          result.type === 'tjenester' && 'bg-orange-100',
          result.type === 'produkter' && 'bg-pink-100'
        )}
      >
        {result.type === 'innlegg' && (
          <FileText className="w-4 h-4 text-blue-600" />
        )}
        {result.type === 'arrangementer' && (
          <Calendar className="w-4 h-4 text-red-600" />
        )}
        {result.type === 'kommentarer' && (
          <MessageCircle className="w-4 h-4 text-purple-600" />
        )}
        {result.type === 'samfunn' && (
          <Building2 className="w-4 h-4 text-green-600" />
        )}
        {result.type === 'tjenester' && (
          <Briefcase className="w-4 h-4 text-orange-600" />
        )}
        {result.type === 'produkter' && (
          <ShoppingBag className="w-4 h-4 text-pink-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Post/Event */}
        {(result.type === 'innlegg' || result.type === 'arrangementer') && (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">
              {result.title || 'Uten tittel'}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
              {truncate(result.content, 80)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {result.category && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: result.category.color + '20',
                    color: result.category.color,
                  }}
                >
                  {result.category.name}
                </span>
              )}
              {result.type === 'arrangementer' && result.event_date && (
                <span className="text-xs text-gray-500">
                  {new Date(result.event_date).toLocaleDateString('nb-NO')}
                </span>
              )}
            </div>
          </>
        )}

        {/* Comment */}
        {result.type === 'kommentarer' && (
          <>
            <p className="text-sm text-gray-900 line-clamp-2">
              {truncate(result.content, 60)}
            </p>
            {result.post?.title && (
              <p className="text-xs text-gray-500 mt-1">
                I innlegget: {truncate(result.post.title, 40)}
              </p>
            )}
          </>
        )}

        {/* Community */}
        {result.type === 'samfunn' && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {result.name}
              </p>
              {result.is_verified && (
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {result.follower_count} følgere
            </p>
          </>
        )}

        {/* Service */}
        {result.type === 'tjenester' && (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">
              {result.name}
            </p>
            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
              {truncate(result.description, 60)}
            </p>
            {result.community && (
              <p className="text-xs text-gray-500 mt-1">
                {result.community.name}
              </p>
            )}
          </>
        )}

        {/* Product */}
        {result.type === 'produkter' && (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">
              {result.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {result.price && (
                <span className="text-xs font-medium text-gray-900">
                  {result.price} {result.currency}
                </span>
              )}
              {!result.in_stock && (
                <span className="text-xs text-red-600">Utsolgt</span>
              )}
            </div>
            {result.community && (
              <p className="text-xs text-gray-500 mt-1">
                {result.community.name}
              </p>
            )}
          </>
        )}
      </div>
    </button>
  )
}
