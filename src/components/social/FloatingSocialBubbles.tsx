'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { SocialPanel } from '@/components/social/SocialPanel'
import { Users, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloatingSocialBubbles() {
  const [showSocialPanel, setShowSocialPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'messages'>('friends')
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session?.user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Listen for external open requests (from sidebar, etc.)
  useEffect(() => {
    const handleOpenFriends = () => {
      setActiveTab('friends')
      setShowSocialPanel(true)
    }
    const handleOpenMessages = () => {
      setActiveTab('messages')
      setShowSocialPanel(true)
    }

    window.addEventListener('open-friends-panel', handleOpenFriends)
    window.addEventListener('open-messages-panel', handleOpenMessages)

    return () => {
      window.removeEventListener('open-friends-panel', handleOpenFriends)
      window.removeEventListener('open-messages-panel', handleOpenMessages)
    }
  }, [])

  const togglePanel = (tab: 'friends' | 'messages') => {
    if (showSocialPanel && activeTab === tab) {
      setShowSocialPanel(false)
    } else {
      setActiveTab(tab)
      setShowSocialPanel(true)
    }
  }

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
          'max-h-[60vh]',
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

      {/* Two floating bubble buttons - always visible */}
      <div className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 flex flex-col gap-3 z-[9997]">
        {/* Messages bubble */}
        <button
          onClick={() => togglePanel('messages')}
          className={cn(
            'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
            showSocialPanel && activeTab === 'messages'
              ? 'bg-green-700 text-white ring-2 ring-green-400'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
          aria-label="Meldinger"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Friends bubble */}
        <button
          onClick={() => togglePanel('friends')}
          className={cn(
            'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
            showSocialPanel && activeTab === 'friends'
              ? 'bg-blue-700 text-white ring-2 ring-blue-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
          aria-label="Venner"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>
    </>,
    document.body
  )
}
