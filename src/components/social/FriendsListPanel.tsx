'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Check, X, ArrowLeft, MessageCircle, Phone, UserMinus } from 'lucide-react'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

interface Friend {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone_number: string | null
  friendshipId: string
}

interface PendingRequest {
  id: string
  requester: Omit<Friend, 'friendshipId'>
  created_at: string
}

interface FriendsListPanelProps {
  onClose: () => void
  onStartConversation?: (friendId: string, friendName: string) => void
}

export function FriendsListPanel({ onClose, onStartConversation }: FriendsListPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Friend | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch friends and pending requests
  const fetchData = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)

    // Fetch accepted friendships
    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        id,
        requester_id,
        addressee_id,
        requester:profiles!friendships_requester_id_fkey (
          id, full_name, avatar_url, bio, phone_number
        ),
        addressee:profiles!friendships_addressee_id_fkey (
          id, full_name, avatar_url, bio, phone_number
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (friendships) {
      const friendList: Friend[] = friendships.map(f => {
        const friendData = f.requester_id === currentUserId
          ? (Array.isArray(f.addressee) ? f.addressee[0] : f.addressee)
          : (Array.isArray(f.requester) ? f.requester[0] : f.requester)
        return {
          ...friendData,
          friendshipId: f.id
        } as Friend
      })
      setFriends(friendList)
    }

    // Fetch pending requests (received)
    const { data: pending } = await supabase
      .from('friendships')
      .select(`
        id,
        created_at,
        requester:profiles!friendships_requester_id_fkey (
          id, full_name, avatar_url, bio, phone_number
        )
      `)
      .eq('addressee_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pending) {
      const requests: PendingRequest[] = pending.map(p => ({
        id: p.id,
        requester: (Array.isArray(p.requester) ? p.requester[0] : p.requester) as Omit<Friend, 'friendshipId'>,
        created_at: p.created_at
      }))
      setPendingRequests(requests)
    }

    setLoading(false)
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Accept friend request
  const acceptRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    fetchData()
  }

  // Decline friend request
  const declineRequest = async (requestId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)

    fetchData()
  }

  // Remove friend
  const removeFriend = async (friend: Friend) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friend.friendshipId)

    setConfirmRemove(null)
    fetchData()
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Users className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-bold text-gray-900">Venner</h2>
        <span className="text-sm text-gray-500">({friends.length})</span>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Venneforespørsler ({pendingRequests.length})
            </h3>
            <div className="space-y-2">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-100"
                >
                  <button onClick={() => setSelectedUserId(request.requester.id)}>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.requester.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(request.requester.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedUserId(request.requester.id)}
                      className="font-medium text-gray-900 hover:text-blue-600 text-left"
                    >
                      {request.requester.full_name || 'Ukjent'}
                    </button>
                    <p className="text-xs text-gray-500">Vil bli din venn</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => acceptRequest(request.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => declineRequest(request.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : friends.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Ingen venner ennå</p>
            <p className="text-sm text-gray-400">
              Søk etter brukere for å legge til venner
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 max-w-md">
          {friends.map(friend => (
            <div
              key={friend.id}
              className="flex items-center gap-2 py-2 pl-4 pr-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
            >
              <button onClick={() => setSelectedUserId(friend.id)} className="flex-shrink-0">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {getInitials(friend.full_name)}
                  </AvatarFallback>
                </Avatar>
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setSelectedUserId(friend.id)}
                  className="font-medium text-gray-900 hover:text-blue-600 text-sm text-left block truncate"
                >
                  {friend.full_name || 'Ukjent'}
                </button>
              </div>

              {/* Phone */}
              {friend.phone_number ? (
                <a
                  href={`tel:${friend.phone_number}`}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{friend.phone_number}</span>
                </a>
              ) : (
                <div className="flex items-center text-gray-300">
                  <Phone className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Message button - starts conversation with this friend */}
              <button
                onClick={() => {
                  if (onStartConversation) {
                    onStartConversation(friend.id, friend.full_name || 'Ukjent')
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Melding</span>
              </button>

              {/* Remove friend button - discreet */}
              <button
                onClick={() => setConfirmRemove(friend)}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Fjern venn"
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm remove friend popup */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fjern venn</h3>
                <p className="text-sm text-gray-500">
                  Vil du fjerne {confirmRemove.full_name} som venn?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => removeFriend(confirmRemove)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Fjern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Overlay */}
      {selectedUserId && (
        <ProfileOverlay
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
