'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FriendsList } from '@/components/friends/FriendsList'
import { MessagesPanel } from '@/components/messages/MessagesPanel'
import { Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialPanelProps {
  initialTab?: 'friends' | 'messages'
  initialConversationUserId?: string
}

export function SocialPanel({ initialTab = 'friends', initialConversationUserId }: SocialPanelProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'messages'>(initialTab)
  const [conversationUserId, setConversationUserId] = useState<string | undefined>(initialConversationUserId)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    if (!currentUserId) return

    // Pending friend requests
    const { count: pendingCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('addressee_id', currentUserId)
      .eq('status', 'pending')

    setPendingRequests(pendingCount || 0)

    // Unread messages (using the helper function)
    const { data: unreadCount } = await supabase
      .rpc('get_unread_message_count', { user_id_param: currentUserId })

    setUnreadMessages(unreadCount || 0)
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('social-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${currentUserId}`
        },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchCounts])

  // Listen for messages-read event from ConversationView
  useEffect(() => {
    if (!currentUserId) return

    const handleMessagesRead = () => {
      fetchCounts()
    }

    window.addEventListener('messages-read', handleMessagesRead)

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]) // Intentionally not including fetchCounts to avoid re-subscribing

  // Handle starting a conversation from friends list
  const handleStartConversation = (userId: string) => {
    setConversationUserId(userId)
    setActiveTab('messages')
  }

  // Switch tab when initial props change
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
    if (initialConversationUserId) {
      setConversationUserId(initialConversationUserId)
      setActiveTab('messages')
    }
  }, [initialTab, initialConversationUserId])

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative',
            activeTab === 'friends'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Users className="w-4 h-4" />
          Venner
          {pendingRequests > 0 && (
            <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {pendingRequests}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('messages')
            setConversationUserId(undefined)
          }}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative',
            activeTab === 'messages'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Meldinger
          {unreadMessages > 0 && (
            <span className="absolute top-2 right-1/4 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'friends' ? (
          <FriendsList onStartConversation={handleStartConversation} />
        ) : (
          <MessagesPanel
            initialConversationUserId={conversationUserId}
            onConversationSelect={() => setConversationUserId(undefined)}
          />
        )}
      </div>
    </div>
  )
}
