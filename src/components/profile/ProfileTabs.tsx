'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { AllMyPosts } from '@/components/profile/AllMyPosts'
import { AccountSettings } from '@/components/profile/AccountSettings'
import { ProfileAboutTab } from '@/components/profile/ProfileAboutTab'
import { ProfileMediaTab } from '@/components/profile/ProfileMediaTab'
import { ProfileActivityTab } from '@/components/profile/ProfileActivityTab'
import type { SocialLink } from '@/components/profile/SocialLinksEditor'
import { FileText, User, Image, TrendingUp, Settings } from 'lucide-react'

interface ProfileTabsProps {
  profileId: string
  isOwnProfile: boolean
  value?: string
  onValueChange?: (value: string) => void
  profileData?: {
    username?: string | null
    tagline?: string | null
    social_links?: SocialLink[] | null
    interests?: string[] | null
  }
}

interface PostData {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
  [key: string]: unknown
}

export function ProfileTabs({ profileId, isOwnProfile, value, onValueChange, profileData }: ProfileTabsProps) {
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
          category:categories(name, slug, color),
          images:post_images (
            id,
            url,
            thumbnail_url,
            width,
            height,
            sort_order
          ),
          video:post_videos (
            id,
            bunny_video_id,
            thumbnail_url,
            playback_url,
            hls_url,
            duration,
            width,
            height,
            status
          )
        `)
        .eq('user_id', profileId)
        .is('language_area_id', null)
        .is('municipality_id', null)
        .is('place_id', null)
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
    <Tabs
      value={value}
      onValueChange={onValueChange}
      defaultValue="innlegg"
      className="w-full"
    >
      <TabsList className={`w-full mb-4 grid ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <TabsTrigger value="innlegg" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Innlegg</span>
          <span className="sm:hidden">Post</span>
        </TabsTrigger>
        <TabsTrigger value="om" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Om meg</span>
          <span className="sm:hidden">Om</span>
        </TabsTrigger>
        <TabsTrigger value="media" className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          <span className="hidden sm:inline">Media</span>
          <span className="sm:hidden">Media</span>
        </TabsTrigger>
        <TabsTrigger value="aktivitet" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Aktivitet</span>
          <span className="sm:hidden">Stats</span>
        </TabsTrigger>
        {isOwnProfile && (
          <TabsTrigger value="innstillinger" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Innstillinger</span>
            <span className="sm:hidden">Innst.</span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="innlegg">
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

      <TabsContent value="om">
        <ProfileAboutTab
          userId={profileId}
          isEditable={isOwnProfile}
          username={profileData?.username}
          tagline={profileData?.tagline}
          socialLinks={profileData?.social_links}
          interests={profileData?.interests}
        />
      </TabsContent>

      <TabsContent value="media">
        <ProfileMediaTab
          userId={profileId}
          isEditable={isOwnProfile}
        />
      </TabsContent>

      <TabsContent value="aktivitet">
        <ProfileActivityTab
          userId={profileId}
          currentUserId={currentUserId}
        />
      </TabsContent>

      {isOwnProfile && (
        <TabsContent value="innstillinger">
          <AccountSettings userId={profileId} />
        </TabsContent>
      )}
    </Tabs>
  )
}
