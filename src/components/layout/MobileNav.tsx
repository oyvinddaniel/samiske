'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Home, Calendar, Bookmark, Building2, MapPin, Languages, Plus, Settings2, Landmark, User } from 'lucide-react'
import { SocialPanel } from '@/components/social/SocialPanel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { sidebarConfig, buildLocationUrl } from '@/lib/config/sidebar'

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

interface MobileNavProps {
  currentCategory?: string
}

function MobileNavContent({ currentCategory = '' }: MobileNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentVisning = searchParams.get('visning') || ''
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)
  const [showSocialPanel, setShowSocialPanel] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [starredLocations, setStarredLocations] = useState<StarredLocationItem[]>([])
  const [maxVisibleLocations, setMaxVisibleLocations] = useState(sidebarConfig.defaultMaxVisibleLocations)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
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
      .channel('mobile-nav-social')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${currentUserId}` }, () => fetchCounts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchCounts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchCounts])

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

  // Listen for open-left-sidebar event from BottomNav
  useEffect(() => {
    const handleOpenSidebar = () => setIsOpen(true)
    window.addEventListener('open-left-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-left-sidebar', handleOpenSidebar)
  }, [])

  // Track when right menu opens/closes
  useEffect(() => {
    const handleRightMenuOpen = () => setRightMenuOpen(true)
    const handleRightMenuClose = () => setRightMenuOpen(false)
    window.addEventListener('right-menu-opened', handleRightMenuOpen)
    window.addEventListener('right-menu-closed', handleRightMenuClose)
    return () => {
      window.removeEventListener('right-menu-opened', handleRightMenuOpen)
      window.removeEventListener('right-menu-closed', handleRightMenuClose)
    }
  }, [])

  // Notify when this menu opens/closes (sync + async)
  useEffect(() => {
    // Set synchronous flag on window for immediate access by other components
    (window as unknown as { __leftMenuOpen: boolean }).__leftMenuOpen = isOpen

    if (isOpen) {
      window.dispatchEvent(new CustomEvent('left-menu-opened'))
    } else {
      window.dispatchEvent(new CustomEvent('left-menu-closed'))
    }
  }, [isOpen])

  // Swipe right anywhere to open left menu, swipe left to close when open
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = Math.abs(touch.clientY - touchStartY.current)

      // Check synchronous flag for right menu state (more reliable than async state)
      const isRightMenuOpen = (window as unknown as { __rightMenuOpen?: boolean }).__rightMenuOpen

      if (isOpen) {
        // When menu is open, swipe left anywhere to close
        if (deltaX < -80 && Math.abs(deltaX) > deltaY * 1.5) {
          // Set flag to prevent other menu from opening on same swipe
          (window as unknown as { __menuJustClosed: boolean }).__menuJustClosed = true
          setTimeout(() => {
            (window as unknown as { __menuJustClosed: boolean }).__menuJustClosed = false
          }, 100)
          setIsOpen(false)
          touchStartX.current = null
          touchStartY.current = null
        }
      } else if (!isRightMenuOpen && !(window as unknown as { __menuJustClosed?: boolean }).__menuJustClosed) {
        // When menu is closed AND right menu is not open, swipe right to open
        if (deltaX > 80 && deltaX > deltaY * 1.5) {
          setIsOpen(true)
          touchStartX.current = null
          touchStartY.current = null
        }
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
  }, [isOpen])

  // Swipe to close menu
  const handleMenuTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    // Swipe left to close
    if (deltaX < -50 && Math.abs(deltaX) > deltaY) {
      setIsOpen(false)
      touchStartX.current = null
      touchStartY.current = null
    }
  }

  const handleMenuTouchEnd = () => {
    touchStartX.current = null
    touchStartY.current = null
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen || showSocialPanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, showSocialPanel])

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-white/80 hover:text-white"
        aria-label="Åpne meny"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Portal for menu - renders at document body level to avoid stacking context issues */}
      {mounted && createPortal(
        <>
          {/* Overlay */}
          <div
            className={cn(
              'fixed inset-0 bg-black/50 z-[9998] md:hidden transition-opacity duration-300',
              isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out menu */}
          <div
            ref={menuRef}
            onTouchStart={handleMenuTouchStart}
            onTouchMove={handleMenuTouchMove}
            onTouchEnd={handleMenuTouchEnd}
            className={cn(
              'fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out md:hidden',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
                  <img
                    src="/images/sami.jpg"
                    alt="Samisk flagg"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-gray-900">samiske.no</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Lukk meny"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
              {/* User profile link at top */}
              {currentUserId && userProfile && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('open-profile-panel'))
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left hover:bg-gray-50"
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
                      <p className="font-semibold text-sm truncate text-gray-900">
                        {userProfile.full_name || 'Min profil'}
                      </p>
                      <p className="text-xs text-gray-500">Se dine innlegg</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* Navigation links */}
              <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
                {/* Start - primary/dominant link */}
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-semibold transition-colors',
                    pathname === '/' && !currentVisning
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-800 hover:bg-blue-50/50'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <div className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      pathname === '/' && !currentVisning
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    )}>
                      <Home className={cn(
                        'w-5 h-5 transition-colors',
                        pathname === '/' && !currentVisning
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
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    currentVisning === 'kalender'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-700'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Calendar className={cn(
                      'w-4 h-4 transition-colors',
                      currentVisning === 'kalender' ? 'text-blue-600' : 'text-red-500'
                    )} />
                    Kalender
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>

              {/* Navigation section - Grupper & Samfunn */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                {/* Grupper - direct link */}
                <Link
                  href="/grupper"
                  onClick={() => setIsOpen(false)}
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
                    setIsOpen(false)
                    window.dispatchEvent(new CustomEvent('open-community-panel'))
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-1 text-gray-600 hover:bg-blue-50/50 hover:text-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <Landmark className="w-4 h-4 text-orange-500" />
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
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('open-geography-panel'))
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-1 text-gray-600 hover:bg-blue-50/50 hover:text-gray-700"
                  >
                    <span className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-green-500" />
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
                            setIsOpen(false)
                            window.dispatchEvent(new CustomEvent('open-location-panel', {
                              detail: {
                                type: location.type,
                                id: location.id,
                                name: location.name
                              }
                            }))
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left text-gray-600 hover:bg-blue-50/50 hover:text-gray-700"
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
                          onClick={() => setIsOpen(false)}
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
                <div className="space-y-1">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Sosial
                  </h2>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('open-friends-panel'))
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-blue-500" />
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
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('open-messages-panel'))
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-green-500" />
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
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.dispatchEvent(new CustomEvent('open-bookmarks-panel'))
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      Bokmerker
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
              <p className="text-[10px] text-gray-400 text-center">
                Kommunikasjonsplattform for det samiske miljøet
              </p>
            </div>
          </div>

          {/* Social Panel Bottom Sheet */}
          <div
            className={cn(
              'fixed inset-0 bg-black/50 z-[10000] transition-opacity duration-300',
              showSocialPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setShowSocialPanel(false)}
          />
          <div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[10001] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out',
              'h-[85vh] max-h-[85vh]',
              showSocialPanel ? 'translate-y-0' : 'translate-y-full'
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Sosial
              </h2>
              <button
                onClick={() => setShowSocialPanel(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Lukk"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="h-[calc(85vh-80px)] overflow-hidden">
              {showSocialPanel && <SocialPanel />}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

export function MobileNav(props: MobileNavProps) {
  return (
    <Suspense fallback={
      <button className="md:hidden p-2 -ml-2 text-white/80">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    }>
      <MobileNavContent {...props} />
    </Suspense>
  )
}
