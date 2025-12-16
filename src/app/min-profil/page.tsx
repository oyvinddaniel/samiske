'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MinProfilPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')
  const [highlightTab, setHighlightTab] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }
    checkAuth()
  }, [supabase, router])

  const handlePostSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleOpenSettings = useCallback(() => {
    // Switch to account tab
    setActiveTab('account')

    // Wait a bit for tab content to render
    setTimeout(() => {
      // Scroll to tabs section
      tabsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      // Trigger highlight animation
      setHighlightTab(true)

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightTab(false)
      }, 3000)
    }, 100)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!currentUserId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake
        </Button>

        {/* Profile header */}
        <ProfileHeader
          key={refreshKey}
          userId={currentUserId}
          showEditButton={true}
          showNewPostButton={true}
          onNewPost={() => setShowCreatePost(true)}
          onOpenSettings={handleOpenSettings}
        />

        {/* User's posts with tabs */}
        <div
          ref={tabsRef}
          className={`mt-6 transition-all duration-1000 ${
            highlightTab
              ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-2xl rounded-lg p-2'
              : ''
          }`}
        >
          <ProfileTabs
            key={refreshKey}
            profileId={currentUserId}
            isOwnProfile={true}
            value={activeTab}
            onValueChange={setActiveTab}
          />
        </div>

        {/* Create post sheet */}
        <CreatePostSheet
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostSuccess}
          userId={currentUserId}
        />
      </div>
    </div>
  )
}
