'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { ConversationView } from '@/components/messages/ConversationView'

interface Conversation {
  id: string
  otherUser: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  lastMessage: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
}

interface MessagesListPanelProps {
  onClose: () => void
  initialConversationUserId?: string
}

export function MessagesListPanel({ onClose, initialConversationUserId }: MessagesListPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])


  // Fetch conversations
  const fetchData = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)

    // Fetch conversations the user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversation:conversations (
          id,
          updated_at
        )
      `)
      .eq('user_id', currentUserId)

    if (!participations || participations.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const conversationIds = participations.map(p => p.conversation_id)

    // Get other participants for each conversation
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        user:profiles!conversation_participants_user_id_fkey (
          id, full_name, avatar_url
        )
      `)
      .in('conversation_id', conversationIds)
      .neq('user_id', currentUserId)

    // Get last message for each conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    // Build conversation list
    const convMap = new Map<string, Conversation>()

    participations.forEach(p => {
      const participant = allParticipants?.find(ap => ap.conversation_id === p.conversation_id)
      const userData = participant?.user
      const user = Array.isArray(userData) ? userData[0] : userData

      if (!user) return

      const lastMsg = messages?.find(m => m.conversation_id === p.conversation_id)

      // Count unread messages
      const unreadMsgs = messages?.filter(
        m => m.conversation_id === p.conversation_id &&
        m.sender_id !== currentUserId &&
        new Date(m.created_at) > new Date(p.last_read_at || 0)
      ) || []

      convMap.set(p.conversation_id, {
        id: p.conversation_id,
        otherUser: user as Conversation['otherUser'],
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          created_at: lastMsg.created_at,
          sender_id: lastMsg.sender_id
        } : null,
        unreadCount: unreadMsgs.length
      })
    })

    // Sort by last message time
    const sortedConversations = Array.from(convMap.values()).sort((a, b) => {
      const aTime = a.lastMessage?.created_at || '1970-01-01'
      const bTime = b.lastMessage?.created_at || '1970-01-01'
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    setConversations(sortedConversations)
    setLoading(false)
  }, [currentUserId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle initial conversation with specific user
  useEffect(() => {
    const startConversation = async () => {
      if (!initialConversationUserId || !currentUserId) return

      // Call the get_or_create_conversation function
      const { data: convId, error } = await supabase
        .rpc('get_or_create_conversation', { other_user_id: initialConversationUserId })

      if (error) {
        console.error('Error creating conversation:', error)
        return
      }

      // Open this conversation
      setSelectedConversationId(convId)

      // Refresh conversations list
      fetchData()
    }

    startConversation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationUserId, currentUserId, supabase]) // fetchData called directly, not in deps

  // Listen for messages-read event from ConversationView
  useEffect(() => {
    if (!currentUserId) return

    const handleMessagesRead = () => {
      console.log('📭 Messages marked as read, refreshing MessagesListPanel')
      fetchData()
    }

    window.addEventListener('messages-read', handleMessagesRead)

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]) // Intentionally not including fetchData to avoid re-subscribing

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('messages-list-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          console.log('💬 New message detected in MessagesListPanel')
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchData])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Nå'
    if (diffInMinutes < 60) return `${diffInMinutes} min`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} t`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'I går'
    if (diffInDays < 7) return `${diffInDays} d`
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
  }

  // If conversation is selected, show ConversationView
  if (selectedConversationId && currentUserId) {
    const selectedConv = conversations.find(c => c.id === selectedConversationId)

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
          <button
            onClick={() => {
              setSelectedConversationId(null)
              fetchData() // Refresh to update unread counts
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {selectedConv && (
            <>
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedConv.otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  {getInitials(selectedConv.otherUser.full_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedConv.otherUser.full_name || 'Ukjent'}
              </h2>
            </>
          )}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-hidden">
          <ConversationView
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    )
  }

  // Otherwise show conversations list
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <MessageCircle className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">Meldinger</h2>
        {conversations.filter(c => c.unreadCount > 0).length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {conversations.filter(c => c.unreadCount > 0).length} uleste
          </span>
        )}
      </div>

      {/* Conversations list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Ingen samtaler</p>
            <p className="text-sm text-gray-400">
              Start en samtale med en venn
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5 max-w-md">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`flex items-center gap-2 py-2 pl-4 pr-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all cursor-pointer ${
                conv.unreadCount > 0 ? 'border-blue-200 bg-blue-50/30' : ''
              }`}
              onClick={() => {
                setSelectedConversationId(conv.id)
              }}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {getInitials(conv.otherUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm text-gray-900 truncate ${
                    conv.unreadCount > 0 ? 'text-blue-900' : ''
                  }`}>
                    {conv.otherUser.full_name || 'Ukjent'}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {getTimeAgo(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className={`text-xs line-clamp-1 ${
                    conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                  }`}>
                    {conv.lastMessage.sender_id === currentUserId && (
                      <span className="text-gray-400">Du: </span>
                    )}
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
