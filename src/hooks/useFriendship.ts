import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'

interface UseFriendshipOptions {
  targetUserId: string
  currentUserId: string | null
  enabled?: boolean
}

interface UseFriendshipReturn {
  friendshipStatus: FriendshipStatus
  isLoading: boolean
  isMutating: boolean
  sendFriendRequest: () => Promise<void>
  acceptFriendRequest: () => Promise<void>
  declineFriendRequest: () => Promise<void>
  removeFriendship: () => Promise<void>
  error: string | null
}

/**
 * Reusable hook for managing friendship state and actions
 *
 * @example
 * ```tsx
 * const { friendshipStatus, sendFriendRequest, isLoading } = useFriendship({
 *   targetUserId: 'user-123',
 *   currentUserId: currentUser?.id || null
 * })
 * ```
 */
export function useFriendship({
  targetUserId,
  currentUserId,
  enabled = true
}: UseFriendshipOptions): UseFriendshipReturn {
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Fetch friendship status
  const fetchFriendshipStatus = useCallback(async () => {
    // Don't fetch if disabled, no current user, or viewing own profile
    if (!enabled || !currentUserId || currentUserId === targetUserId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data: friendships, error: fetchError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)

      if (fetchError) {
        console.error('Error fetching friendship status:', fetchError)
        setError('Kunne ikke hente vennestatus')
        setFriendshipStatus('none')
        return
      }

      if (friendships && friendships.length > 0) {
        const friendship = friendships[0]
        if (friendship.status === 'blocked') {
          setFriendshipStatus('blocked')
        } else if (friendship.status === 'accepted') {
          setFriendshipStatus('accepted')
        } else if (friendship.status === 'pending') {
          if (friendship.requester_id === currentUserId) {
            setFriendshipStatus('pending_sent')
          } else {
            setFriendshipStatus('pending_received')
          }
        }
      } else {
        setFriendshipStatus('none')
      }
    } catch (err) {
      console.error('Unexpected error in friendship status:', err)
      setError('Uventet feil ved henting av vennestatus')
      setFriendshipStatus('none')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, currentUserId, targetUserId, supabase])

  // Initial fetch
  useEffect(() => {
    fetchFriendshipStatus()
  }, [fetchFriendshipStatus])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!enabled || !currentUserId || currentUserId === targetUserId) return

    const channel = supabase
      .channel(`friendships:${currentUserId}:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `or(and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId}))`
        },
        () => {
          fetchFriendshipStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, currentUserId, targetUserId, supabase, fetchFriendshipStatus])

  // Send friend request
  const sendFriendRequest = useCallback(async () => {
    if (!currentUserId) return

    setIsMutating(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          requester_id: currentUserId,
          addressee_id: targetUserId,
          status: 'pending'
        })

      if (insertError) {
        console.error('Error sending friend request:', insertError)
        setError('Kunne ikke sende venneforespørsel')
      } else {
        setFriendshipStatus('pending_sent')
      }
    } catch (err) {
      console.error('Unexpected error sending friend request:', err)
      setError('Uventet feil ved sending av venneforespørsel')
    } finally {
      setIsMutating(false)
    }
  }, [currentUserId, targetUserId, supabase])

  // Accept friend request
  const acceptFriendRequest = useCallback(async () => {
    if (!currentUserId) return

    setIsMutating(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', targetUserId)
        .eq('addressee_id', currentUserId)

      if (updateError) {
        console.error('Error accepting friend request:', updateError)
        setError('Kunne ikke godta venneforespørsel')
      } else {
        setFriendshipStatus('accepted')
      }
    } catch (err) {
      console.error('Unexpected error accepting friend request:', err)
      setError('Uventet feil ved godtakelse av venneforespørsel')
    } finally {
      setIsMutating(false)
    }
  }, [currentUserId, targetUserId, supabase])

  // Decline friend request
  const declineFriendRequest = useCallback(async () => {
    if (!currentUserId) return

    setIsMutating(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', targetUserId)
        .eq('addressee_id', currentUserId)

      if (deleteError) {
        console.error('Error declining friend request:', deleteError)
        setError('Kunne ikke avslå venneforespørsel')
      } else {
        setFriendshipStatus('none')
      }
    } catch (err) {
      console.error('Unexpected error declining friend request:', err)
      setError('Uventet feil ved avslåing av venneforespørsel')
    } finally {
      setIsMutating(false)
    }
  }, [currentUserId, targetUserId, supabase])

  // Remove friendship (cancel request or unfriend)
  const removeFriendship = useCallback(async () => {
    if (!currentUserId) return

    setIsMutating(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)

      if (deleteError) {
        console.error('Error removing friendship:', deleteError)
        setError('Kunne ikke fjerne vennskap')
      } else {
        setFriendshipStatus('none')
      }
    } catch (err) {
      console.error('Unexpected error removing friendship:', err)
      setError('Uventet feil ved fjerning av vennskap')
    } finally {
      setIsMutating(false)
    }
  }, [currentUserId, targetUserId, supabase])

  return {
    friendshipStatus,
    isLoading,
    isMutating,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriendship,
    error
  }
}
