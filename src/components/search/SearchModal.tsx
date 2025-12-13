'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, X, FileText, User, Calendar, MessageCircle, UserPlus, Undo2, UserCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

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

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'

interface FriendshipMap {
  [userId: string]: FriendshipStatus
}

export function SearchModal({ open, onClose, anchorRef }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friendships, setFriendships] = useState<FriendshipMap>({})
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch current user and friendships
  const fetchFriendships = useCallback(async (userId: string) => {
    const { data: friendshipData } = await supabase
      .from('friendships')
      .select('user_id, friend_id, status')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (friendshipData) {
      const map: FriendshipMap = {}
      friendshipData.forEach(f => {
        const otherUserId = f.user_id === userId ? f.friend_id : f.user_id
        if (f.status === 'accepted') {
          map[otherUserId] = 'accepted'
        } else if (f.status === 'pending') {
          map[otherUserId] = f.user_id === userId ? 'pending_sent' : 'pending_received'
        } else if (f.status === 'blocked') {
          map[otherUserId] = 'blocked'
        }
      })
      setFriendships(map)
    }
  }, [supabase])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        fetchFriendships(user.id)
      }
    }
    fetchCurrentUser()
  }, [supabase, fetchFriendships])

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

  // Fetch all profiles when modal opens
  const fetchAllProfiles = useCallback(async () => {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .order('created_at', { ascending: false })

    if (users) {
      const profileResults: SearchResult[] = users.map(user => ({
        type: 'user' as const,
        id: user.id,
        title: user.full_name || 'Ukjent',
        image: user.avatar_url,
        link: '#',
      }))
      setResults(profileResults)
    }
  }, [supabase])

  // Focus input and load profiles when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      fetchAllProfiles()
    }
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open, fetchAllProfiles])

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
      // Show all profiles when no search query
      fetchAllProfiles()
      return
    }

    setLoading(true)
    const searchResults: SearchResult[] = []
    const searchTerm = `%${searchQuery}%`

    // Search users FIRST
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
  }, [supabase, fetchAllProfiles])

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

  const sendFriendRequest = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUserId) return

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: currentUserId,
        friend_id: friendId,
        status: 'pending'
      })

    if (!error) {
      setPendingRequests(prev => new Set(prev).add(friendId))
      setFriendships(prev => ({ ...prev, [friendId]: 'pending_sent' }))
    }
  }

  const cancelFriendRequest = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUserId) return

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', currentUserId)
      .eq('friend_id', friendId)

    if (!error) {
      setPendingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(friendId)
        return newSet
      })
      setFriendships(prev => {
        const newMap = { ...prev }
        delete newMap[friendId]
        return newMap
      })
    }
  }

  const getFriendshipStatus = (userId: string): FriendshipStatus => {
    if (pendingRequests.has(userId)) return 'pending_sent'
    return friendships[userId] || 'none'
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'user') {
      setSelectedUserId(result.id)
    }
    onClose()
  }

  if (!mounted) return null

  return (
    <>
      {/* Profile Overlay */}
      {selectedUserId && (
        <ProfileOverlay
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Search Modal */}
      {open && createPortal(
    <div
      ref={panelRef}
      className={cn(
        'fixed z-[10000] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden',
        'max-h-[70vh]',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        // Mobile: centered, Desktop: anchored to button
        isMobile
          ? 'w-[90vw] left-1/2 -translate-x-1/2 top-20'
          : 'w-96'
      )}
      style={isMobile ? {} : {
        top: position.top,
        right: Math.max(16, position.right - 40)
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
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Ingen resultater</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {results.map((result) => (
              result.type === 'user' ? (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors w-full"
                >
                  <button
                    onClick={() => handleResultClick(result)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={result.image || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {getInitials(result.title)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500">Bruker</p>
                    </div>
                  </button>
                  {/* Friend action button - only show if not self */}
                  {currentUserId && result.id !== currentUserId && (
                    <div className="flex-shrink-0">
                      {(() => {
                        const status = getFriendshipStatus(result.id)
                        if (status === 'accepted') {
                          return (
                            <div className="p-1.5 text-green-500" title="Venn">
                              <UserCheck className="w-4 h-4" />
                            </div>
                          )
                        }
                        if (status === 'pending_sent') {
                          return (
                            <button
                              onClick={(e) => cancelFriendRequest(result.id, e)}
                              className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Angre venneforespørsel"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )
                        }
                        if (status === 'pending_received') {
                          return (
                            <div className="p-1.5 text-blue-500" title="Venter på deg">
                              <Clock className="w-4 h-4" />
                            </div>
                          )
                        }
                        // status === 'none'
                        return (
                          <button
                            onClick={(e) => sendFriendRequest(result.id, e)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Legg til som venn"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.link}
                  onClick={() => handleResultClick(result)}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      {getIcon(result.type)}
                    </div>
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
              )
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
  )}
    </>
  )
}
