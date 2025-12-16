'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { useDebouncedCallback } from '@/hooks/useDebounce'

interface RealtimeContextType {
  supabase: SupabaseClient
  user: User | null
  socialNotifications: number
  messageNotifications: number
  friendRequestsCount: number
  unreadMessagesCount: number
  refreshSocialNotifications: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser: User | null
}) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(initialUser)
  const [friendRequestsCount, setFriendRequestsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // Calculated totals
  const socialNotifications = friendRequestsCount + unreadMessagesCount
  const messageNotifications = unreadMessagesCount

  const refreshSocialNotifications = useCallback(async () => {
    if (!user) {
      setFriendRequestsCount(0)
      setUnreadMessagesCount(0)
      return
    }

    try {
      // Get pending friend requests count
      const { count: pendingCount } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', user.id)
        .eq('status', 'pending')

      setFriendRequestsCount(pendingCount || 0)

      // Get unread messages count
      const { data: unreadCount } = await supabase.rpc('get_unread_message_count', {
        user_id_param: user.id,
      })

      setUnreadMessagesCount(unreadCount || 0)
    } catch (error) {
      console.error('Error refreshing social notifications:', error)
      setFriendRequestsCount(0)
      setUnreadMessagesCount(0)
    }
  }, [user, supabase])

  const refreshNotifications = refreshSocialNotifications

  // Debounced refresh to prevent excessive database queries (reduced from 1000ms to 300ms)
  const debouncedRefresh = useDebouncedCallback(refreshSocialNotifications, 300)

  // Update last_seen_at when user is active
  const updateLastSeen = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating last_seen_at:', error)
    }
  }, [supabase])

  // Auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Update last_seen_at when user logs in or session refreshes
      if (session?.user) {
        updateLastSeen(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, updateLastSeen])

  // Periodic activity tracking (every 5 minutes while active)
  useEffect(() => {
    if (!user) return

    // Update immediately when component mounts with user
    updateLastSeen(user.id)

    // Update every 5 minutes while user has tab open
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateLastSeen(user.id)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, updateLastSeen])

  // Activity logging - log each page view
  const pathname = usePathname()
  useEffect(() => {
    if (!user) return

    const logActivity = async () => {
      try {
        await supabase.rpc('log_user_activity', {
          p_page_path: pathname,
          p_page_title: typeof document !== 'undefined' ? document.title : null,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        })
      } catch (error) {
        // Ignorer feil - aktivitetslogging skal ikke påvirke brukeropplevelsen
        console.debug('Activity log error:', error)
      }
    }

    logActivity()
  }, [pathname, user, supabase])

  // Refresh social notifications on user change
  useEffect(() => {
    refreshSocialNotifications()
  }, [refreshSocialNotifications])

  // Single shared Realtime subscription for social updates
  useEffect(() => {
    if (!user) return

    console.log('🔗 Setting up Realtime subscriptions for social updates')

    const channel = supabase
      .channel('global-social-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('👥 Friendship change detected:', payload.eventType)
          debouncedRefresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('👥 Friendship change detected (requester):', payload.eventType)
          debouncedRefresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('💬 New message detected:', payload.new)
          // Immediate refresh for new messages - no debounce
          refreshSocialNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📬 Conversation participant updated:', payload.new)
          debouncedRefresh()
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user, supabase, debouncedRefresh, refreshSocialNotifications])

  // Listen for messages-read event from ConversationView
  useEffect(() => {
    const handleMessagesRead = () => {
      console.log('📭 Messages marked as read, refreshing counts')
      // Immediate refresh - no debounce
      refreshSocialNotifications()
    }

    window.addEventListener('messages-read', handleMessagesRead)

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead)
    }
  }, [refreshSocialNotifications])

  return (
    <RealtimeContext.Provider
      value={{
        supabase,
        user,
        socialNotifications,
        messageNotifications,
        friendRequestsCount,
        unreadMessagesCount,
        refreshSocialNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

export function useRealtimeOptional() {
  return useContext(RealtimeContext)
}
