'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
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
import { BroadcastBadge } from '@/components/broadcast/BroadcastBadge'
import { ChangelogDropdown } from '@/components/changelog/ChangelogDropdown'
import { FeatureRequestDropdown } from '@/components/feature-requests/FeatureRequestDropdown'
import { SocialPanel } from '@/components/social/SocialPanel'
import { Users, X, Search, LogOut, User as UserIcon, Bell, Settings } from 'lucide-react'
import { UnifiedSearchBar } from '@/components/search/UnifiedSearchBar'
import { cn } from '@/lib/utils'
import { formatVersionString } from '@/lib/version'

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
  const [mounted, setMounted] = useState(false)

  // Create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user

        if (!currentUser) {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
    <header
      className="sticky top-0 z-50 shadow-lg"
      style={{
        background: 'radial-gradient(circle at 30% 50%, #DC2626 0%, transparent 40%), radial-gradient(circle at 35% 50%, #1942EA 0%, transparent 35%), linear-gradient(90deg, #1942EA 0%, #1942EA 100%)'
      }}
    >
      {/* Main row - Logo and Icons (+ Search on larger screens) */}
      <div className="flex items-center gap-4 px-4 md:px-6 h-14 min-[500px]:h-16">

        {/* Left: Mobile nav + Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <MobileNav currentCategory={currentCategory} />
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-bold text-white text-[22px]" style={{ fontFamily: 'var(--font-comme)' }}>samiske.no</span>
          </Link>
        </div>

        {/* Center: Integrated Search - hidden under 500px */}
        <div className="hidden min-[500px]:flex flex-1 max-w-xl mr-auto ml-0 md:ml-32">
          <UnifiedSearchBar />
        </div>

        {/* Right: Icons - Two groups */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto min-[500px]:ml-0">
          {loading ? (
            <div className="w-9 h-9 rounded-full bg-white/20 animate-pulse" />
          ) : user ? (
            <>
              {/* Group 1: Changelog + Feature Requests - with labels */}
              <div className="hidden sm:flex items-center gap-2 mr-5">
                <div className="flex flex-col items-center">
                  <ChangelogDropdown isAdmin={profile?.role === 'admin'} userId={user.id} />
                  <span className="text-[9px] text-white/60 mt-0.5">Nytt</span>
                </div>
                <div className="flex flex-col items-center">
                  <FeatureRequestDropdown />
                  <span className="text-[9px] text-white/60 mt-0.5">Foreslå</span>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-white/20 mr-5" />

              {/* Group 2: Social + Notifications + Avatar - no labels */}
              <div className="flex items-center gap-1">
                {/* Social button - desktop only */}
                <button
                  onClick={() => setShowSocialPanel(true)}
                  className="hidden lg:flex p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  title="Venner og meldinger"
                  aria-label="Åpne venner og meldinger"
                >
                  <Users className="w-5 h-5" />
                </button>

                {/* Notifications */}
                <NotificationBell userId={user.id} />

                {/* Broadcast */}
                <BroadcastBadge />

                {/* User avatar dropdown */}
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full" aria-label="Åpne brukermeny">
                    <Avatar className="w-9 h-9 ring-2 ring-white/30 hover:ring-white/60 transition-all">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-white/90 text-gray-800 text-sm font-semibold">
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
                  <DropdownMenuItem
                    onClick={() => window.dispatchEvent(new CustomEvent('open-profile-panel'))}
                    className="cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Min profil
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/innstillinger" className="cursor-pointer">
                      <Bell className="w-4 h-4 mr-2" />
                      Varsler
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logg ut
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400 font-mono">{formatVersionString()}</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium text-white hover:bg-white/20 hover:text-white">
                  Logg inn
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-white text-gray-900 hover:bg-white/90 font-medium shadow-sm">
                  Registrer
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Row - visible under 500px */}
      <div className="flex min-[500px]:hidden px-4 pb-3">
        <div className="w-full">
          <UnifiedSearchBar />
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
              'hidden lg:flex fixed z-[9999] bg-white rounded-2xl shadow-2xl flex-col transition-all duration-300 ease-out overflow-hidden',
              'w-96 right-4 bottom-20 h-[60vh]',
              showSocialPanel ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Sosial
              </h2>
              <button
                onClick={() => setShowSocialPanel(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Lukk sosial panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showSocialPanel && <SocialPanel />}
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  )
}
