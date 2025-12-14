'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { CreatePostSheet, type DefaultGeography } from '@/components/posts/CreatePostSheet'
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
  groupId?: string
  groupIds?: string[]  // Filter by multiple groups (for combined feed)
  communityIds?: string[]
  userId?: string  // Filter posts by specific user
  hideCreateButton?: boolean  // Hide the create post button
  starredLocations?: StarredLocations  // Filter by starred locations
  friendsOnly?: boolean  // Filter to show only friends' posts
  onlyFromCommunities?: boolean  // Filter to show only posts from communities
}

interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
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
  // Geografisk info
  posted_from_name?: string
  posted_from_type?: 'place' | 'municipality' | 'sapmi'
}

export function Feed({ categorySlug, geography, geographyName, showFilters = false, groupId, groupIds, communityIds, userId: filterUserId, hideCreateButton = false, starredLocations, friendsOnly = false, onlyFromCommunities = false }: FeedProps) {
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
        user?: unknown
        category?: unknown
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
          // RPC returns posts without user/category joins, need to fetch those separately
          postsData = data
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
            user:profiles!posts_user_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            category:categories (
              name,
              slug,
              color
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

        // Filter by group(s) if provided
        if (groupId || (groupIds && groupIds.length > 0)) {
          // Get posts that belong to the group(s) via created_for_group_id
          const idsToQuery = groupIds && groupIds.length > 0 ? groupIds : [groupId!]
          query = query.in('created_for_group_id', idsToQuery)
        } else {
          // SIKKERHET: ALLTID ekskluder innlegg fra lukkede/skjulte grupper
          // When NOT viewing a specific group:
          // 1. ALWAYS EXCLUDE posts from ALL groups (open/closed/hidden) unless:
          //    - Group is associated with current geography (for geographic feeds)
          //    - User is member (for personal feeds)

          // Get ALL groups
          const { data: allGroups } = await supabase
            .from('groups')
            .select('id, group_type')

          const allGroupIds = (allGroups || []).map(g => g.id)

          if (allGroupIds.length > 0) {
            // For geographic feeds: only show posts from groups associated with this geography
            if (geography) {
              const { data: geographicGroups } = await supabase
                .from('group_places')
                .select('group_id, place_id, municipality_id')

              let allowedGroupIds: string[] = []

              if (geography.type === 'place' && geography.id) {
                // Show groups associated with this specific place
                allowedGroupIds = (geographicGroups || [])
                  .filter(gp => gp.place_id === geography.id)
                  .map(gp => gp.group_id)
              } else if (geography.type === 'municipality' && geography.id) {
                // Show groups associated with this municipality OR places within it
                const { data: placesInMunicipality } = await supabase
                  .from('places')
                  .select('id')
                  .eq('municipality_id', geography.id)

                const placeIds = (placesInMunicipality || []).map(p => p.id)

                allowedGroupIds = (geographicGroups || [])
                  .filter(gp =>
                    gp.municipality_id === geography.id ||
                    (gp.place_id && placeIds.includes(gp.place_id))
                  )
                  .map(gp => gp.group_id)
              } else if (geography.type === 'language_area' && geography.id) {
                // Show groups from municipalities in this language area
                const { data: municipalitiesInArea } = await supabase
                  .from('municipalities')
                  .select('id')
                  .eq('language_area_id', geography.id)

                const municipalityIds = (municipalitiesInArea || []).map(m => m.id)

                allowedGroupIds = (geographicGroups || [])
                  .filter(gp => gp.municipality_id && municipalityIds.includes(gp.municipality_id))
                  .map(gp => gp.group_id)
              }

              // Exclude ALL group posts except those from geographically-associated groups
              const excludeGroupIds = allGroupIds.filter(id => !allowedGroupIds.includes(id))

              if (excludeGroupIds.length > 0) {
                query = query.or(`created_for_group_id.is.null,created_for_group_id.not.in.(${excludeGroupIds.join(',')})`)
              }
            }
            // For personal/profile feeds: show posts from groups user is a member of
            else if (filterUserId === currentUserId || friendsOnly) {
              if (currentUserId) {
                const { data: userGroupMemberships } = await supabase
                  .from('group_members')
                  .select('group_id')
                  .eq('user_id', currentUserId)
                  .eq('status', 'approved')

                const userGroupIds = (userGroupMemberships || []).map(gm => gm.group_id)
                const excludeGroupIds = allGroupIds.filter(id => !userGroupIds.includes(id))

                if (excludeGroupIds.length > 0) {
                  query = query.or(`created_for_group_id.is.null,created_for_group_id.not.in.(${excludeGroupIds.join(',')})`)
                }
              }
            }
            // For main feed / other feeds: exclude ALL group posts
            else {
              query = query.is('created_for_group_id', null)
            }
          }

          // Ekskluder personlige innlegg fra geografiske feeds
          if (geography || starredLocations) {
            // Only show posts with geographic or community context (not personal posts)
            query = query.or('created_for_group_id.not.is.null,created_for_community_id.not.is.null,municipality_id.not.is.null,place_id.not.is.null')
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
            // KRITISK SIKKERHET: Ekskluder ALLTID innlegg som har created_for_group_id
            // Dette sikrer at innlegg fra lukkede/skjulte grupper ALDRI vises på samfunnssider
            query = query.in('id', communityPostIds).is('created_for_group_id', null)
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
            // KRITISK SIKKERHET: Ekskluder ALLTID innlegg som har created_for_group_id
            query = query.in('id', allCommunityPostIds).is('created_for_group_id', null)
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

      if (!postsData || postsData.length === 0) {
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

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          type: post.type as 'standard' | 'event',
          visibility: post.visibility as 'public' | 'members',
          event_date: post.event_date,
          event_time: post.event_time,
          event_location: post.event_location,
          created_at: post.created_at,
          user: userData as Post['user'],
          category: categoryData as Post['category'],
          comment_count: commentCountMap[post.id] || 0,
          like_count: likeCountMap[post.id] || 0,
          user_has_liked: userLikedPostIds.includes(post.id),
          posted_from_name: post.posted_from_name,
          posted_from_type: post.posted_from_type as Post['posted_from_type'],
        }
      })

      setPosts(postsWithCounts)
      setLoading(false)
  }, [categorySlug, geography, supabase, currentFilter, showFilters, fetchUserData, groupId, groupIds, communityIds, filterUserId, starredLocations, friendsOnly])

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

      {/* Create post sheet */}
      {currentUserId && (
        <CreatePostSheet
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSuccess={fetchPosts}
          userId={currentUserId}
          defaultGeography={geography && geography.id && geographyName ? {
            type: geography.type as 'language_area' | 'municipality' | 'place',
            id: geography.id,
            name: geographyName
          } : undefined}
          groupId={groupId || null}
          communityId={communityIds && communityIds.length > 0 ? communityIds[0] : null}
        />
      )}

      <div className="space-y-[66px]">
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
                      src="/images/sami.jpg"
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
