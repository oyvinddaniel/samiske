'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { FileText, ImageIcon, Loader2 } from 'lucide-react'

interface UserProfileTabsProps {
  userId: string
}

export function UserProfileTabs({ userId }: UserProfileTabsProps) {
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Get current user for visibility filtering
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const isOwnProfile = userId === user?.id

      // Fetch user's posts with proper joins
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles!inner(id, full_name, avatar_url),
          category:categories(name, slug, color)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // 🔒 KRITISK SIKKERHET: ALLTID ekskluder gruppeinnlegg fra profiler
      // Gruppeinnlegg skal ALDRI vises på brukerprofiler, bare i gruppen selv
      query = query.is('created_for_group_id', null)

      // 🔒 SIKKERHET: Filtrer basert på visibility og hvem som ser
      if (!isOwnProfile) {
        // Ikke egen profil - må filtrere basert på visibility
        if (!user) {
          // Ikke innlogget - kun public
          query = query.eq('visibility', 'public')
        } else {
          // Innlogget - sjekk vennskap og filtrer
          // Hent vennskapsforhold
          const { data: friendships } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
            .eq('status', 'accepted')

          const isFriend = friendships && friendships.length > 0

          if (isFriend) {
            // Venner - vis public og members
            query = query.in('visibility', ['public', 'members'])
          } else {
            // Ikke venner - bare public
            query = query.eq('visibility', 'public')
          }
        }
      }
      // Egen profil - vis alt (ingen ekstra filter)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user posts:', error)
      } else if (data) {
        setAllPosts(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [userId, supabase])

  // Filter posts with images
  const imagePosts = useMemo(() => {
    return allPosts.filter(p => p.image_url)
  }, [allPosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="posts">
          <FileText className="w-4 h-4 mr-2" />
          Innlegg ({allPosts.length})
        </TabsTrigger>
        <TabsTrigger value="images">
          <ImageIcon className="w-4 h-4 mr-2" />
          Bilder ({imagePosts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {allPosts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Ingen innlegg ennå</p>
          </div>
        ) : (
          <div className="space-y-[66px]">
            {allPosts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="images">
        {imagePosts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Ingen bilder ennå</p>
          </div>
        ) : (
          <div className="space-y-[66px]">
            {imagePosts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
