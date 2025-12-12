'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Home, PlusCircle, User, LogIn, Menu, BarChart3 } from 'lucide-react'
import { NewPostSheet } from '@/components/posts/NewPostSheet'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function BottomNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showNewPostSheet, setShowNewPostSheet] = useState(false)
  const pathname = usePathname()

  // Create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const getUser = async () => {
      try {
        // First try getSession (faster, uses cached session)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          return
        }

        // Fallback to getUser
        const { data: { user: fetchedUser } } = await supabase.auth.getUser()
        setUser(fetchedUser)
      } catch {
        setUser(null)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const openLeftSidebar = () => {
    window.dispatchEvent(new CustomEvent('open-left-sidebar'))
  }

  const openRightSidebar = () => {
    window.dispatchEvent(new CustomEvent('open-right-sidebar'))
  }

  const openNewPostSheet = () => {
    setShowNewPostSheet(true)
  }

  const navItems = user ? [
    { href: '/', icon: Home, label: 'Hjem', action: null },
    { href: null, icon: PlusCircle, label: 'Ny', action: openNewPostSheet },
    { href: '/profil', icon: User, label: 'Profil', action: null },
  ] : [
    { href: '/', icon: Home, label: 'Hjem', action: null },
    { href: '/login', icon: LogIn, label: 'Logg inn', action: null },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-between h-16 px-1">
        {/* Left menu button */}
        <button
          onClick={openLeftSidebar}
          className="flex flex-col items-center justify-center w-14 h-full py-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Meny</span>
        </button>

        {/* Center navigation items */}
        <div className="flex items-center justify-center flex-1">
          {navItems.map((item, index) => {
            const isActive = item.href && (pathname === item.href ||
              (item.href === '/' && pathname === '/') ||
              (item.href !== '/' && pathname.startsWith(item.href)))
            const Icon = item.icon

            // If item has an action, render as button
            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center w-16 h-full py-2 transition-colors text-gray-500 hover:text-gray-900"
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] mt-1 font-medium">
                    {item.label}
                  </span>
                </button>
              )
            }

            // Otherwise render as link
            return (
              <Link
                key={item.href || index}
                href={item.href || '/'}
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-full py-2 transition-colors',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'w-6 h-6',
                  isActive && 'stroke-[2.5]'
                )} />
                <span className={cn(
                  'text-[10px] mt-1 font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Right menu button */}
        <button
          onClick={openRightSidebar}
          className="flex flex-col items-center justify-center w-14 h-full py-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] mt-1 font-medium">Info</span>
        </button>
      </div>

      {/* New Post Sheet */}
      <NewPostSheet
        open={showNewPostSheet}
        onClose={() => setShowNewPostSheet(false)}
      />
    </nav>
  )
}
