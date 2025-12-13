'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Calendar, Newspaper, Globe, Building2, MapPin, Plus, Settings2 } from 'lucide-react'
import { AddStarredLocationModal } from '@/components/geography'
import { sidebarConfig, buildLocationUrl, locationIcons } from '@/lib/config/sidebar'

interface StarredLocationItem {
  type: 'municipality' | 'place'
  id: string
  name: string
  href: string
}

interface SidebarProps {
  currentCategory?: string
  activePanel?: 'feed' | 'friends' | 'messages' | 'chat'
}

export function Sidebar({ currentCategory = '', activePanel = 'feed' }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentVisning = searchParams.get('visning') || ''
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [starredLocations, setStarredLocations] = useState<StarredLocationItem[]>([])
  const [showAddLocation, setShowAddLocation] = useState(false)
  const [maxVisibleLocations, setMaxVisibleLocations] = useState(sidebarConfig.defaultMaxVisibleLocations)

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
        {/* Navigation links */}
        <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
          {/* Aktivitet - primary/dominant link */}
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
                <Newspaper className={cn(
                  'w-5 h-5 transition-colors',
                  pathname === '/' && !currentVisning && activePanel === 'feed'
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )} />
              </div>
              Aktivitet
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

        {/* Geography section - Utforsk Sapmi always visible */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <Link
            href="/sapmi"
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/sapmi')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
            )}
          >
            <span className="flex items-center gap-3">
              <Globe className={cn(
                'w-4 h-4 transition-colors',
                pathname.startsWith('/sapmi') ? 'text-blue-600' : 'text-emerald-500'
              )} />
              {sidebarConfig.labels.exploreRegion}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Mine steder - only for logged in users */}
        {currentUserId && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {sidebarConfig.labels.myPlaces}
            </h2>
            <ul className="space-y-1">
              {visibleLocations.map((location) => (
                <li key={`${location.type}-${location.id}`}>
                  <Link
                    href={location.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      pathname === location.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-blue-50/50 hover:text-gray-700'
                    )}
                  >
                    {location.type === 'municipality' ? (
                      <Building2 className="w-4 h-4 text-gray-400" />
                    ) : (
                      <MapPin className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="truncate">{location.name}</span>
                  </Link>
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

              {/* Legg til sted button */}
              <li>
                <button
                  onClick={() => setShowAddLocation(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{sidebarConfig.labels.addPlace}</span>
                </button>
              </li>
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
