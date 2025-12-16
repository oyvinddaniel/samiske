'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Calendar, Home, Building2, MapPin, Plus, Settings2, Landmark, Bookmark, User, Languages, Briefcase } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddStarredLocationModal } from '@/components/geography'
import { sidebarConfig, buildLocationUrl } from '@/lib/config/sidebar'
import { getAdminCommunities } from '@/lib/communities'
import type { Community } from '@/lib/types/communities'

interface StarredLocationItem {
  type: 'language_area' | 'municipality' | 'place'
  id: string
  name: string
  href: string
}

interface UserProfile {
  full_name: string | null
  avatar_url: string | null
}

interface SidebarProps {
  currentCategory?: string
  activePanel?: 'feed' | 'friends' | 'messages' | 'chat' | 'group' | 'community' | 'profile' | 'geography' | 'bookmarks' | 'location'
  selectedLocationId?: string
}

export function Sidebar({ currentCategory = '', activePanel = 'feed', selectedLocationId }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentVisning = searchParams.get('visning') || ''
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [starredLocations, setStarredLocations] = useState<StarredLocationItem[]>([])
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [maxVisibleLocations, setMaxVisibleLocations] = useState(sidebarConfig.defaultMaxVisibleLocations)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [adminCommunities, setAdminCommunities] = useState<Community[]>([])

  // Create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        // First try getSession (faster, uses cached session)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setCurrentUserId(session.user.id)
          return
        }

        // Fallback to getUser
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      } catch {
        setCurrentUserId(null)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) {
        setUserProfile(null)
        return
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', currentUserId)
          .single()

        setUserProfile(data)
      } catch {
        setUserProfile(null)
      }
    }
    fetchProfile()
  }, [currentUserId, supabase])

  // Fetch admin communities
  const fetchAdminCommunities = useCallback(async () => {
    if (!currentUserId) {
      setAdminCommunities([])
      return
    }

    try {
      const communities = await getAdminCommunities()
      console.log('Admin communities:', communities)
      setAdminCommunities(communities)
    } catch (error) {
      console.error('Error fetching admin communities:', error)
      setAdminCommunities([])
    }
  }, [currentUserId])

  useEffect(() => {
    fetchAdminCommunities()
  }, [fetchAdminCommunities])

  // Listen for community creation to refresh list
  useEffect(() => {
    const handleCommunityCreated = () => {
      fetchAdminCommunities()
    }

    window.addEventListener('community-created', handleCommunityCreated)
    return () => window.removeEventListener('community-created', handleCommunityCreated)
  }, [fetchAdminCommunities])

  // Fetch notification counts
  const fetchCounts = useCallback(async () => {
    if (!currentUserId) {
      setPendingRequests(0)
      setUnreadMessages(0)
      return
    }

    try {
      const { count: pending } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', currentUserId)
        .eq('status', 'pending')

      const { data: unread } = await supabase
        .rpc('get_unread_message_count', { user_id_param: currentUserId })

      setPendingRequests(pending || 0)
      setUnreadMessages(unread || 0)
    } catch {
      setPendingRequests(0)
      setUnreadMessages(0)
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('sidebar-social')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${currentUserId}` }, () => fetchCounts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchCounts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchCounts])

  // Fetch starred locations
  const fetchStarredLocations = useCallback(async () => {
    if (!currentUserId) {
      setStarredLocations([])
      return
    }

    try {
      // Fetch starred language areas
      const { data: starredLanguageAreas } = await supabase
        .from('user_starred_language_areas')
        .select(`
          language_area:language_areas(
            id,
            name,
            code
          )
        `)
        .eq('user_id', currentUserId)

      // Fetch starred municipalities
      const { data: starredMunicipalities } = await supabase
        .from('user_starred_municipalities')
        .select(`
          municipality:municipalities(
            id,
            name,
            slug,
            country:countries(code)
          )
        `)
        .eq('user_id', currentUserId)

      // Fetch starred places
      const { data: starredPlaces } = await supabase
        .from('user_starred_places')
        .select(`
          place:places(
            id,
            name,
            slug,
            municipality:municipalities(
              slug,
              country:countries(code)
            )
          )
        `)
        .eq('user_id', currentUserId)

      const locations: StarredLocationItem[] = []

      // Process language areas
      if (starredLanguageAreas) {
        for (const item of starredLanguageAreas) {
          const la = item.language_area as unknown as { id: string; name: string; code: string } | null
          if (la) {
            locations.push({
              type: 'language_area',
              id: la.id,
              name: la.name,
              href: `/sapmi/sprak/${la.code}`
            })
          }
        }
      }

      // Process municipalities
      if (starredMunicipalities) {
        for (const item of starredMunicipalities) {
          const m = item.municipality as unknown as { id: string; name: string; slug: string; country: { code: string } | null } | null
          if (m && m.country) {
            locations.push({
              type: 'municipality',
              id: m.id,
              name: m.name,
              href: buildLocationUrl('municipality', m.country.code, m.slug)
            })
          }
        }
      }

      // Process places
      if (starredPlaces) {
        for (const item of starredPlaces) {
          const p = item.place as unknown as { id: string; name: string; slug: string; municipality: { slug: string; country: { code: string } | null } | null } | null
          if (p && p.municipality && p.municipality.country) {
            locations.push({
              type: 'place',
              id: p.id,
              name: p.name,
              href: buildLocationUrl('place', p.municipality.country.code, p.municipality.slug, p.slug)
            })
          }
        }
      }

      // Sort by name
      locations.sort((a, b) => a.name.localeCompare(b.name, 'nb'))
      setStarredLocations(locations)
    } catch (error) {
      console.error('Error fetching starred locations:', error)
      setStarredLocations([])
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchStarredLocations()
  }, [fetchStarredLocations])

  // Load max visible locations preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(sidebarConfig.storageKeys.maxLocations)
    if (saved) {
      setMaxVisibleLocations(parseInt(saved, 10))
    }
  }, [])

  const visibleLocations = starredLocations.slice(0, maxVisibleLocations)
  const hasMoreLocations = starredLocations.length > maxVisibleLocations

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      {/* Navigation */}
      <nav className="flex-1 p-4 pt-6">
        {/* User profile link at top */}
        {currentUserId && userProfile && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-profile-panel'))}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left',
                activePanel === 'profile'
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              )}
            >
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || 'Profil'} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {userProfile.full_name
                    ? userProfile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-semibold text-sm truncate',
                  activePanel === 'profile' ? 'text-blue-700' : 'text-gray-900'
                )}>
                  {userProfile.full_name || 'Min profil'}
                </p>
                <p className="text-xs text-gray-500">Se dine innlegg</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Mine sider - communities user administers */}
        {currentUserId && adminCommunities.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Mine sider
            </h2>
            <ul className="space-y-1">
              {adminCommunities.map((community) => (
                <li key={community.id}>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-community-page', {
                        detail: { slug: community.slug }
                      }))
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                  >
                    {community.logo_url ? (
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={community.logo_url} alt={community.name} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-[10px]">
                          {community.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Briefcase className="w-4 h-4 text-orange-500" />
                    )}
                    <span className="truncate">{community.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation links */}
        <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
          {/* Start - primary/dominant link */}
          <Link
            href="/"
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold transition-colors',
              pathname === '/' && !currentVisning && activePanel === 'feed'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-800 hover:bg-blue-50/50'
            )}
          >
            <span className="flex items-center gap-3">
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                pathname === '/' && !currentVisning && activePanel === 'feed'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              )}>
                <Home className={cn(
                  'w-5 h-5 transition-colors',
                  pathname === '/' && !currentVisning && activePanel === 'feed'
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )} />
              </div>
              Start
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          {/* Kalender */}
          <Link
            href="/?visning=kalender"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentVisning === 'kalender' && activePanel === 'feed'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-3">
              <Calendar className={cn(
                'w-4 h-4 transition-colors',
                currentVisning === 'kalender' && activePanel === 'feed' ? 'text-blue-600' : 'text-red-500'
              )} />
              Kalender
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Navigation section */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          {/* Grupper - direct link */}
          <Link
            href="/grupper"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === '/grupper'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-3">
              <Users className={cn(
                'w-4 h-4 transition-colors',
                pathname === '/grupper' ? 'text-blue-600' : 'text-purple-500'
              )} />
              Grupper
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          {/* Samfunn - opens community panel */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-community-panel'))
            }}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-1',
              activePanel === 'community'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-3">
              <Landmark className={cn(
                'w-4 h-4 transition-colors',
                activePanel === 'community' ? 'text-blue-600' : 'text-orange-500'
              )} />
              Samfunn
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Mine steder - only for logged in users */}
        {currentUserId && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            {/* Mine steder - clickable header that opens geography panel */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-geography-panel'))}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-1',
                activePanel === 'geography'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
              )}
            >
              <span className="flex items-center gap-3">
                <MapPin className={cn(
                  'w-4 h-4 transition-colors',
                  activePanel === 'geography' ? 'text-blue-600' : 'text-green-500'
                )} />
                {sidebarConfig.labels.myPlaces}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Child locations */}
            <ul className="space-y-1 ml-4">
              {visibleLocations.map((location) => (
                <li key={`${location.type}-${location.id}`}>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-location-panel', {
                        detail: {
                          type: location.type,
                          id: location.id,
                          name: location.name
                        }
                      }))
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                      activePanel === 'location' && selectedLocationId === location.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
                    )}
                  >
                    {location.type === 'language_area' ? (
                      <MapPin className="w-4 h-4 text-blue-500" />
                    ) : location.type === 'municipality' ? (
                      <MapPin className="w-4 h-4 text-orange-500" />
                    ) : (
                      <MapPin className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="truncate">{location.name}</span>
                  </button>
                </li>
              ))}

              {/* Se alle link if more locations */}
              {hasMoreLocations && (
                <li>
                  <Link
                    href="/innstillinger?tab=steder"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>{sidebarConfig.labels.seeAll} ({starredLocations.length})</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Social section - only show when logged in */}
        {currentUserId && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Sosial
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-friends-panel'))}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activePanel === 'friends' || activePanel === 'chat'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Users className={cn(
                      'w-4 h-4 transition-colors',
                      activePanel === 'friends' || activePanel === 'chat' ? 'text-blue-600' : 'text-blue-500'
                    )} />
                    Venner
                  </span>
                  <span className="flex items-center gap-2">
                    {pendingRequests > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {pendingRequests}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-messages-panel'))}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activePanel === 'messages'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className={cn(
                      'w-4 h-4 transition-colors',
                      activePanel === 'messages' ? 'text-blue-600' : 'text-green-500'
                    )} />
                    Meldinger
                  </span>
                  <span className="flex items-center gap-2">
                    {unreadMessages > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-bookmarks-panel'))}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activePanel === 'bookmarks'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className={cn(
                      'w-4 h-4 transition-colors',
                      activePanel === 'bookmarks' ? 'text-blue-600' : 'text-amber-500'
                    )} />
                    Bokmerker
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* About section - compact */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Kommunikasjonsplattform for det samiske miljøet
        </p>
      </div>

      {/* Add starred location modal */}
      {currentUserId && (
        <AddStarredLocationModal
          open={showAddLocation}
          onOpenChange={setShowAddLocation}
          userId={currentUserId}
          onLocationAdded={fetchStarredLocations}
        />
      )}
    </aside>
  )
}
