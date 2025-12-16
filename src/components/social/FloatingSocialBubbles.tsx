'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { SocialPanel } from '@/components/social/SocialPanel'
import { Users, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloatingSocialBubbles() {
  const [showSocialPanel, setShowSocialPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'messages'>('messages')
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session?.user)
      setCurrentUserId(session?.user?.id || null)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
      setCurrentUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUserId) {
        setUnreadCount(0)
        return
      }

      const { data } = await supabase.rpc('get_unread_message_count', {
        user_id_param: currentUserId
      })
      setUnreadCount(data || 0)
    }

    fetchUnreadCount()

    // Listen for messages-read event
    const handleMessagesRead = () => {
      fetchUnreadCount()
    }
    window.addEventListener('messages-read', handleMessagesRead)

    // Subscribe to new messages
    if (currentUserId) {
      const channel = supabase
        .channel('floating-bubble-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, () => fetchUnreadCount())
        .subscribe()

      return () => {
        window.removeEventListener('messages-read', handleMessagesRead)
        supabase.removeChannel(channel)
      }
    }

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead)
    }
  }, [currentUserId, supabase])


  const togglePanel = (tab: 'friends' | 'messages') => {
    if (showSocialPanel && activeTab === tab) {
      setShowSocialPanel(false)
    } else {
      setActiveTab(tab)
      setShowSocialPanel(true)
    }
  }

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSocialPanel) {
        setShowSocialPanel(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSocialPanel])

  // Don't render anything if not logged in or not mounted
  if (!mounted || !isLoggedIn) return null

  return createPortal(
    <>
      {/* Floating panel */}
      <div
        className={cn(
          'fixed z-[9999] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden',
          'w-80 sm:w-96',
          'right-4',
          'bottom-36 lg:bottom-20',
          'h-[60vh]',
          showSocialPanel
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            {activeTab === 'friends' ? (
              <><Users className="w-5 h-5 text-blue-600" /> Venner</>
            ) : (
              <><MessageCircle className="w-5 h-5 text-green-600" /> Meldinger</>
            )}
          </h2>
          <button
            onClick={() => setShowSocialPanel(false)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showSocialPanel && <SocialPanel initialTab={activeTab} />}
        </div>
      </div>

      {/* Single floating bubble button - always visible */}
      <div className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-[9997]">
        {/* Chat bubble */}
        <button
          onClick={() => togglePanel('messages')}
          className={cn(
            'relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
            showSocialPanel
              ? 'bg-blue-700 text-white ring-2 ring-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
          aria-label="Chat"
        >
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </>,
    document.body
  )
}
