'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function MinProfilPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
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

  const handleSaveProfile = useCallback(async (updates: any) => {
    if (!currentUserId) return

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentUserId)

    if (error) {
      toast.error('Kunne ikke oppdatere profil. Prøv igjen.')
    } else {
      setIsEditingProfile(false)
      setRefreshKey(prev => prev + 1)
      toast.success('Profilen din er oppdatert!')
    }
  }, [currentUserId, supabase])

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

        {/* Profile header with inline editing */}
        <ProfileHeader
          key={refreshKey}
          userId={currentUserId}
          showEditButton={true}
          showNewPostButton={true}
          onNewPost={() => setShowCreatePost(true)}
          isEditing={isEditingProfile}
          onEdit={() => setIsEditingProfile(true)}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditingProfile(false)}
        />

        {/* User's posts with tabs */}
        <div className="mt-6">
          <ProfileTabs
            key={refreshKey}
            profileId={currentUserId}
            isOwnProfile={true}
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
