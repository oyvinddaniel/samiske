'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Check, X, ArrowLeft, MessageCircle } from 'lucide-react'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

interface Friend {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface PendingRequest {
  id: string
  requester: Friend
  created_at: string
}

interface FriendsListPanelProps {
  onClose: () => void
  onOpenMessages?: () => void
}

export function FriendsListPanel({ onClose, onOpenMessages }: FriendsListPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
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
          id, full_name, avatar_url, bio
        ),
        addressee:profiles!friendships_addressee_id_fkey (
          id, full_name, avatar_url, bio
        )
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    if (friendships) {
      const friendList: Friend[] = friendships.map(f => {
        const friend = f.requester_id === currentUserId
          ? (Array.isArray(f.addressee) ? f.addressee[0] : f.addressee)
          : (Array.isArray(f.requester) ? f.requester[0] : f.requester)
        return friend as Friend
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
          id, full_name, avatar_url, bio
        )
      `)
      .eq('addressee_id', currentUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pending) {
      const requests: PendingRequest[] = pending.map(p => ({
        id: p.id,
        requester: (Array.isArray(p.requester) ? p.requester[0] : p.requester) as Friend,
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

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Tilbake til feed</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
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
        <div className="space-y-2">
          {friends.map(friend => (
            <Card key={friend.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedUserId(friend.id)}>
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {getInitials(friend.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedUserId(friend.id)}
                      className="font-semibold text-gray-900 hover:text-blue-600 text-left block"
                    >
                      {friend.full_name || 'Ukjent'}
                    </button>
                    {friend.bio && (
                      <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                        {friend.bio}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => {
                      // Open messages with this friend
                      if (onOpenMessages) {
                        onOpenMessages()
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Melding
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
