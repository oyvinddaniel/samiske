'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Home, PlusCircle, User, LogIn } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function BottomNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const navItems = user ? [
    { href: '/', icon: Home, label: 'Hjem' },
    { href: '/ny', icon: PlusCircle, label: 'Ny' },
    { href: '/profil', icon: User, label: 'Profil' },
  ] : [
    { href: '/', icon: Home, label: 'Hjem' },
    { href: '/login', icon: LogIn, label: 'Logg inn' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === '/' && pathname === '/') ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 relative transition-colors',
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
    </nav>
  )
}
