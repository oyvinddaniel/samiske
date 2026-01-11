'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { PostComposerInline } from '@/components/posts/composer'
import type { GeographySelection } from '@/components/geography'
import { FeedFilters, FeedFilterType } from './FeedFilters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface GeographyFilter {
  type: 'sapmi' | 'country' | 'language_area' | 'municipality' | 'place'
  id?: string  // UUID, null for 'sapmi'
}

export interface StarredLocations {
  languageAreaIds: string[]
  municipalityIds: string[]
  placeIds: string[]
}

interface FeedProps {
  categorySlug?: string
  geography?: GeographyFilter
  geographyName?: string  // Name of the geography for auto-setting in create post
  showFilters?: boolean
  communityIds?: string[]
  userId?: string  // Filter posts by specific user
  hideCreateButton?: boolean  // Hide the create post button
  starredLocations?: StarredLocations  // Filter by starred locations
  friendsOnly?: boolean  // Filter to show only friends' posts
  onlyFromCommunities?: boolean  // Filter to show only posts from communities
}

interface PostImage {
  id: string
  post_id: string
  url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  sort_order: number
}

interface PostVideo {
  id: string
  bunny_video_id: string
  thumbnail_url: string | null
  playback_url: string | null
  hls_url: string | null
  duration: number | null
  width: number | null
  height: number | null
  status: string
}

interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  images?: { id: string; url: string; thumbnail_url?: string | null; width?: number | null; height?: number | null; sort_order: number }[]
  video?: PostVideo | null
  type: 'standard' | 'event'
  visibility: 'public' | 'friends' | 'circles'
  event_date: string | null
  event_time: string | null
  event_location: string | null
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  category: {
    name: string
    slug: string
    color: string
  } | null
  comment_count: number
  like_count: number
  user_has_liked: boolean
  // Kontekst - hvor innlegget er publisert
  posted_from_name?: string
  posted_from_type?: 'community' | 'place' | 'municipality' | 'private'
  posted_from_id?: string
  created_for_community_id?: string | null
  // Joined data for context (from standard query)
  community?: {
    id: string
    name: string
    slug: string
    category?: string
  } | null
  place?: {
    id: string
    name: string
    slug: string
  } | null
  municipality?: {
    id: string
    name: string
    slug: string
  } | null
}

