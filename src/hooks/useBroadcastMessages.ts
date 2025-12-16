'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BroadcastMessage } from '@/lib/types/broadcast'

export function useBroadcastMessages() {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  // Fetch unread broadcasts for current user
  const fetchUnreadBroadcasts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBroadcasts([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      // Use the helper function to get unread broadcasts
      const { data, error } = await supabase.rpc('get_unread_broadcasts', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Error fetching unread broadcasts:', error)
        return
      }

      const broadcastList = (data || []) as BroadcastMessage[]
      setBroadcasts(broadcastList)
      setUnreadCount(broadcastList.length)
    } catch (error) {
      console.error('Error in fetchUnreadBroadcasts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dismiss a broadcast message
  const dismissBroadcast = async (broadcastId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_broadcast_dismissals')
        .insert({
          user_id: user.id,
          broadcast_id: broadcastId
        })

      if (error) {
        console.error('Error dismissing broadcast:', error)
        return
      }

      // Update local state
      setBroadcasts(prev => prev.filter(b => b.id !== broadcastId))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error in dismissBroadcast:', error)
    }
  }

  // Subscribe to realtime updates on broadcast_messages
  useEffect(() => {
    fetchUnreadBroadcasts()

    const channel = supabase
      .channel('broadcast_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_messages'
        },
        () => {
          // Refetch when any change occurs to broadcast_messages
          fetchUnreadBroadcasts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  return {
    broadcasts,
    unreadCount,
    dismissBroadcast,
    loading,
    refetch: fetchUnreadBroadcasts
  }
}
