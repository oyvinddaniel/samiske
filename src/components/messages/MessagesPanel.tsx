'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import { ConversationView } from './ConversationView'

interface Participant {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface ConversationWithDetails {
  id: string
  updated_at: string
  participant: Participant
  last_message: string | null
  unread_count: number
}

interface MessagesPanelProps {
  initialConversationUserId?: string
  onConversationSelect?: (conversationId: string | null) => void
}

export function MessagesPanel({ initialConversationUserId, onConversationSelect }: MessagesPanelProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  // Fetch conversations - optimized with batch queries
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)

    try {
      // Get all conversation IDs for current user
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', currentUserId)

      if (!participations || participations.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      const conversationIds = participations.map(p => p.conversation_id)
      const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]))

      // Batch fetch: Get all other participants at once
      const { data: otherParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', currentUserId)

      if (!otherParticipants || otherParticipants.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Create map of conversation_id -> other_user_id
      const convToUserMap = new Map(otherParticipants.map(p => [p.conversation_id, p.user_id]))

      // Batch fetch: Get all profiles at once
      const otherUserIds = [...new Set(otherParticipants.map(p => p.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', otherUserIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Batch fetch: Get last message for each conversation using RPC or individual queries
      // For now, we'll do this in parallel with Promise.all
      const messagePromises = conversationIds.map(convId =>
        supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      )

      const messageResults = await Promise.all(messagePromises)
      const lastMessageMap = new Map(
        conversationIds.map((convId, i) => [convId, messageResults[i].data])
      )

      // Batch fetch: Count unread messages in parallel
      const unreadPromises = conversationIds.map(convId => {
        const lastReadAt = lastReadMap.get(convId)
        return supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', currentUserId)
          .gt('created_at', lastReadAt || '1970-01-01')
      })

      const unreadResults = await Promise.all(unreadPromises)
      const unreadMap = new Map(
        conversationIds.map((convId, i) => [convId, unreadResults[i].count || 0])
      )

      // Build conversations list
      const conversationsWithDetails: ConversationWithDetails[] = conversationIds
        .map(convId => {
          const otherUserId = convToUserMap.get(convId)
          if (!otherUserId) return null

          const profile = profileMap.get(otherUserId)
          const lastMessage = lastMessageMap.get(convId)

          return {
            id: convId,
            updated_at: lastMessage?.created_at || new Date().toISOString(),
            participant: profile || { id: otherUserId, full_name: null, avatar_url: null },
            last_message: lastMessage?.content || null,
            unread_count: unreadMap.get(convId) || 0
          }
        })
        .filter((c): c is ConversationWithDetails => c !== null)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }

    setLoading(false)
  }, [currentUserId, supabase])

  useEffect(() => {
     
    fetchConversations()
  }, [fetchConversations])

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

      // Fetch the participant profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', initialConversationUserId)
        .single()

      setSelectedConversation({
        id: convId,
        updated_at: new Date().toISOString(),
        participant: profile || { id: initialConversationUserId, full_name: null, avatar_url: null },
        last_message: null,
        unread_count: 0
      })

      // Refresh conversations list
      fetchConversations()
    }

    startConversation()
  }, [initialConversationUserId, currentUserId, supabase, fetchConversations])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, fetchConversations])

  const handleSelectConversation = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation)
    onConversationSelect?.(conversation.id)
  }

  const handleBack = () => {
    setSelectedConversation(null)
    onConversationSelect?.(null)
    fetchConversations() // Refresh to update unread counts
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'I går'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('nb-NO', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
    }
  }

  if (!currentUserId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Logg inn for å se meldinger</p>
      </div>
    )
  }

  // Show conversation view if selected
  if (selectedConversation) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-gray-200">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {selectedConversation.participant.avatar_url ? (
            <img
              src={selectedConversation.participant.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xs font-medium">
                {getInitials(selectedConversation.participant.full_name)}
              </span>
            </div>
          )}
          <span className="font-medium text-gray-900">
            {selectedConversation.participant.full_name || 'Ukjent'}
          </span>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-hidden">
          <ConversationView
            conversationId={selectedConversation.id}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    )
  }

  // Show conversations list
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Meldinger</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
                  <div className="w-40 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Ingen meldinger ennå</p>
            <p className="text-sm mt-1">Send en melding til en venn for å starte</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map(conversation => (
              <li key={conversation.id}>
                <button
                  onClick={() => handleSelectConversation(conversation)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {conversation.participant.avatar_url ? (
                    <img
                      src={conversation.participant.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium">
                        {getInitials(conversation.participant.full_name)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.participant.full_name || 'Ukjent'}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(conversation.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message || 'Ingen meldinger'}
                    </p>
                  </div>

                  {conversation.unread_count > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      {conversation.unread_count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
