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
}

interface ProfileOverlayProps {
  userId: string
  onClose: () => void
  onStartConversation?: (userId: string) => void
  onMouseEnter?: () => void
}

export function ProfileOverlay({ userId, onClose, onStartConversation, onMouseEnter }: ProfileOverlayProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
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

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location, phone, phone_public, created_at')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchProfile()
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

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={onMouseEnter}
        className={cn(
          'fixed z-[9999] bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden',
          'w-[calc(100%-2rem)] max-w-lg',
          'left-1/2 -translate-x-1/2',
          'md:left-[22.5rem] md:translate-x-0',
          'bottom-4 md:bottom-6',
          'max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)]',
          isClosing ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'
        )}
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
        <div className="overflow-y-auto px-4 py-4 pb-safe" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse py-8">
              <div className="w-24 h-24 rounded-full bg-gray-200" />
              <div className="w-32 h-6 bg-gray-200 rounded" />
              <div className="w-48 h-4 bg-gray-200 rounded" />
            </div>
          ) : profile ? (
            <div className="flex flex-col items-center text-center">
              {/* Profile image */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profilbilde'}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center ring-4 ring-blue-50">
                  <span className="text-blue-600 text-3xl font-semibold">
                    {getInitials(profile.full_name)}
                  </span>
                </div>
              )}

              {/* Name */}
              <h3 className="text-xl font-semibold text-gray-900 mt-4">
                {profile.full_name || 'Ukjent'}
              </h3>

              {/* Location */}
              {profile.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <span>📍</span> {profile.location}
                </p>
              )}

              {/* Phone (if public) */}
              {profile.phone && profile.phone_public && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <span>📱</span> {profile.phone}
                </p>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap mt-4 max-w-sm">
                  {profile.bio}
                </p>
              )}

              {/* Member since */}
              <p className="text-xs text-gray-400 mt-4">
                Medlem siden {formatDate(profile.created_at)}
              </p>

              {/* Friend and message buttons - only show for other users */}
              {currentUserId && currentUserId !== userId && (
                <div className="mt-6">
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
          ) : (
            <p className="text-center text-gray-500 py-8">
              Kunne ikke laste profil
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
