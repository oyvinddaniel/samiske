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
import { GroupFeedView } from '@/components/groups/GroupFeedView'
import { CommunityFeedView, CommunityPageView } from '@/components/communities'
import { ProfileFeedView } from '@/components/profile/ProfileFeedView'
import { GeographyExplorerView, GeographyDetailView } from '@/components/geography'
import { BookmarksPanel } from '@/components/bookmarks/BookmarksPanel'

interface HomeLayoutProps {
  children: React.ReactNode
  currentCategory?: string
}

type ActivePanel = 'feed' | 'friends' | 'messages' | 'chat' | 'group' | 'community' | 'community-page' | 'profile' | 'geography' | 'bookmarks' | 'location'

interface ChatTarget {
  id: string
  name: string
}

interface LocationTarget {
  type: 'language_area' | 'municipality' | 'place'
  id: string
  name: string
}

export function HomeLayout({ children, currentCategory = '' }: HomeLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>('feed')
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationTarget | null>(null)
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null)
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null)

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

    // Listen for group/community panel events
    const handleOpenGroupPanel = (e: CustomEvent<{ groupId: string }>) => {
      setSelectedGroupId(e.detail.groupId)
      setActivePanel('group')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenCommunityPanel = () => {
      setActivePanel('community')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenCommunityPage = (e: CustomEvent<{ slug: string }>) => {
      setSelectedCommunitySlug(e.detail.slug)
      setActivePanel('community-page')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenProfilePanel = () => {
      setSelectedProfileUserId(null) // View own profile
      setActivePanel('profile')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenUserProfilePanel = (e: CustomEvent<{ userId: string }>) => {
      setSelectedProfileUserId(e.detail.userId)
      setActivePanel('profile')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenGeographyPanel = () => {
      setActivePanel('geography')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenBookmarksPanel = () => {
      setActivePanel('bookmarks')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenLocationPanel = (e: CustomEvent<LocationTarget>) => {
      setSelectedLocation(e.detail)
      setActivePanel('location')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }

    window.addEventListener('open-left-sidebar', handleOpenLeftSidebar)
    window.addEventListener('close-left-sidebar', handleCloseLeftSidebar)
    window.addEventListener('open-friends-panel', handleOpenFriendsPanel)
    window.addEventListener('open-messages-panel', handleOpenMessagesPanel)
    window.addEventListener('open-group-panel', handleOpenGroupPanel as EventListener)
    window.addEventListener('open-community-panel', handleOpenCommunityPanel)
    window.addEventListener('open-community-page', handleOpenCommunityPage as EventListener)
    window.addEventListener('open-profile-panel', handleOpenProfilePanel)
    window.addEventListener('open-user-profile-panel', handleOpenUserProfilePanel as EventListener)
    window.addEventListener('open-geography-panel', handleOpenGeographyPanel)
    window.addEventListener('open-bookmarks-panel', handleOpenBookmarksPanel)
    window.addEventListener('open-location-panel', handleOpenLocationPanel as EventListener)

    return () => {
      window.removeEventListener('open-left-sidebar', handleOpenLeftSidebar)
      window.removeEventListener('close-left-sidebar', handleCloseLeftSidebar)
      window.removeEventListener('open-friends-panel', handleOpenFriendsPanel)
      window.removeEventListener('open-messages-panel', handleOpenMessagesPanel)
      window.removeEventListener('open-group-panel', handleOpenGroupPanel as EventListener)
      window.removeEventListener('open-community-panel', handleOpenCommunityPanel)
      window.removeEventListener('open-community-page', handleOpenCommunityPage as EventListener)
      window.removeEventListener('open-profile-panel', handleOpenProfilePanel)
      window.removeEventListener('open-user-profile-panel', handleOpenUserProfilePanel as EventListener)
      window.removeEventListener('open-geography-panel', handleOpenGeographyPanel)
      window.removeEventListener('open-bookmarks-panel', handleOpenBookmarksPanel)
      window.removeEventListener('open-location-panel', handleOpenLocationPanel as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width Header */}
      <Header currentCategory={currentCategory} />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          currentCategory={currentCategory}
          activePanel={activePanel === 'community-page' ? 'community' : activePanel}
          selectedLocationId={selectedLocation?.id}
        />

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
              ) : activePanel === 'group' && selectedGroupId ? (
                <GroupFeedView
                  groupId={selectedGroupId}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedGroupId(null)
                  }}
                />
              ) : activePanel === 'community' ? (
                <CommunityFeedView
                  onClose={() => setActivePanel('feed')}
                />
              ) : activePanel === 'community-page' && selectedCommunitySlug ? (
                <CommunityPageView
                  slug={selectedCommunitySlug}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedCommunitySlug(null)
                  }}
                />
              ) : activePanel === 'profile' ? (
                <ProfileFeedView
                  userId={selectedProfileUserId}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedProfileUserId(null)
                  }}
                />
              ) : activePanel === 'geography' ? (
                <GeographyExplorerView
                  onClose={() => setActivePanel('feed')}
                />
              ) : activePanel === 'bookmarks' ? (
                <BookmarksPanel
                  onClose={() => setActivePanel('feed')}
                />
              ) : activePanel === 'location' && selectedLocation ? (
                <GeographyDetailView
                  entityType={selectedLocation.type}
                  entityId={selectedLocation.id}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedLocation(null)
                  }}
                  onNavigate={(type, id) => {
                    setSelectedLocation({ type, id, name: '' })
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
