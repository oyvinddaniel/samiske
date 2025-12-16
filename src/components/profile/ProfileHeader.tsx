'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Home, Calendar, Settings } from 'lucide-react'
import { getUserLocations } from '@/lib/geography'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: string
  created_at: string
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
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    currentLocation: null,
    homeLocation: null,
    currentLocationData: null,
    homeLocationData: null
  })
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchProfile = async () => {
      // Fetch profile with location privacy settings
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location, role, created_at, show_current_location, show_home_location')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
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

  return (
    <Card className="mb-6">
      <CardContent className="pt-4 pb-[15px]">
        <div className="flex flex-col sm:flex-row items-start gap-4 -mt-[15px]">
          {/* Avatar */}
          <Avatar className="w-20 h-20 border-2 border-white shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Profilbilde'} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.full_name || 'Ukjent bruker'}
              </h1>
              {getRoleBadge(profile.role)}
            </div>

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
            {showEditButton && onOpenSettings && (
              <Button onClick={onOpenSettings} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Innstillinger
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
