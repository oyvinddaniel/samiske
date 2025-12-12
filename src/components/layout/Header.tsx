'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'
import { MobileNav } from './MobileNav'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SocialPanel } from '@/components/social/SocialPanel'
import { Users, X, Search } from 'lucide-react'
import { SearchModal } from '@/components/search/SearchModal'
import { cn } from '@/lib/utils'

interface Profile {
  full_name: string | null
  avatar_url: string | null
  role: string
}

interface HeaderProps {
  currentCategory?: string
}

export function Header({ currentCategory }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSocialPanel, setShowSocialPanel] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [socialNotifications, setSocialNotifications] = useState(0)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // Create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        // First try getSession (faster, uses cached session)
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user

        if (!currentUser) {
          // Fallback to getUser
          const { data: { user: fetchedUser } } = await supabase.auth.getUser()
          setUser(fetchedUser)
          if (fetchedUser) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, role')
              .eq('id', fetchedUser.id)
              .single()
            setProfile(profileData)
          }
        } else {
          setUser(currentUser)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', currentUser.id)
            .single()
          setProfile(profileData)
        }
      } catch {
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch social notification counts
  const fetchNotificationCounts = useCallback(async () => {
    if (!user) {
      setSocialNotifications(0)
      return
    }

    try {
      const { count: pendingCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      const { data: unreadCount } = await supabase
        .rpc('get_unread_message_count', { user_id_param: user.id })

      setSocialNotifications((pendingCount || 0) + (unreadCount || 0))
    } catch {
      setSocialNotifications(0)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchNotificationCounts()
  }, [fetchNotificationCounts])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('header-social-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${user.id}` }, () => fetchNotificationCounts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchNotificationCounts())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchNotificationCounts])

  useEffect(() => {
    if (showSocialPanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showSocialPanel])

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Use hard reload to clear all client-side auth state
    window.location.href = '/'
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Mobile nav */}
        <div className="flex items-center gap-3 md:hidden">
          <MobileNav currentCategory={currentCategory} />
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md">
              <img
                src="/images/sami.jpg"
                alt="Samisk flagg"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-gray-900">samiske.no</span>
          </Link>
        </div>

        {/* Desktop title with gradient accent */}
        <div className="hidden md:flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-red-500 via-blue-500 to-green-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentCategory
                ? currentCategory === 'mote' ? 'Møte' : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)
                : 'Hjem'
              }
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search button */}
          <button
            ref={searchButtonRef}
            onClick={() => setShowSearch(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Søk (⌘K)"
          >
            <Search className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Social button - hidden on mobile as it's in BottomNav */}
              <button
                onClick={() => setShowSocialPanel(true)}
                className="hidden lg:flex relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Venner og meldinger"
              >
                <Users className="w-5 h-5" />
                {socialNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                    {socialNotifications > 9 ? '9+' : socialNotifications}
                  </span>
                )}
              </button>
              <NotificationBell userId={user.id} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none group">
                    <Avatar className="w-9 h-9 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                        {getInitials(profile?.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{profile?.full_name || 'Bruker'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profil" className="cursor-pointer">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Min profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/innstillinger" className="cursor-pointer">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Varsler
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logg ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium">
                  Logg inn
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium shadow-sm">
                  Registrer
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Social Panel - Bottom Sheet */}
      {mounted && createPortal(
        <>
          {/* Overlay */}
          <div
            className={cn(
              'hidden lg:block fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300',
              showSocialPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setShowSocialPanel(false)}
          />

          {/* Bottom Sheet */}
          <div
            className={cn(
              'hidden lg:flex fixed z-[9999] bg-white rounded-2xl shadow-2xl flex-col transition-all duration-300 ease-out',
              'w-96',
              'right-4',
              'bottom-20',
              'max-h-[60vh]',
              showSocialPanel ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Sosial
              </h2>
              <button
                onClick={() => setShowSocialPanel(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Lukk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 14rem)' }}>
              {showSocialPanel && <SocialPanel />}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Search Modal */}
      <SearchModal open={showSearch} onClose={() => setShowSearch(false)} anchorRef={searchButtonRef} />
    </header>
  )
}
