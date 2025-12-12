'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, UserPlus, MessageCircle, ChevronLeft, BarChart3, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewMember {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

interface UpcomingEvent {
  id: string
  title: string
  image_url: string | null
  event_date: string
  event_time: string | null
  event_end_time: string | null
  event_location: string | null
}

interface Stats {
  totalMembers: number
  totalPosts: number
  totalComments: number
}

interface RecentComment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  post: {
    id: string
    title: string
  }
}

export function RightSidebar() {
  const [newMembers, setNewMembers] = useState<NewMember[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, totalPosts: 0, totalComments: 0 })
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for open-right-sidebar event from BottomNav
  useEffect(() => {
    const handleOpenSidebar = () => setMobileOpen(true)
    window.addEventListener('open-right-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-right-sidebar', handleOpenSidebar)
  }, [])

  // Swipe left anywhere to open right menu
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (mobileOpen) return // Don't track if menu is already open
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null || mobileOpen) return

      const touch = e.touches[0]
      const deltaX = touchStartX.current - touch.clientX // Swipe left (positive value means left)
      const deltaY = Math.abs(touch.clientY - touchStartY.current)

      // Swipe left to open (positive deltaX), must be more horizontal than vertical
      if (deltaX > 80 && deltaX > deltaY * 1.5) {
        setMobileOpen(true)
        touchStartX.current = null
        touchStartY.current = null
      }
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
      touchStartY.current = null
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [mobileOpen])

  // Swipe to close drawer
  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    // Swipe right to close
    if (deltaX > 50 && deltaX > deltaY) {
      setMobileOpen(false)
      touchStartX.current = null
      touchStartY.current = null
    }
  }

  const handleDrawerTouchEnd = () => {
    touchStartX.current = null
    touchStartY.current = null
  }

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const fetchRecentComments = useCallback(async () => {
    const { data: comments } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user:profiles!comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        post:posts!comments_post_id_fkey (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (comments) {
      const formattedComments = comments.map((comment) => {
        const userData = Array.isArray(comment.user) ? comment.user[0] : comment.user
        const postData = Array.isArray(comment.post) ? comment.post[0] : comment.post
        return {
          ...comment,
          user: userData as RecentComment['user'],
          post: postData as RecentComment['post'],
        }
      })
      setRecentComments(formattedComments)
    }
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      // Fetch new members
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (members) setNewMembers(members)

      // Fetch upcoming events
      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase
        .from('posts')
        .select('id, title, image_url, event_date, event_time, event_end_time, event_location')
        .eq('type', 'event')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(3)

      if (events) setUpcomingEvents(events)

      // Fetch recent comments
      await fetchRecentComments()

      // Fetch stats
      const [membersCount, postsCount, commentsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        totalMembers: membersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalComments: commentsCount.count || 0,
      })

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  // Real-time subscription for comments + polling fallback
  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          // Refetch comments when any change happens
          fetchRecentComments()
        }
      )
      .subscribe()

    // Polling fallback every 5 seconds in case realtime doesn't work
    const pollInterval = setInterval(() => {
      fetchRecentComments()
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [supabase, fetchRecentComments])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatEventDate = (date: string, time?: string | null, endTime?: string | null) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }
    const dateObj = new Date(date)
    let formatted = dateObj.toLocaleDateString('nb-NO', options)
    if (time) {
      formatted += ` kl. ${time.slice(0, 5)}`
      if (endTime) {
        formatted += `–${endTime.slice(0, 5)}`
      }
    }
    return formatted
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'I dag'
    if (diffInDays === 1) return 'I går'
    if (diffInDays < 7) return `${diffInDays} dager siden`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} uker siden`
    return `${Math.floor(diffInDays / 30)} måneder siden`
  }

  // Sidebar content component to avoid duplication
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-4", isMobile && "p-4")}>
      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className={`grid grid-cols-3 gap-2 text-center ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              <p className="text-xs text-gray-500">Medlemmer</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              <p className="text-xs text-gray-500">Innlegg</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComments}</p>
              <p className="text-xs text-gray-500">Kommentarer</p>
            </div>
          </div>
          {!isLoggedIn && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Logg inn for å se statistikk</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Card className="gap-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              Kommende arrangementer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/innlegg/${event.id}`} onClick={() => isMobile && setMobileOpen(false)}>
                  <div className="rounded-lg hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden">
                    {event.image_url && (
                      <div className="w-full h-24 overflow-hidden">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {formatEventDate(event.event_date, event.event_time, event.event_end_time)}
                        </Badge>
                        {event.event_location && (
                          <span className="text-[10px] text-gray-500 inline-flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {event.event_location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New members */}
      <Card className="gap-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-500" />
            Nye medlemmer
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`space-y-2 ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
            {newMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.full_name || 'Ukjent'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {getTimeAgo(member.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {!isLoggedIn && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Logg inn for å se medlemmer</p>
          )}
        </CardContent>
      </Card>

      {/* Recent comments */}
      <Card className="gap-0">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-500" />
            Siste kommentarer
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`space-y-4 ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
            {recentComments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Ingen kommentarer ennå</p>
            ) : (
              (() => {
                const groups: { post: RecentComment['post'], comments: RecentComment[] }[] = []
                recentComments.forEach((comment) => {
                  const lastGroup = groups[groups.length - 1]
                  const currentPostId = comment.post?.id
                  if (lastGroup && lastGroup.post?.id === currentPostId) {
                    lastGroup.comments.push(comment)
                  } else {
                    groups.push({ post: comment.post, comments: [comment] })
                  }
                })
                return groups.map((group, index) => (
                  <div key={`${group.post?.id}-${index}`} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <Link href={`/#post-${group.post?.id}`} onClick={() => isMobile && setMobileOpen(false)}>
                      <h4 className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                        {group.post?.title || 'Ukjent innlegg'}
                      </h4>
                    </Link>
                    <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                      {group.comments.map((comment) => (
                        <div key={comment.id} className="hover:bg-gray-50 rounded p-1.5 transition-colors">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={comment.user?.avatar_url || undefined} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-[7px]">
                                {getInitials(comment.user?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-medium text-gray-700">
                              {comment.user?.full_name || 'Ukjent'}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {getTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()
            )}
          </div>
          {!isLoggedIn && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Logg inn for å se kommentarer</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <>
        {/* Desktop loading */}
        <aside className="hidden lg:block w-72 space-y-4">
          <Card className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
        {/* Mobile teaser - even during loading */}
        {mounted && createPortal(
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed right-0 top-20 z-40 bg-blue-600 text-white py-2 px-1 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Åpne statistikk"
          >
            <ChevronLeft className="w-4 h-4" />
            <BarChart3 className="w-4 h-4 mt-1" />
          </button>,
          document.body
        )}
      </>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72">
        <SidebarContent />
      </aside>

      {/* Mobile teaser tab */}
      {mounted && createPortal(
        <>
          {/* Teaser button - near top right, under navbar */}
          <button
            onClick={() => setMobileOpen(true)}
            className={cn(
              "lg:hidden fixed right-0 top-20 z-40 bg-blue-600 text-white py-2 px-1.5 rounded-l-lg shadow-lg hover:bg-blue-700 transition-all",
              mobileOpen && "opacity-0 pointer-events-none"
            )}
            aria-label="Åpne statistikk"
          >
            <ChevronLeft className="w-4 h-4" />
            <BarChart3 className="w-4 h-4 mt-1" />
            {upcomingEvents.length > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">
                {upcomingEvents.length}
              </span>
            )}
          </button>

          {/* Overlay */}
          <div
            className={cn(
              "lg:hidden fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300",
              mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out drawer from right */}
          <div
            onTouchStart={handleDrawerTouchStart}
            onTouchMove={handleDrawerTouchMove}
            onTouchEnd={handleDrawerTouchEnd}
            className={cn(
              "lg:hidden fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-gray-50 shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out overflow-y-auto",
              mobileOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Statistikk & Info
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Lukk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <SidebarContent isMobile />
          </div>
        </>,
        document.body
      )}
    </>
  )
}

