'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FriendsListPanel } from '@/components/social/FriendsListPanel'
import { MessagesListPanel } from '@/components/social/MessagesListPanel'
import { ChatPanel } from '@/components/social/ChatPanel'

interface HomeLayoutProps {
  children: React.ReactNode
  currentCategory?: string
}

type ActivePanel = 'feed' | 'friends' | 'messages' | 'chat'

interface ChatTarget {
  id: string
  name: string
}

export function HomeLayout({ children, currentCategory = '' }: HomeLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>('feed')
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null)

  // Reset to feed when navigating via sidebar links
  useEffect(() => {
    setActivePanel('feed')
    setChatTarget(null)
  }, [pathname, searchParams])

  useEffect(() => {
    // Listen for mobile sidebar events
    const handleOpenLeftSidebar = () => setShowMobileSidebar(true)
    const handleCloseLeftSidebar = () => setShowMobileSidebar(false)

    // Listen for friends/messages panel events
    const handleOpenFriendsPanel = () => {
      setActivePanel('friends')
      // Close mobile sidebar if open
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenMessagesPanel = () => {
      setActivePanel('messages')
      // Close mobile sidebar if open
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }

    window.addEventListener('open-left-sidebar', handleOpenLeftSidebar)
    window.addEventListener('close-left-sidebar', handleCloseLeftSidebar)
    window.addEventListener('open-friends-panel', handleOpenFriendsPanel)
    window.addEventListener('open-messages-panel', handleOpenMessagesPanel)

    return () => {
      window.removeEventListener('open-left-sidebar', handleOpenLeftSidebar)
      window.removeEventListener('close-left-sidebar', handleCloseLeftSidebar)
      window.removeEventListener('open-friends-panel', handleOpenFriendsPanel)
      window.removeEventListener('open-messages-panel', handleOpenMessagesPanel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width Header */}
      <Header currentCategory={currentCategory} />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar currentCategory={currentCategory} activePanel={activePanel} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex gap-6 p-4 md:p-6 pb-20 lg:pb-6">
            {/* Feed/Calendar/Friends/Messages/Chat column */}
            <main className="flex-1 max-w-2xl">
              {activePanel === 'friends' ? (
                <FriendsListPanel
                  onClose={() => setActivePanel('feed')}
                  onStartConversation={(friendId, friendName) => {
                    setChatTarget({ id: friendId, name: friendName })
                    setActivePanel('chat')
                  }}
                />
              ) : activePanel === 'messages' ? (
                <MessagesListPanel
                  onClose={() => setActivePanel('feed')}
                />
              ) : activePanel === 'chat' && chatTarget ? (
                <ChatPanel
                  friendId={chatTarget.id}
                  friendName={chatTarget.name}
                  onClose={() => {
                    setActivePanel('friends')
                    setChatTarget(null)
                  }}
                />
              ) : (
                children
              )}
            </main>

            {/* Right Sidebar */}
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
