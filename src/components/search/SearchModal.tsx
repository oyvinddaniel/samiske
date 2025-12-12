'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, X, FileText, User, Calendar, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'post' | 'user' | 'event' | 'comment'
  id: string
  title: string
  subtitle?: string
  image?: string | null
  link: string
  date?: string
  categoryColor?: string
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLButtonElement | null>
}

export function SearchModal({ open, onClose, anchorRef }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position based on anchor
  useEffect(() => {
    if (open && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [open, anchorRef])

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  // Search function with debounce
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const searchResults: SearchResult[] = []
    const searchTerm = `%${searchQuery}%`

    // Search posts
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        type,
        event_date,
        created_at,
        category:categories (name, color)
      `)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (posts) {
      posts.forEach(post => {
        const categoryData = Array.isArray(post.category) ? post.category[0] : post.category
        searchResults.push({
          type: post.type === 'event' ? 'event' : 'post',
          id: post.id,
          title: post.title,
          subtitle: post.content.substring(0, 80) + (post.content.length > 80 ? '...' : ''),
          link: `/#post-${post.id}`,
          date: post.created_at,
          categoryColor: categoryData?.color,
        })
      })
    }

    // Search users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', searchTerm)
      .limit(5)

    if (users) {
      users.forEach(user => {
        searchResults.push({
          type: 'user',
          id: user.id,
          title: user.full_name || 'Ukjent',
          image: user.avatar_url,
          link: '#',
        })
      })
    }

    // Search comments
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        post:posts!comments_post_id_fkey (id, title)
      `)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(3)

    if (comments) {
      comments.forEach(comment => {
        const postData = Array.isArray(comment.post) ? comment.post[0] : comment.post
        searchResults.push({
          type: 'comment',
          id: comment.id,
          title: comment.content.substring(0, 60) + (comment.content.length > 60 ? '...' : ''),
          subtitle: `I innlegget: ${postData?.title || 'Ukjent'}`,
          link: `/#post-${postData?.id}`,
          date: comment.created_at,
        })
      })
    }

    setResults(searchResults)
    setLoading(false)
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'event':
        return <Calendar className="w-4 h-4 text-red-500" />
      case 'user':
        return <User className="w-4 h-4 text-green-500" />
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-purple-500" />
    }
  }

  const handleResultClick = () => {
    onClose()
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        'fixed z-[10000] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden',
        'w-[90vw] sm:w-96 max-h-[70vh]',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={{
        top: position.top,
        right: Math.max(16, position.right)
      }}
    >
      {/* Search input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Søk etter innlegg, brukere..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-0 h-8"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Søker...</p>
          </div>
        ) : query.length < 2 ? (
          <div className="p-4 text-center text-gray-500">
            <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Skriv minst 2 tegn</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Ingen resultater</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.link}
                onClick={handleResultClick}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {result.type === 'user' && result.image ? (
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={result.image} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getInitials(result.title)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      {getIcon(result.type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {result.title}
                    </p>
                    {result.categoryColor && (
                      <Badge
                        style={{ backgroundColor: result.categoryColor }}
                        className="text-white text-[9px] px-1 py-0"
                      >
                        {result.type === 'event' ? 'Arr.' : 'Innlegg'}
                      </Badge>
                    )}
                  </div>
                  {result.subtitle && (
                    <p className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-gray-50 text-[10px] text-gray-400 text-center border-t border-gray-100">
        ESC for å lukke • ⌘K for å åpne
      </div>
    </div>,
    document.body
  )
}