export function Feed({ categorySlug, geography, geographyName, showFilters = false, communityIds, userId: filterUserId, hideCreateButton = false, starredLocations, friendsOnly = false, onlyFromCommunities = false }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<FeedFilterType>('sapmi')
  const supabase = createClient()

  // Use refs for filter data to avoid infinite loops
  const starredMunicipalityIdsRef = useRef<string[]>([])
  const starredPlaceIdsRef = useRef<string[]>([])
  const friendIdsRef = useRef<string[]>([])

  // Fetch user's starred places and friends
  const fetchUserData = useCallback(async (userId: string) => {
    // Fetch starred municipalities
    const { data: starredMunicipalities } = await supabase
      .from('user_starred_municipalities')
      .select('municipality_id')
      .eq('user_id', userId)

    starredMunicipalityIdsRef.current = (starredMunicipalities || []).map(s => s.municipality_id)

    // Fetch starred places
    const { data: starredPlaces } = await supabase
      .from('user_starred_places')
      .select('place_id')
      .eq('user_id', userId)

    starredPlaceIdsRef.current = (starredPlaces || []).map(s => s.place_id)

    // Fetch friends (accepted friendships)
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    const friends = (friendships || []).map(f =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    )
    friendIdsRef.current = friends
  }, [supabase])

  const fetchPosts = useCallback(async () => {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      // Fetch user data for filtering if logged in
      if (user) {
        await fetchUserData(user.id)
      }

      let postsData: Array<{
        id: string
        title: string
        content: string
        image_url: string | null
        type: string
        visibility: string
        event_date: string | null
        event_time: string | null
        event_location: string | null
        created_at: string
        pinned: boolean | null
        user_id: string
        category_id: string | null
        posted_from_name?: string
        posted_from_type?: string
        posted_from_id?: string
        created_for_community_id?: string | null
        user?: unknown
        category?: unknown
        community?: unknown
        place?: unknown
        municipality?: unknown
      }> | null = null
      let fetchError: Error | null = null

      // Use RPC function if geography filter is provided
      if (geography) {
        const { data, error } = await supabase.rpc('get_posts_for_geography', {
          geography_type_param: geography.type,
          geography_id_param: geography.id || null,
          limit_param: 50,
          offset_param: 0
        })

        if (error) {
          // Fallback to standard query if RPC fails (function might not exist yet)
          console.warn('RPC function not available, falling back to standard query:', error)
          fetchError = error
        } else {
          // Fetch images and videos for RPC posts (since RPC doesn't return nested data)
          if (data && data.length > 0) {
            const postIds = data.map((p: { id: string }) => p.id)

            // Fetch all images for these posts
            const { data: imagesData } = await supabase
              .from('post_images')
              .select('*')
              .in('post_id', postIds)
              .order('sort_order')

            // Fetch all videos for these posts
            const { data: videosData } = await supabase
              .from('post_videos')
              .select('*')
              .in('post_id', postIds)

            // Attach images and videos to posts
            postsData = data.map((post: any) => ({
              ...post,
              images: imagesData?.filter((img: any) => img.post_id === post.id) || [],
              video: videosData?.find((vid: any) => vid.post_id === post.id) || null,
            }))
          } else {
            postsData = data
          }
        }
      }

      // Standard query (no geography filter or RPC fallback)
      if (!postsData) {
        let query = supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            image_url,
            type,
            visibility,
            event_date,
            event_time,
            event_location,
            created_at,
            pinned,
            user_id,
            category_id,
            municipality_id,
            place_id,
            created_for_community_id,
            user:profiles!posts_user_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            category:categories (
              name,
              slug,
              color
            ),
            community:communities (
              id,
              name,
              slug,
              category
            ),
            place:places (
              id,
              name,
              slug
            ),
            municipality:municipalities (
              id,
              name,
              slug
            ),
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
          .order('pinned', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })

        // Filter by category if provided
        if (categorySlug) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single()

          if (category) {
            query = query.eq('category_id', category.id)
          }
        }

        // Ekskluder personlige innlegg fra geografiske feeds
        if (geography || starredLocations) {
          // KRITISK: Vis bare poster som matcher DENNE geografien
          // Ikke bare "har en geografi", men "matcher denne spesifikke geografien"

          if (geography && geography.type === 'municipality' && geography.id) {
            // For municipality: Vis kun poster fra DENNE municipality
            query = query.or(`created_for_community_id.not.is.null,municipality_id.eq.${geography.id}`)
          } else if (geography && geography.type === 'place' && geography.id) {
            // For place: Vis kun poster fra DETTE place
            query = query.or(`created_for_community_id.not.is.null,place_id.eq.${geography.id}`)
          } else if (geography && geography.type === 'sapmi') {
            // For sapmi: Vis alle poster med geografi-kontekst (ikke personlige)
            query = query.or('created_for_community_id.not.is.null,municipality_id.not.is.null,place_id.not.is.null')
          } else if (starredLocations) {
            // For starred locations: Vis poster fra alle favorittlokasjoner
            const locationFilters: string[] = []

            if (starredLocations.municipalityIds.length > 0) {
              locationFilters.push(`municipality_id.in.(${starredLocations.municipalityIds.join(',')})`)
            }
            if (starredLocations.placeIds.length > 0) {
              locationFilters.push(`place_id.in.(${starredLocations.placeIds.join(',')})`)
            }

            if (locationFilters.length > 0) {
              query = query.or(locationFilters.join(','))
            }
          }
        }

        // Filter by community IDs if provided
        if (communityIds && communityIds.length > 0) {
          // SIKKERHET: ALDRI vis innlegg fra grupper på samfunnssider
          // Get posts that belong to these communities via community_posts junction table
          const { data: communityPosts } = await supabase
            .from('community_posts')
            .select('post_id')
            .in('community_id', communityIds)

          const communityPostIds = (communityPosts || []).map(cp => cp.post_id)

          if (communityPostIds.length > 0) {
            query = query.in('id', communityPostIds)
          } else {
            // No posts from followed communities
            postsData = []
          }
        }

        // Filter to show only posts from communities (any community)
        if (onlyFromCommunities) {
          // SIKKERHET: ALDRI vis innlegg fra grupper på samfunnssider
          // Get all posts that belong to any community via community_posts junction table
          const { data: allCommunityPosts } = await supabase
            .from('community_posts')
            .select('post_id')

          const allCommunityPostIds = (allCommunityPosts || []).map(cp => cp.post_id)
          if (allCommunityPostIds.length > 0) {
            query = query.in('id', allCommunityPostIds)
          } else {
            // No community posts exist
            postsData = []
          }
        }

        // Filter by specific user if provided
        if (filterUserId) {
          query = query.eq('user_id', filterUserId)
        }

        // Apply starred locations filter if provided
        if (starredLocations && !geography) {
          const { languageAreaIds, municipalityIds, placeIds } = starredLocations
          if (languageAreaIds.length > 0 || municipalityIds.length > 0 || placeIds.length > 0) {
            const orFilters: string[] = []
            if (languageAreaIds.length > 0) {
              orFilters.push(`language_area_id.in.(${languageAreaIds.join(',')})`)
            }
            if (municipalityIds.length > 0) {
              orFilters.push(`municipality_id.in.(${municipalityIds.join(',')})`)
            }
            if (placeIds.length > 0) {
              orFilters.push(`place_id.in.(${placeIds.join(',')})`)
            }
            query = query.or(orFilters.join(','))
          } else {
            // No starred locations, return empty
            postsData = []
            fetchError = null
          }
        }

        // Apply friends-only filter if provided
        if (friendsOnly && !geography) {
          if (friendIdsRef.current.length > 0) {
            query = query.in('user_id', friendIdsRef.current)
          } else {
            // No friends, return empty
            postsData = []
            fetchError = null
          }
        }

        // Apply feed filters (only when showFilters is true and no other filters)
        if (showFilters && !geography && !starredLocations && !friendsOnly) {
          if (currentFilter === 'mine') {
            // Filter by user's starred places and municipalities
            // We need to use OR filter for places and municipalities
            if (starredMunicipalityIdsRef.current.length > 0 || starredPlaceIdsRef.current.length > 0) {
              const orFilters: string[] = []
              if (starredMunicipalityIdsRef.current.length > 0) {
                orFilters.push(`municipality_id.in.(${starredMunicipalityIdsRef.current.join(',')})`)
              }
              if (starredPlaceIdsRef.current.length > 0) {
                orFilters.push(`place_id.in.(${starredPlaceIdsRef.current.join(',')})`)
              }
              query = query.or(orFilters.join(','))
            } else {
              // No starred places, return empty
              postsData = []
              fetchError = null
            }
          } else if (currentFilter === 'venner') {
            // Filter by friends' posts
            if (friendIdsRef.current.length > 0) {
              query = query.in('user_id', friendIdsRef.current)
            } else {
              // No friends, return empty
              postsData = []
              fetchError = null
            }
          }
          // 'sapmi' is default - no additional filter
        }

        // Only execute query if postsData hasn't been set to empty array
        if (postsData === null) {
          const { data, error } = await query
          postsData = data
          fetchError = error
        }
      }

      const error = fetchError

      if (error) {
        console.error('Error fetching posts:', error)
        toast.error('Kunne ikke laste innlegg. Prøv igjen senere.')
        setLoading(false)
        return
      }

      // Debug: Log fetched posts with visibility
      if (postsData && postsData.length > 0) {
        console.log(`📬 Fetched ${postsData.length} posts from database:`,
          postsData.map((p: any) => ({
            id: p.id.substring(0, 8),
            title: p.title?.substring(0, 30),
            visibility: p.visibility,
            user_id: p.user_id === currentUserId ? 'YOU' : 'OTHER'
          }))
        )
      }

      if (!postsData || postsData.length === 0) {
        console.log('📭 No posts returned from database')
        setPosts([])
        setLoading(false)
        return
      }

      // Get all post IDs and user IDs for batch queries
      const postIds = postsData.map(p => p.id)
      const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))]
      const categoryIds = [...new Set(postsData.map(p => p.category_id).filter(Boolean))]

      // Batch fetch user data if not included (RPC doesn't include joins)
      let usersMap: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {}
      if (userIds.length > 0 && !postsData[0]?.user) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)
        usersMap = (users || []).reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {} as typeof usersMap)
      }

      // Batch fetch category data if not included
      let categoriesMap: Record<string, { name: string; slug: string; color: string }> = {}
      if (categoryIds.length > 0 && !postsData[0]?.category) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug, color')
          .in('id', categoryIds as string[])
        categoriesMap = (categories || []).reduce((acc, c) => {
          acc[c.id] = c
          return acc
        }, {} as typeof categoriesMap)
      }

      // Batch fetch comment counts (single query instead of N queries)
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)

      // Batch fetch like counts (single query instead of N queries)
      const { data: likeCounts } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      // Batch fetch user's likes (single query instead of N queries)
      let userLikedPostIds: string[] = []
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id)
        userLikedPostIds = (userLikes || []).map(l => l.post_id)
      }

      // Batch fetch post images from BOTH media table AND post_images table
      // Media table: For posts created with MediaService (geografi-bilder)
      const { data: mediaImages } = await supabase
        .from('media')
        .select('id, entity_id, storage_path, width, height, sort_order')
        .eq('entity_type', 'post')
        .in('entity_id', postIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      // Post_images table: For posts created with post composer (innleggsbilder)
      const { data: postImagesData } = await supabase
        .from('post_images')
        .select('id, post_id, url, thumbnail_url, width, height, sort_order')
        .in('post_id', postIds)
        .order('sort_order', { ascending: true })

      // Debug: Log raw data from post_images table
      console.log('🔍 Fetched from post_images table:', postImagesData?.length || 0, 'images')
      if (postImagesData && postImagesData.length > 0) {
        console.log('🔍 First few images:', postImagesData.slice(0, 3).map(img => ({
          post_id: img.post_id,
          url: img.url.substring(0, 40) + '...',
          sort_order: img.sort_order
        })))
      }

      // Group images by post_id
      type ImageForPost = { id: string; url: string; thumbnail_url: string | null; width: number | null; height: number | null; sort_order: number; like_count?: number; comment_count?: number }
      const { MediaService } = await import('@/lib/media/mediaService')

      // First, add images from media table
      const imagesMap = (mediaImages || []).reduce((acc, img) => {
        if (!acc[img.entity_id]) {
          acc[img.entity_id] = []
        }
        const url = MediaService.getUrl(img.storage_path)
        const thumbnailUrl = MediaService.getUrl(img.storage_path, 'medium')
        acc[img.entity_id].push({
          id: img.id,
          url: url,
          thumbnail_url: thumbnailUrl,
          width: img.width,
          height: img.height,
          sort_order: img.sort_order,
          like_count: 0, // TODO: Fetch actual counts from media_likes
          comment_count: 0 // TODO: Fetch actual counts from media_comments
        })
        return acc
      }, {} as Record<string, ImageForPost[]>)

      // Then, add images from post_images table
      ;(postImagesData || []).forEach(img => {
        if (!imagesMap[img.post_id]) {
          imagesMap[img.post_id] = []
        }
        imagesMap[img.post_id].push({
          id: img.id,
          url: img.url,
          thumbnail_url: img.thumbnail_url,
          width: img.width,
          height: img.height,
          sort_order: img.sort_order,
          like_count: 0, // TODO: Implement engagement tracking (FASE 4)
          comment_count: 0 // TODO: Implement engagement tracking (FASE 4)
        })
      })

      // Sort images by sort_order within each post
      Object.keys(imagesMap).forEach(postId => {
        imagesMap[postId].sort((a, b) => a.sort_order - b.sort_order)
      })

      // Debug: Log images map
      console.log('📸 Images map:', Object.entries(imagesMap).map(([postId, images]) => ({
        postId,
        imageCount: images.length,
        images: images.map(img => ({ id: img.id, url: img.url.substring(0, 50) + '...', sort_order: img.sort_order }))
      })))

      // Batch fetch post videos from post_videos table (Bunny Stream)
      const { data: postVideos } = await supabase
        .from('post_videos')
        .select('id, post_id, bunny_video_id, thumbnail_url, playback_url, hls_url, duration, width, height, status')
        .in('post_id', postIds)
        .eq('status', 'finished') // Only show finished videos

      // Map videos by post_id (1 video per post)
      const videosMap = (postVideos || []).reduce((acc, vid) => {
        acc[vid.post_id] = {
          id: vid.id,
          bunny_video_id: vid.bunny_video_id,
          thumbnail_url: vid.thumbnail_url,
          playback_url: vid.playback_url,
          hls_url: vid.hls_url,
          duration: vid.duration,
          width: vid.width,
          height: vid.height,
          status: vid.status,
        }
        return acc
      }, {} as Record<string, PostVideo>)

      // Count comments and likes per post
      const commentCountMap = (commentCounts || []).reduce((acc, c) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const likeCountMap = (likeCounts || []).reduce((acc, l) => {
        acc[l.post_id] = (acc[l.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Map posts with counts
      const postsWithCounts: Post[] = postsData.map((post) => {
        // Get user data from join or from separate fetch
        const userData = post.user
          ? (Array.isArray(post.user) ? post.user[0] : post.user)
          : usersMap[post.user_id]

        // Get category data from join or from separate fetch
        const categoryData = post.category
          ? (Array.isArray(post.category) ? post.category[0] : post.category)
          : (post.category_id ? categoriesMap[post.category_id] : null)

        // Calculate posted_from context if not from RPC
        let postedFromName = post.posted_from_name
        let postedFromType = post.posted_from_type
        let postedFromId = post.posted_from_id

        if (!postedFromName) {
          // Extract from joined data
          const communityData = post.community ? (Array.isArray(post.community) ? post.community[0] : post.community) : null
          const placeData = post.place ? (Array.isArray(post.place) ? post.place[0] : post.place) : null
          const municipalityData = post.municipality ? (Array.isArray(post.municipality) ? post.municipality[0] : post.municipality) : null

          if (communityData && post.created_for_community_id) {
            postedFromName = communityData.name
            postedFromType = 'community'
            postedFromId = communityData.id
          } else if (placeData) {
            postedFromName = placeData.name
            postedFromType = 'place'
            postedFromId = placeData.id
          } else if (municipalityData) {
            postedFromName = municipalityData.name
            postedFromType = 'municipality'
            postedFromId = municipalityData.id
          } else {
            postedFromType = 'private'
          }
        }

        const postImages = imagesMap[post.id] || []
        if (postImages.length > 1) {
          console.log(`📸 Post ${post.id} has ${postImages.length} images:`, postImages.map(img => img.url.substring(0, 30)))
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          images: postImages,
          video: videosMap[post.id] || null,
          type: post.type as 'standard' | 'event',
          visibility: post.visibility as 'public' | 'friends' | 'circles',
          event_date: post.event_date,
          event_time: post.event_time,
          event_location: post.event_location,
          created_at: post.created_at,
          user: userData as Post['user'],
          category: categoryData as Post['category'],
          comment_count: commentCountMap[post.id] || 0,
          like_count: likeCountMap[post.id] || 0,
          user_has_liked: userLikedPostIds.includes(post.id),
          posted_from_name: postedFromName,
          posted_from_type: postedFromType as Post['posted_from_type'],
          posted_from_id: postedFromId,
          created_for_community_id: post.created_for_community_id,
        }
      })

      setPosts(postsWithCounts)
      setLoading(false)
    }, [categorySlug, geography, supabase, currentFilter, showFilters, fetchUserData, communityIds, filterUserId, starredLocations, friendsOnly])

  useEffect(() => {
     
    fetchPosts()
  }, [fetchPosts])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-full h-4 bg-gray-200 rounded mb-1" />
            <div className="w-2/3 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Create post button - only on geographic pages */}
      {currentUserId && geography && geography.type !== 'sapmi' && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowCreatePost(true)}
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Opprett nytt innlegg"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-medium text-sm">Nytt innlegg i {geographyName}</span>
          </button>
        </div>
      )}

      {/* Inline create post form */}
      {currentUserId && (
        <PostComposerInline
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSuccess={fetchPosts}
          userId={currentUserId}
          defaultGeography={geography && geography.id && geographyName ? {
            type: geography.type as 'language_area' | 'municipality' | 'place',
            id: geography.id,
            name: geographyName
          } : undefined}
          communityId={communityIds && communityIds.length > 0 ? communityIds[0] : null}
        />
      )}

      <div className="space-y-[66px] overflow-x-hidden min-w-0">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-4">Ingen innlegg ennå</p>
            <p className="text-sm text-gray-400">
              Vær den første til å dele noe med miljøet!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
            />
          ))
        )}

        {/* Spacer for scrolling last post up */}
        <div className="h-[500px]" />
      </div>

      {/* Overlay for non-logged in users - gradient blur at bottom */}
      {!currentUserId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          {/* Gradient blur overlay - blurry at bottom, clearer going up (40% height) */}
          <div className="h-[40vh] relative">
            {/* Multiple blur layers for stronger gradient effect */}
            <div className="absolute inset-0 backdrop-blur-lg bg-white/80" style={{ maskImage: 'linear-gradient(to top, black 0%, transparent 100%)' }} />
            <div className="absolute inset-0 backdrop-blur-md bg-white/70" style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 90%)' }} />
            <div className="absolute inset-0 backdrop-blur-sm bg-white/50" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent 70%)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>

          {/* Content - horizontal full-width layout */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 py-4 px-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                {/* Logo */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                    <img
                      src="/images/sami.png"
                      alt="Samisk flagg"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-900">samiske.no</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Logg inn
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Registrer deg
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
