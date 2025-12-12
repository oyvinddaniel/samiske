'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'

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
}

export function ProfileOverlay({ userId, onClose }: ProfileOverlayProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg mx-4 overflow-hidden relative !pt-0 !pb-0 !gap-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue accent bar - flush with top */}
        <div className="h-3" style={{ backgroundColor: '#1472E6' }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-4 text-gray-400 hover:text-gray-600 z-10"
          aria-label="Lukk"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex gap-6 p-6 animate-pulse">
              <div className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="w-32 h-6 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex gap-8 p-8">
              {/* Left side - Profile image */}
              <div className="flex-shrink-0 self-stretch">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profilbilde'}
                    className="h-full w-auto max-h-[350px] min-h-[150px] rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-full min-h-[150px] max-h-[350px] aspect-square rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-5xl font-semibold">
                      {getInitials(profile.full_name)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right side - Profile info */}
              <div className="flex-1 min-w-0">
                {/* Name */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {profile.full_name || 'Ukjent'}
                </h2>

                {/* Location */}
                {profile.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <span>📍</span> {profile.location}
                  </p>
                )}

                {/* Phone (if public) */}
                {profile.phone && profile.phone_public && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <span>📱</span> {profile.phone}
                  </p>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-3">
                    {profile.bio}
                  </p>
                )}

                {/* Member since */}
                <p className="text-xs text-gray-400 mt-4">
                  Medlem siden {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Kunne ikke laste profil
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
