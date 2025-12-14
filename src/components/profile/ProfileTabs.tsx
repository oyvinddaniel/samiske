'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { AllMyPosts } from '@/components/profile/AllMyPosts'

interface ProfileTabsProps {
  profileId: string
  isOwnProfile: boolean
}

interface PostData {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
  [key: string]: unknown
}

export function ProfileTabs({ profileId, isOwnProfile }: ProfileTabsProps) {
  const [personalPosts, setPersonalPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch only personal posts (no geographic, no group, no community)
  useEffect(() => {
    const fetchPersonalPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!inner(id, full_name, avatar_url),
          category:categories(name, slug, color)
        `)
        .eq('user_id', profileId)
        .is('language_area_id', null)
        .is('municipality_id', null)
        .is('place_id', null)
        .is('created_for_group_id', null)
        .is('created_for_community_id', null)
        .order('created_at', { ascending: false })

      if (data) {
        setPersonalPosts(data)
      }
      setLoading(false)
    }

    fetchPersonalPosts()
  }, [profileId, supabase])

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className={`w-full mb-4 ${isOwnProfile ? 'grid grid-cols-2' : ''}`}>
        <TabsTrigger value="personal">Mine private innlegg</TabsTrigger>
        {isOwnProfile && (
          <TabsTrigger value="other-feeds">Mine innlegg andre steder</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="personal">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Laster...</div>
          </div>
        ) : personalPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>Ingen personlige innlegg ennå</p>
            <p className="text-sm mt-2">Opprett ditt første innlegg fra din profilside</p>
          </div>
        ) : (
          <div className="space-y-4">
            {personalPosts.map(post => (
              <PostCard key={post.id} post={post as never} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </TabsContent>

      {isOwnProfile && (
        <TabsContent value="other-feeds">
          <AllMyPosts userId={profileId} showOnlyOtherFeeds={true} />
        </TabsContent>
      )}
    </Tabs>
  )
}
