'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileFeaturedImages } from './ProfileFeaturedImages'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Image as ImageIcon, Video } from 'lucide-react'
import { MediaService } from '@/lib/media'
import Image from 'next/image'

interface ProfileMediaTabProps {
  userId: string
  isEditable?: boolean
}

interface PostWithMedia {
  id: string
  created_at: string
  images?: Array<{
    id: string
    url: string
    thumbnail_url?: string
    width?: number
    height?: number
  }>
  video?: {
    id: string
    thumbnail_url?: string
    bunny_video_id: string
  } | null
}

export function ProfileMediaTab({ userId, isEditable = false }: ProfileMediaTabProps) {
  const [postsWithMedia, setPostsWithMedia] = useState<PostWithMedia[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchPostsWithMedia = async () => {
      // Fetch posts that have either images or video
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          created_at,
          images:post_images (
            id,
            url,
            thumbnail_url,
            width,
            height
          ),
          video:post_videos (
            id,
            thumbnail_url,
            bunny_video_id
          )
        `)
        .eq('user_id', userId)
        .or('images.id.not.is.null,video.id.not.is.null')
        .order('created_at', { ascending: false })
        .limit(24)

      if (error) {
        console.error('Error fetching media posts:', error)
      } else if (data) {
        // Filter to only posts that actually have media
        const filteredData = data.filter(post =>
          (post.images && post.images.length > 0) || post.video
        )
        setPostsWithMedia(filteredData as unknown as PostWithMedia[])
      }

      setLoading(false)
    }

    fetchPostsWithMedia()
  }, [userId, supabase])

  return (
    <div className="space-y-6">
      {/* Featured Images Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            Profilgalleri
          </CardTitle>
          <CardDescription>Utvalgte bilder fra profilen</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileFeaturedImages userId={userId} isEditable={isEditable} />
        </CardContent>
      </Card>

      {/* Posts with Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Bilder og videoer fra innlegg
          </CardTitle>
          <CardDescription>Media fra dine innlegg</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Laster media...</div>
            </div>
          ) : postsWithMedia.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen media funnet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {postsWithMedia.map(post => (
                <MediaGridItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MediaGridItem({ post }: { post: PostWithMedia }) {
  // Display first image if available, otherwise video thumbnail
  const firstImage = post.images && post.images.length > 0 ? post.images[0] : null
  const video = post.video

  if (firstImage) {
    return (
      <a
        href={`/innlegg/${post.id}`}
        className="relative aspect-square group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
      >
        <Image
          src={firstImage.thumbnail_url || firstImage.url}
          alt="Post image"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {post.images && post.images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            {post.images.length}
          </div>
        )}
      </a>
    )
  }

  if (video) {
    return (
      <a
        href={`/innlegg/${post.id}`}
        className="relative aspect-square group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
      >
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt="Video thumbnail"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-full p-3">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
      </a>
    )
  }

  return null
}
