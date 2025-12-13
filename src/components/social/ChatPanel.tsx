'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface ChatPanelProps {
  friendId: string
  friendName: string
  onClose: () => void
}

export function ChatPanel({ friendId, friendName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [friendProfile, setFriendProfile] = useState<{ avatar_url: string | null } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch friend profile
  useEffect(() => {
    const fetchFriend = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', friendId)
        .single()

      if (data) setFriendProfile(data)
    }
    fetchFriend()
  }, [supabase, friendId])

  // Find or create conversation
  const findOrCreateConversation = useCallback(async () => {
    if (!currentUserId) return null

    // Find existing conversation between these two users
    const { data: existingParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)

    if (existingParticipations && existingParticipations.length > 0) {
      const convIds = existingParticipations.map(p => p.conversation_id)

      // Check if friend is in any of these conversations
      const { data: friendParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', friendId)
        .in('conversation_id', convIds)

      if (friendParticipations && friendParticipations.length > 0) {
        // Found existing conversation
        return friendParticipations[0].conversation_id
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single()

    if (convError || !newConv) {
      console.error('Failed to create conversation:', convError)
      return null
    }

    // Add both participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: currentUserId },
        { conversation_id: newConv.id, user_id: friendId }
      ])

    return newConv.id
  }, [currentUserId, friendId, supabase])

  // Fetch messages
  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    setLoading(false)
  }, [supabase])

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      if (!currentUserId) return

      const convId = await findOrCreateConversation()
      if (convId) {
        setConversationId(convId)
        await fetchMessages(convId)

        // Mark as read
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', convId)
          .eq('user_id', currentUserId)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [currentUserId, findOrCreateConversation, fetchMessages, supabase])

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content
      })

    if (error) {
      console.error('Failed to send message:', error)
      setNewMessage(content) // Restore message on error
    }

    setSending(false)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarImage src={friendProfile?.avatar_url || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">
            {getInitials(friendName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm text-gray-900 truncate">{friendName}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs">
            <p>Start samtalen med {friendName}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] px-2.5 py-1.5 rounded-xl ${
                    isMe
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-2 border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv en melding..."
            className="flex-1 px-3 py-1.5 bg-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
