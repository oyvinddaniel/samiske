'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface FloatingChatBubbleProps {
  userId: string
  onClose: () => void
}

/**
 * Floating chat bubble for one-on-one conversations
 * Appears in bottom-right corner, can be minimized/maximized
 */
export function FloatingChatBubble({ userId, onClose }: FloatingChatBubbleProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch other user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (data) setProfile(data)
    }
    fetchProfile()
  }, [supabase, userId])

  // Find or create conversation
  const findOrCreateConversation = useCallback(async () => {
    if (!currentUserId) return null

    // Use the get_or_create_conversation RPC
    const { data: convId, error } = await supabase
      .rpc('get_or_create_conversation', { other_user_id: userId })

    if (error) {
      console.error('Error getting/creating conversation:', error)
      return null
    }

    return convId
  }, [currentUserId, userId, supabase])

  // Fetch messages
  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    }

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

        // Dispatch messages-read event
        window.dispatchEvent(new Event('messages-read'))
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
      .channel(`floating-chat-${conversationId}`)
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

          // Mark as read if bubble is open
          if (!isMinimized && currentUserId) {
            supabase
              .from('conversation_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', currentUserId)

            window.dispatchEvent(new Event('messages-read'))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, isMinimized, currentUserId, supabase])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

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

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!mounted || !profile) return null

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden',
        'w-80 sm:w-96',
        'right-4 lg:right-6',
        'bottom-4 lg:bottom-6',
        isMinimized ? 'h-14' : 'h-[500px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-blue-50 to-white">
        <Avatar className="w-9 h-9 ring-2 ring-blue-100">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm text-gray-900 truncate">
            {profile.full_name || 'Ukjent bruker'}
          </h2>
          <p className="text-xs text-gray-500">
            {loading ? 'Laster...' : messages.length === 0 ? 'Ingen meldinger ennå' : `${messages.length} meldinger`}
          </p>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
          aria-label={isMinimized ? 'Maksimer' : 'Minimer'}
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
          aria-label="Lukk"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages - only show when not minimized */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <p>Ingen meldinger ennå</p>
                <p className="text-xs mt-1">Start samtalen med {profile.full_name}</p>
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
                      className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
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
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Skriv en melding..."
                className="flex-1 px-4 py-2 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all border border-transparent focus:border-blue-200"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}
