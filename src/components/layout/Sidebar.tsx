'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Calendar, Newspaper } from 'lucide-react'

interface SidebarProps {
  currentCategory?: string
}

export function Sidebar({ currentCategory = '' }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentVisning = searchParams.get('visning') || ''
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

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
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold transition-colors',
              pathname === '/' && !currentVisning
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-800 hover:bg-blue-50 hover:text-blue-700'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-lg',
              pathname === '/' && !currentVisning
                ? 'bg-blue-100'
                : 'bg-gray-100'
            )}>
              <Newspaper className={cn(
                'w-5 h-5',
                pathname === '/' && !currentVisning
                  ? 'text-blue-600'
                  : 'text-gray-600'
              )} />
            </div>
            Aktivitet
          </Link>

          {/* Secondary links */}
          <Link
            href="/?visning=kalender"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              currentVisning === 'kalender'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            <Calendar className="w-4 h-4 text-red-500" />
            Kalender
          </Link>
        </div>

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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
              </li>
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-messages-panel'))}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* About section - compact */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Kommunikasjonsplattform for det samiske miljøet i Trondheim
        </p>
      </div>
    </aside>
  )
}
