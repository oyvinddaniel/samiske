'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Home, Calendar, Settings, Link2 } from 'lucide-react'
import { getUserLocations } from '@/lib/geography'
import { FriendActionButtons } from '@/components/friends/FriendActionButtons'
import Image from 'next/image'

interface SocialLink {
  type: string
  url: string
  label?: string
}

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: string
  created_at: string
  username: string | null
  tagline: string | null
  cover_image_url: string | null
  avatar_status_color: string | null
  social_links: SocialLink[]
  interests: string[]
}

interface LocationInfo {
  currentLocation: string | null
  homeLocation: string | null
  currentLocationData: { type: 'municipality' | 'place'; id: string; name: string } | null
  homeLocationData: { type: 'municipality' | 'place'; id: string; name: string } | null
}


interface ProfileHeaderProps {
  userId: string
  showEditButton?: boolean
  showNewPostButton?: boolean
  onNewPost?: () => void
  onOpenSettings?: () => void
}

export function ProfileHeader({
  userId,
  showEditButton = true,
  showNewPostButton = false,
  onNewPost,
  onOpenSettings
}: ProfileHeaderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showAllSocialLinks, setShowAllSocialLinks] = useState(false)
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    currentLocation: null,
    homeLocation: null,
    currentLocationData: null,
    homeLocationData: null
  })
  const supabase = useMemo(() => createClient(), [])

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

  useEffect(() => {
    const fetchProfile = async () => {
      // Fetch profile with location privacy settings and new fields
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location, role, created_at, show_current_location, show_home_location, username, tagline, cover_image_url, avatar_status_color, social_links, interests')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile({
          ...profileData,
          social_links: profileData.social_links || [],
          interests: profileData.interests || []
        })
      }

      // Fetch geography locations
      const locations = await getUserLocations(userId)
      if (locations && profileData) {
        const locationData: LocationInfo = {
          currentLocation: null,
          homeLocation: null,
          currentLocationData: null,
          homeLocationData: null
        }

        // Fetch current location details (only if user wants to show it publicly)
        const showCurrentLocation = profileData.show_current_location ?? true
        if (showCurrentLocation && locations.currentPlaceId) {
          const { data: place } = await supabase
            .from('places')
            .select('name, municipality:municipalities(name)')
            .eq('id', locations.currentPlaceId)
            .single()

          if (place) {
            const municipality = Array.isArray(place.municipality) ? place.municipality[0] : place.municipality
            locationData.currentLocation = `${place.name}, ${municipality?.name}`
            locationData.currentLocationData = {
              type: 'place',
              id: locations.currentPlaceId,
              name: place.name
            }
          }
        } else if (showCurrentLocation && locations.currentMunicipalityId) {
          const { data: municipality } = await supabase
            .from('municipalities')
            .select('name')
            .eq('id', locations.currentMunicipalityId)
            .single()

          if (municipality) {
            locationData.currentLocation = municipality.name
            locationData.currentLocationData = {
              type: 'municipality',
              id: locations.currentMunicipalityId,
              name: municipality.name
            }
          }
        }

        // Fetch home location details (only if user wants to show it publicly)
        const showHomeLocation = profileData.show_home_location ?? true
        if (showHomeLocation && locations.homePlaceId) {
          const { data: place } = await supabase
            .from('places')
            .select('name, municipality:municipalities(name)')
            .eq('id', locations.homePlaceId)
            .single()

          if (place) {
            const municipality = Array.isArray(place.municipality) ? place.municipality[0] : place.municipality
            locationData.homeLocation = `${place.name}, ${municipality?.name}`
            locationData.homeLocationData = {
              type: 'place',
              id: locations.homePlaceId,
              name: place.name
            }
          }
        } else if (showHomeLocation && locations.homeMunicipalityId) {
          const { data: municipality } = await supabase
            .from('municipalities')
            .select('name')
            .eq('id', locations.homeMunicipalityId)
            .single()

          if (municipality) {
            locationData.homeLocation = municipality.name
            locationData.homeLocationData = {
              type: 'municipality',
              id: locations.homeMunicipalityId,
              name: municipality.name
            }
          }
        }

        setLocationInfo(locationData)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [userId, supabase])

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
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
    })
  }

  const handleStartConversation = (userId: string) => {
    window.dispatchEvent(
      new CustomEvent('start-conversation-with-user', {
        detail: { userId, mode: 'bubble' }
      })
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'moderator':
        return <Badge variant="secondary">Moderator</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-4 pb-[15px]">
          <div className="animate-pulse">
            <div className="flex items-start gap-4 -mt-[15px]">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null
  }

  const avatarRingColor = profile.avatar_status_color || 'rgb(59, 130, 246)' // default blue

  return (
    <Card className="mb-6 overflow-hidden p-0">
      {/* Cover Image */}
      <div className="relative w-full h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : null}
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>

      <CardContent className="relative pt-0 pb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
          {/* Avatar with status ring */}
          <div className="relative">
            <Avatar
              className="w-24 h-24 border-4 border-white shadow-xl"
              style={{
                boxShadow: profile.avatar_status_color
                  ? `0 0 0 3px ${profile.avatar_status_color}`
                  : undefined
              }}
            >
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Profilbilde'} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 mt-2 sm:mt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white sm:text-gray-900 drop-shadow-lg sm:drop-shadow-none">
                {profile.full_name || 'Ukjent bruker'}
              </h1>
              {getRoleBadge(profile.role)}
            </div>

            {/* Username */}
            {profile.username && (
              <p className="text-sm text-white/90 sm:text-gray-500 mt-1 drop-shadow-md sm:drop-shadow-none">
                @{profile.username}
              </p>
            )}

            {/* Tagline */}
            {profile.tagline && (
              <p className="text-sm text-white/80 sm:text-gray-700 italic mt-1 drop-shadow-md sm:drop-shadow-none">
                "{profile.tagline}"
              </p>
            )}

            {/* Social Links - Only show on desktop or after moving below banner */}
            {profile.social_links && profile.social_links.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2 mt-2">
                {profile.social_links.slice(0, 3).map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Link2 className="w-3 h-3" />
                    {link.label || link.type}
                  </a>
                ))}
                {profile.social_links.length > 3 && (
                  <button
                    onClick={() => setShowAllSocialLinks(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    +{profile.social_links.length - 3} mer
                  </button>
                )}
              </div>
            )}

            {(locationInfo.currentLocation || locationInfo.homeLocation) && (
              <div className="text-sm text-gray-500 mt-1 space-y-1">
                {locationInfo.currentLocation && locationInfo.currentLocationData && (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-location-panel', {
                        detail: locationInfo.currentLocationData
                      }))
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="underline">{locationInfo.currentLocation}</span>
                  </button>
                )}
                {locationInfo.homeLocation && locationInfo.homeLocationData && (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-location-panel', {
                        detail: locationInfo.homeLocationData
                      }))
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span className="underline">{locationInfo.homeLocation}</span>
                  </button>
                )}
              </div>
            )}

            {profile.bio && (
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                {profile.bio}
              </p>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
              <Calendar className="w-3 h-3" />
              Medlem siden {formatDate(profile.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:items-end">
            {/* Show settings button for own profile */}
            {showEditButton && onOpenSettings && currentUserId === userId && (
              <Button onClick={onOpenSettings} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Innstillinger
              </Button>
            )}

            {/* Show friend actions for other users' profiles */}
            {currentUserId && currentUserId !== userId && (
              <FriendActionButtons
                targetUserId={userId}
                currentUserId={currentUserId}
                variant="outline"
                showMessageButton={true}
                onStartConversation={handleStartConversation}
              />
            )}
          </div>
        </div>
      </CardContent>

      {/* Social Links Modal */}
      <Dialog open={showAllSocialLinks} onOpenChange={setShowAllSocialLinks}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sosiale lenker</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {profile?.social_links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Link2 className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {link.label || link.type}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{link.url}</p>
                </div>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
