'use client'

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Newspaper, Calendar } from 'lucide-react'
import { SocialPanel } from '@/components/social/SocialPanel'

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
            <nav className="p-4">
              {/* Navigation links */}
              <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
                {/* Aktivitet - primary/dominant link */}
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
                      <Newspaper className={cn(
                        'w-5 h-5 transition-colors',
                        pathname === '/' && !currentVisning
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

              {/* Social section - only show when logged in */}
              {currentUserId && (
                <div className="space-y-1">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    Sosial
                  </h2>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowSocialPanel(true)
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
                      setShowSocialPanel(true)
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
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Det samiske miljøet i Trondheim
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
