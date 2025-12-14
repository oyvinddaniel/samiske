'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { UserProfileTabs } from '@/components/profile/UserProfileTabs'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ProfileFeedViewProps {
  userId?: string | null
  onClose: () => void
}

export function ProfileFeedView({ userId: viewUserId, onClose }: ProfileFeedViewProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Determine which profile to show
      const targetUserId = viewUserId || user?.id
      setProfileUserId(targetUserId || null)
      setIsOwnProfile(targetUserId === user?.id)

      setLoading(false)
    }
    checkAuth()
  }, [supabase, viewUserId])

  const handlePostSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const handleSaveProfile = useCallback(async (updates: Record<string, unknown>) => {
    if (!profileUserId || !isOwnProfile) return

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileUserId)

    if (error) {
      toast.error('Kunne ikke oppdatere profil. Prøv igjen.')
    } else {
      setIsEditingProfile(false)
      setRefreshKey(prev => prev + 1)
      toast.success('Profilen din er oppdatert!')
    }
  }, [profileUserId, isOwnProfile, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!profileUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profil ikke funnet</p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          Tilbake
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {isOwnProfile ? 'Min profil' : 'Profil'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Lukk profil"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile header with inline editing */}
      <ProfileHeader
        key={refreshKey}
        userId={profileUserId}
        showEditButton={isOwnProfile}
        showNewPostButton={false}
        isEditing={isEditingProfile}
        onEdit={() => setIsEditingProfile(true)}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditingProfile(false)}
      />

      {/* Create post button - only show for own profile */}
      {isOwnProfile && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowCreatePost(true)}
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-medium text-sm">Nytt innlegg</span>
          </button>
        </div>
      )}

      {/* User's posts with tabs */}
      <div className="mt-6">
        {isOwnProfile ? (
          <ProfileTabs
            key={refreshKey}
            profileId={profileUserId}
            isOwnProfile={true}
          />
        ) : (
          <UserProfileTabs userId={profileUserId} />
        )}
      </div>

      {/* Create post sheet (only for own profile) */}
      {isOwnProfile && (
        <CreatePostSheet
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostSuccess}
          userId={profileUserId}
        />
      )}
    </div>
  )
}
