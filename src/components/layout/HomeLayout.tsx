'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
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
import { PostDetailPanel } from '@/components/posts/PostDetailPanel'
import { CalendarView } from '@/components/calendar/CalendarView'
import { GroupsContent } from '@/app/grupper/GroupsContent'
import { FloatingChatBubble } from '@/components/social/FloatingChatBubble'

interface HomeLayoutProps {
  children: React.ReactNode
  currentCategory?: string
}

type ActivePanel = 'feed' | 'friends' | 'messages' | 'chat' | 'group' | 'community' | 'community-page' | 'profile' | 'geography' | 'bookmarks' | 'location' | 'post' | 'calendar' | 'groups'

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
  const router = useRouter()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [activePanel, setActivePanel] = useState<ActivePanel>('feed')
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationTarget | null>(null)
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null)
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState<string | null>(null)
  const [selectedCommunityTab, setSelectedCommunityTab] = useState<string | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [initialConversationUserId, setInitialConversationUserId] = useState<string | null>(null)
  const [floatingChatUserId, setFloatingChatUserId] = useState<string | null>(null)

  // Helper to update URL with panel state
  const updateURL = (panel: ActivePanel, params: Record<string, string> = {}) => {
    const query = new URLSearchParams()
    if (panel !== 'feed') {
      query.set('panel', panel)
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.set(key, value)
      })
    }
    const queryString = query.toString()
    router.push(pathname + (queryString ? '?' + queryString : ''), { scroll: false })
  }

  // Restore state from URL on mount and when URL changes
  useEffect(() => {
    const panel = searchParams.get('panel') as ActivePanel | null

    if (!panel || panel === 'feed') {
      setActivePanel('feed')
      return
    }

    setActivePanel(panel)

    // Restore panel-specific state from URL
    switch (panel) {
      case 'profile':
        setSelectedProfileUserId(searchParams.get('userId'))
        break
      case 'messages':
        setInitialConversationUserId(searchParams.get('userId'))
        break
      case 'location':
        const type = searchParams.get('type') as 'language_area' | 'municipality' | 'place' | null
        const id = searchParams.get('id')
        const name = searchParams.get('name')
        if (type && id && name) {
          setSelectedLocation({ type, id, name })
        }
        break
      case 'group':
        setSelectedGroupId(searchParams.get('groupId'))
        break
      case 'community-page':
        setSelectedCommunitySlug(searchParams.get('slug'))
        setSelectedCommunityTab(searchParams.get('tab'))
        break
      case 'post':
        setSelectedPostId(searchParams.get('postId'))
        break
      case 'calendar':
      case 'groups':
        // No additional state needed for these panels
        break
    }
  }, [searchParams])

  useEffect(() => {
    // Listen for mobile sidebar events
    const handleOpenLeftSidebar = () => setShowMobileSidebar(true)
    const handleCloseLeftSidebar = () => setShowMobileSidebar(false)

    // Listen for friends/messages panel events
    const handleOpenFriendsPanel = () => {
      updateURL('friends')
      setActivePanel('friends')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenMessagesPanel = () => {
      updateURL('messages')
      setActivePanel('messages')
      setInitialConversationUserId(null) // Clear any previous user
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleStartConversation = (e: CustomEvent<{ userId: string; mode?: 'panel' | 'bubble' }>) => {
      if (e.detail.mode === 'bubble') {
        // Open floating chat bubble
        setFloatingChatUserId(e.detail.userId)
      } else {
        // Open in messages panel (default)
        updateURL('messages', { userId: e.detail.userId })
        setInitialConversationUserId(e.detail.userId)
        setActivePanel('messages')
        window.dispatchEvent(new CustomEvent('close-left-sidebar'))
      }
    }

    // Listen for group/community panel events
    const handleOpenGroupPanel = (e: CustomEvent<{ groupId: string }>) => {
      updateURL('group', { groupId: e.detail.groupId })
      setSelectedGroupId(e.detail.groupId)
      setActivePanel('group')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenCommunityPanel = () => {
      updateURL('community')
      setActivePanel('community')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenCommunityPage = (e: CustomEvent<{ slug: string; tab?: string }>) => {
      updateURL('community-page', {
        slug: e.detail.slug,
        ...(e.detail.tab && { tab: e.detail.tab })
      })
      setSelectedCommunitySlug(e.detail.slug)
      setSelectedCommunityTab(e.detail.tab || null)
      setActivePanel('community-page')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenPostPanel = (e: CustomEvent<{ postId: string }>) => {
      updateURL('post', { postId: e.detail.postId })
      setSelectedPostId(e.detail.postId)
      setActivePanel('post')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenProfilePanel = () => {
      updateURL('profile')
      setSelectedProfileUserId(null) // View own profile
      setActivePanel('profile')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenUserProfilePanel = (e: CustomEvent<{ userId: string }>) => {
      updateURL('profile', { userId: e.detail.userId })
      setSelectedProfileUserId(e.detail.userId)
      setActivePanel('profile')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenGeographyPanel = () => {
      updateURL('geography')
      setActivePanel('geography')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenBookmarksPanel = () => {
      updateURL('bookmarks')
      setActivePanel('bookmarks')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenLocationPanel = (e: CustomEvent<LocationTarget>) => {
      updateURL('location', {
        type: e.detail.type,
        id: e.detail.id,
        name: e.detail.name
      })
      setSelectedLocation(e.detail)
      setActivePanel('location')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenCalendarPanel = () => {
      updateURL('calendar')
      setActivePanel('calendar')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }
    const handleOpenGroupsPanel = () => {
      updateURL('groups')
      setActivePanel('groups')
      window.dispatchEvent(new CustomEvent('close-left-sidebar'))
    }

    window.addEventListener('open-left-sidebar', handleOpenLeftSidebar)
    window.addEventListener('close-left-sidebar', handleCloseLeftSidebar)
    window.addEventListener('open-friends-panel', handleOpenFriendsPanel)
    window.addEventListener('open-messages-panel', handleOpenMessagesPanel)
    window.addEventListener('start-conversation-with-user', handleStartConversation as EventListener)
    window.addEventListener('open-group-panel', handleOpenGroupPanel as EventListener)
    window.addEventListener('open-community-panel', handleOpenCommunityPanel)
    window.addEventListener('open-community-page', handleOpenCommunityPage as EventListener)
    window.addEventListener('open-post-panel', handleOpenPostPanel as EventListener)
    window.addEventListener('open-profile-panel', handleOpenProfilePanel)
    window.addEventListener('open-user-profile-panel', handleOpenUserProfilePanel as EventListener)
    window.addEventListener('open-geography-panel', handleOpenGeographyPanel)
    window.addEventListener('open-bookmarks-panel', handleOpenBookmarksPanel)
    window.addEventListener('open-location-panel', handleOpenLocationPanel as EventListener)
    window.addEventListener('open-calendar-panel', handleOpenCalendarPanel)
    window.addEventListener('open-groups-panel', handleOpenGroupsPanel)

    return () => {
      window.removeEventListener('open-left-sidebar', handleOpenLeftSidebar)
      window.removeEventListener('close-left-sidebar', handleCloseLeftSidebar)
      window.removeEventListener('open-friends-panel', handleOpenFriendsPanel)
      window.removeEventListener('open-messages-panel', handleOpenMessagesPanel)
      window.removeEventListener('start-conversation-with-user', handleStartConversation as EventListener)
      window.removeEventListener('open-group-panel', handleOpenGroupPanel as EventListener)
      window.removeEventListener('open-community-panel', handleOpenCommunityPanel)
      window.removeEventListener('open-community-page', handleOpenCommunityPage as EventListener)
      window.removeEventListener('open-post-panel', handleOpenPostPanel as EventListener)
      window.removeEventListener('open-profile-panel', handleOpenProfilePanel)
      window.removeEventListener('open-user-profile-panel', handleOpenUserProfilePanel as EventListener)
      window.removeEventListener('open-geography-panel', handleOpenGeographyPanel)
      window.removeEventListener('open-bookmarks-panel', handleOpenBookmarksPanel)
      window.removeEventListener('open-location-panel', handleOpenLocationPanel as EventListener)
      window.removeEventListener('open-calendar-panel', handleOpenCalendarPanel)
      window.removeEventListener('open-groups-panel', handleOpenGroupsPanel)
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
          activePanel={activePanel === 'community-page' ? 'community' : activePanel === 'post' ? 'feed' : activePanel === 'calendar' || activePanel === 'groups' ? 'feed' : activePanel}
          selectedLocationId={selectedLocation?.id}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex gap-2 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6 pb-20 lg:pb-6">
            {/* Feed/Calendar/Friends/Messages/Chat column */}
            <main className="flex-1 max-w-2xl min-w-0">
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
                  onClose={() => {
                    setActivePanel('feed')
                    setInitialConversationUserId(null)
                  }}
                  initialConversationUserId={initialConversationUserId || undefined}
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
                  initialTab={selectedCommunityTab}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedCommunitySlug(null)
                    setSelectedCommunityTab(null)
                  }}
                />
              ) : activePanel === 'post' && selectedPostId ? (
                <PostDetailPanel
                  postId={selectedPostId}
                  onClose={() => {
                    setActivePanel('feed')
                    setSelectedPostId(null)
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
              ) : activePanel === 'calendar' ? (
                <CalendarView hideBackButton={true} />
              ) : activePanel === 'groups' ? (
                <GroupsContent />
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

      {/* Floating chat bubble */}
      {floatingChatUserId && (
        <FloatingChatBubble
          userId={floatingChatUserId}
          onClose={() => setFloatingChatUserId(null)}
        />
      )}
    </div>
  )
}
