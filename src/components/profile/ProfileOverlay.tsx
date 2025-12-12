'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck, Clock, MessageCircle, UserX, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'

interface ProfileOverlayProps {
  userId: string
  onClose: () => void
  onStartConversation?: (userId: string) => void
}

export function ProfileOverlay({ userId, onClose, onStartConversation }: ProfileOverlayProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none')
  const [friendshipLoading, setFriendshipLoading] = useState(false)
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

  // Fetch friendship status
  useEffect(() => {
    const fetchFriendshipStatus = async () => {
      if (!currentUserId || currentUserId === userId) return

      try {
        const { data: friendships, error } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)

        if (error) {
          console.error('Error fetching friendship status:', error)
          setFriendshipStatus('none')
          return
        }

        if (friendships && friendships.length > 0) {
          const friendship = friendships[0]
          if (friendship.status === 'blocked') {
            setFriendshipStatus('blocked')
          } else if (friendship.status === 'accepted') {
            setFriendshipStatus('accepted')
          } else if (friendship.status === 'pending') {
            if (friendship.requester_id === currentUserId) {
              setFriendshipStatus('pending_sent')
            } else {
              setFriendshipStatus('pending_received')
            }
          }
        } else {
          setFriendshipStatus('none')
        }
      } catch (err) {
        console.error('Unexpected error in friendship status:', err)
        setFriendshipStatus('none')
      }
    }

    fetchFriendshipStatus()
  }, [currentUserId, userId, supabase])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Send friend request
  const sendFriendRequest = async () => {
    if (!currentUserId) return
    setFriendshipLoading(true)

    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUserId,
        addressee_id: userId,
        status: 'pending'
      })

    if (!error) {
      setFriendshipStatus('pending_sent')
    }
    setFriendshipLoading(false)
  }

  // Accept friend request
  const acceptFriendRequest = async () => {
    if (!currentUserId) return
    setFriendshipLoading(true)

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', userId)
      .eq('addressee_id', currentUserId)

    if (!error) {
      setFriendshipStatus('accepted')
    }
    setFriendshipLoading(false)
  }

  // Cancel friend request or remove friend
  const removeFriendship = async () => {
    if (!currentUserId) return
    setFriendshipLoading(true)

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUserId})`)

    if (!error) {
      setFriendshipStatus('none')
    }
    setFriendshipLoading(false)
  }

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
          <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
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
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {/* Friend button based on status */}
                  {friendshipStatus === 'none' && (
                    <button
                      onClick={sendFriendRequest}
                      disabled={friendshipLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Legg til venn
                    </button>
                  )}

                  {friendshipStatus === 'pending_sent' && (
                    <button
                      onClick={removeFriendship}
                      disabled={friendshipLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      Forespørsel sendt
                    </button>
                  )}

                  {friendshipStatus === 'pending_received' && (
                    <div className="flex gap-2">
                      <button
                        onClick={acceptFriendRequest}
                        disabled={friendshipLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Godta
                      </button>
                      <button
                        onClick={removeFriendship}
                        disabled={friendshipLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                        Avslå
                      </button>
                    </div>
                  )}

                  {friendshipStatus === 'accepted' && (
                    <button
                      onClick={removeFriendship}
                      disabled={friendshipLoading}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Venner
                    </button>
                  )}

                  {/* Message button - show for friends */}
                  {friendshipStatus === 'accepted' && onStartConversation && (
                    <button
                      onClick={handleStartConversation}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send melding
                    </button>
                  )}
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
