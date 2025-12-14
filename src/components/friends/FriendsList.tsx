'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCheck, UserX, MessageCircle, Users } from 'lucide-react'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

interface Friend {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface FriendshipWithProfile {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string
  profile: Friend
}

interface FriendsListProps {
  onStartConversation?: (userId: string) => void
}

export function FriendsList({ onStartConversation }: FriendsListProps) {
  const [friends, setFriends] = useState<FriendshipWithProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendshipWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  // Fetch friends and pending requests
  const fetchFriendships = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)

    // Fetch accepted friendships
    const { data: acceptedData } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    // Fetch pending requests (where I am the addressee)
    const { data: pendingData } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'pending')
      .eq('addressee_id', currentUserId)

    // Get profiles for friends
    if (acceptedData && acceptedData.length > 0) {
      const friendIds = acceptedData.map(f =>
        f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      )
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', friendIds)

      const friendsWithProfiles = acceptedData.map(friendship => {
        const friendId = friendship.requester_id === currentUserId
          ? friendship.addressee_id
          : friendship.requester_id
        const profile = profiles?.find(p => p.id === friendId) || {
          id: friendId,
          full_name: null,
          avatar_url: null
        }
        return { ...friendship, profile }
      })
      setFriends(friendsWithProfiles)
    } else {
      setFriends([])
    }

    // Get profiles for pending requests
    if (pendingData && pendingData.length > 0) {
      const requesterIds = pendingData.map(p => p.requester_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', requesterIds)

      const pendingWithProfiles = pendingData.map(request => {
        const profile = profiles?.find(p => p.id === request.requester_id) || {
          id: request.requester_id,
          full_name: null,
          avatar_url: null
        }
        return { ...request, profile }
      })
      setPendingRequests(pendingWithProfiles)
    } else {
      setPendingRequests([])
    }

    setLoading(false)
  }, [currentUserId, supabase])

  useEffect(() => {
     
    fetchFriendships()
  }, [fetchFriendships])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${currentUserId}`
        },
        () => {
          fetchFriendships()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `requester_id=eq.${currentUserId}`
        },
        () => {
          fetchFriendships()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchFriendships])

  const acceptRequest = async (requesterId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('addressee_id', currentUserId)

    fetchFriendships()
  }

  const declineRequest = async (requesterId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', requesterId)
      .eq('addressee_id', currentUserId)

    fetchFriendships()
  }

  const removeFriend = async (friendId: string) => {
    if (!confirm('Er du sikker på at du vil fjerne denne vennen?')) return

    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUserId})`)

    fetchFriendships()
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!currentUserId) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Logg inn for å se venner</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content - no tabs, show requests first then friends */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (pendingRequests.length === 0 && friends.length === 0) ? (
          <div className="p-6 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Ingen venner ennå</p>
            <p className="text-xs mt-1">Klikk på en profil for å legge til venner</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {/* Pending requests first */}
            {pendingRequests.map(request => (
              <li key={request.id} className="p-3 bg-orange-50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProfileId(request.profile.id)}
                    className="flex-shrink-0 relative"
                  >
                    {request.profile.avatar_url ? (
                      <img
                        src={request.profile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center ring-2 ring-orange-300">
                        <span className="text-orange-600 text-sm font-medium">
                          {getInitials(request.profile.full_name)}
                        </span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedProfileId(request.profile.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {request.profile.full_name || 'Ukjent'}
                    </p>
                    <p className="text-xs text-orange-600">Vil bli din venn</p>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => acceptRequest(request.requester_id)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Godta"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => declineRequest(request.requester_id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Avslå"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}

            {/* Accepted friends */}
            {friends.map(friendship => (
              <li key={friendship.id} className="p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProfileId(friendship.profile.id)}
                    className="flex-shrink-0"
                  >
                    {friendship.profile.avatar_url ? (
                      <img
                        src={friendship.profile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {getInitials(friendship.profile.full_name)}
                        </span>
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedProfileId(friendship.profile.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {friendship.profile.full_name || 'Ukjent'}
                    </p>
                  </button>

                  <div className="flex items-center gap-1">
                    {onStartConversation && (
                      <button
                        onClick={() => onStartConversation(friendship.profile.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Send melding"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFriend(friendship.profile.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Fjern venn"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Profile overlay */}
      {selectedProfileId && (
        <ProfileOverlay
          userId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          onStartConversation={onStartConversation}
        />
      )}
    </div>
  )
}
