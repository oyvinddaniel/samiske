'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FriendActionButtons } from '@/components/friends/FriendActionButtons'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  phone_public: boolean
  created_at: string
  username: string | null
  tagline: string | null
  cover_image_url: string | null
  avatar_status_color: string | null
  social_links: Array<{ type: string; url: string; label?: string }> | null
  interests: string[] | null
}

interface QuickStats {
  total_posts: number
  friend_count: number
  total_likes_received: number
}

interface ProfileOverlayProps {
  userId: string
  onClose: () => void
  onStartConversation?: (userId: string) => void
  onMouseEnter?: () => void
}

export function ProfileOverlay({ userId, onClose, onStartConversation, onMouseEnter }: ProfileOverlayProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const currentTranslateY = useRef(0)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUserId(session.user.id)
          return
        }
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      } catch {
        setCurrentUserId(null)
      }
    }
    getCurrentUser()
  }, [supabase])

  // Fetch profile and stats
  useEffect(() => {
    const fetchData = async () => {
      // Fetch profile with new fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileError && profileData) {
        setProfile(profileData)
      }

      // Fetch quick stats
      const { data: statsData } = await supabase
        .from('profile_stats')
        .select('total_posts, friend_count, total_likes_received')
        .eq('user_id', userId)
        .single()

      if (statsData) {
        setStats(statsData as QuickStats)
      }

      setLoading(false)
    }

    fetchData()
  }, [userId, supabase])


  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Start conversation with this user
  const handleStartConversation = () => {
    if (onStartConversation) {
      onStartConversation(userId)
      handleClose()
    }
  }

  // Close with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300)
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !sheetRef.current) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    if (deltaY > 0) {
      currentTranslateY.current = deltaY
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!sheetRef.current) return
    if (currentTranslateY.current > 100) {
      handleClose()
    } else {
      sheetRef.current.style.transform = 'translateY(0)'
    }
    touchStartY.current = null
    currentTranslateY.current = 0
  }

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
      month: 'long',
      year: 'numeric',
    })
  }

  const getSocialIcon = (type: string) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'instagram':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        )
      case 'facebook':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )
      case 'linkedin':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        )
    }
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
      />

      {/* Bottom Sheet with Glassmorphism */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={onMouseEnter}
        className={cn(
          'fixed z-[9999] rounded-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden',
          'w-[calc(100%-2rem)] max-w-lg',
          'left-1/2 -translate-x-1/2',
          'md:left-[22.5rem] md:translate-x-0',
          'bottom-4 md:bottom-6',
          'max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)]',
          // Glassmorphism effect
          'bg-white/95 backdrop-blur-xl border border-white/20',
          isClosing ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        )}
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <button
            onClick={() => {
              handleClose()
              window.dispatchEvent(
                new CustomEvent('open-user-profile-panel', {
                  detail: { userId }
                })
              )
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
            aria-label="Gå til fullstendig profil"
          >
            <ArrowRight className="w-4 h-4" />
            Gå til profil
          </button>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-safe" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse py-8 px-4">
              <div className="w-24 h-24 rounded-full bg-gray-200" />
              <div className="w-32 h-6 bg-gray-200 rounded" />
              <div className="w-48 h-4 bg-gray-200 rounded" />
            </div>
          ) : profile ? (
            <div className="flex flex-col">
              {/* Cover Image */}
              {profile.cover_image_url && (
                <div className="relative h-32 bg-gradient-to-br from-blue-100 to-purple-100">
                  <img
                    src={profile.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Profile Header */}
              <div className="px-4 pt-4 flex flex-col items-center text-center relative">
                {/* Profile image with status ring */}
                <div className={cn(
                  "relative",
                  profile.cover_image_url && "-mt-16"
                )}>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Profilbilde'}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white bg-white"
                      style={profile.avatar_status_color ? {
                        boxShadow: `0 0 0 4px ${profile.avatar_status_color}`
                      } : {
                        boxShadow: '0 0 0 4px rgb(219, 234, 254)' // blue-100
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-blue-50 bg-white">
                      <span className="text-blue-600 text-3xl font-semibold">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name and Username */}
                <h3 className="text-xl font-semibold text-gray-900 mt-3">
                  {profile.full_name || 'Ukjent'}
                </h3>
                {profile.username && (
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                )}

                {/* Tagline */}
                {profile.tagline && (
                  <p className="text-sm text-gray-600 mt-2 italic">
                    {profile.tagline}
                  </p>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-3 max-w-sm">
                    {profile.bio}
                  </p>
                )}

                {/* Quick Stats */}
                {stats && (
                  <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-sm">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-xl font-bold text-blue-700">{stats.total_posts}</p>
                      <p className="text-xs text-blue-600">Innlegg</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-xl font-bold text-green-700">{stats.friend_count}</p>
                      <p className="text-xs text-green-600">Venner</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-xl font-bold text-red-700">{Number(stats.total_likes_received)}</p>
                      <p className="text-xs text-red-600">Likes</p>
                    </div>
                  </div>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="mt-4 w-full max-w-sm">
                    <p className="text-xs font-medium text-gray-500 mb-2">Interesser</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {profile.interests.slice(0, 5).map((interest, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-blue-100/70 text-blue-800 rounded-full backdrop-blur-sm"
                        >
                          {interest}
                        </span>
                      ))}
                      {profile.interests.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100/70 text-gray-600 rounded-full backdrop-blur-sm">
                          +{profile.interests.length - 5} flere
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {profile.social_links && profile.social_links.length > 0 && (
                  <div className="mt-4 flex gap-2 justify-center">
                    {profile.social_links.slice(0, 4).map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-100/70 hover:bg-gray-200/70 rounded-full transition-colors backdrop-blur-sm"
                        title={link.label || link.type}
                      >
                        {getSocialIcon(link.type)}
                      </a>
                    ))}
                  </div>
                )}

                {/* Member since */}
                <p className="text-xs text-gray-400 mt-4">
                  Medlem siden {formatDate(profile.created_at)}
                </p>

                {/* Friend and message buttons - only show for other users */}
                {currentUserId && currentUserId !== userId && (
                  <div className="mt-6 mb-4">
                    <FriendActionButtons
                      targetUserId={userId}
                      currentUserId={currentUserId}
                      onStartConversation={onStartConversation}
                      showMessageButton={!!onStartConversation}
                      className="justify-center"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 px-4">
              Kunne ikke laste profil
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
