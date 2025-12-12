'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Users, MessageCircle, ChevronRight, Calendar } from 'lucide-react'

const categories = [
  { name: 'Alle', slug: '', color: '#6B7280' },
  { name: 'Generelt', slug: 'generelt', color: '#6B7280' },
  { name: 'Arrangement', slug: 'arrangement', color: '#EF4444' },
  { name: 'Aktivitet', slug: 'aktivitet', color: '#3B82F6' },
  { name: 'Nyhet', slug: 'nyhet', color: '#10B981' },
  { name: 'Møte', slug: 'mote', color: '#F59E0B' },
  { name: 'Spørsmål', slug: 'sporsmal', color: '#8B5CF6' },
  { name: 'Kunngjøring', slug: 'kunngjoring', color: '#EC4899' },
]

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
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
            <img
              src="/images/sami.jpg"
              alt="Samisk flagg"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">samiske.no</h1>
            <p className="text-xs text-gray-500">Trondheim</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {/* Social section - only show when logged in */}
        {currentUserId && (
          <div className="mb-4 pb-4 border-b border-gray-100">
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

        {/* Quick links */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Snarveier
          </h2>
          <ul className="space-y-1">
            <li>
              <Link
                href="/?visning=kalender"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentVisning === 'kalender'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Calendar className="w-4 h-4 text-red-500" />
                Kalender
              </Link>
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Kategorier
          </h2>
          <ul className="space-y-1">
            {categories.map((category) => {
              const isActive = currentCategory === category.slug
              const href = category.slug ? `/?kategori=${category.slug}` : '/'

              return (
                <li key={category.slug}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* About section */}
      <div className="p-4 border-t border-gray-100 mt-[100px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md mx-auto">
            <img
              src="/images/sami.jpg"
              alt="Samisk flagg"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">samiske.no</h3>
            <p className="text-xs text-gray-500 mt-1">
              Kommunikasjonsplattform for det samiske miljøet i Trondheim
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              Et alternativ til Facebook der alle innlegg når frem
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
