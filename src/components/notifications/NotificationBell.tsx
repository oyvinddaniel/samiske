'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, FileText, MessageCircle, Heart, CheckCheck } from 'lucide-react'

interface NotificationCounts {
  newPosts: number
  commentsOnMyPosts: number
  commentsOnFollowedPosts: number
  likesOnMyPosts: number
}

interface NotificationItem {
  id: string
  type: 'new_post' | 'comment_on_my_post' | 'comment_on_followed' | 'like_on_my_post'
  message: string
  postId?: string
  postTitle?: string
  actorName?: string
  actorAvatar?: string
  createdAt: string
}

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [counts, setCounts] = useState<NotificationCounts>({
    newPosts: 0,
    commentsOnMyPosts: 0,
    commentsOnFollowedPosts: 0,
    likesOnMyPosts: 0,
  })
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  const totalCount = counts.newPosts + counts.commentsOnMyPosts + counts.commentsOnFollowedPosts + counts.likesOnMyPosts

  const fetchNotifications = useCallback(async () => {
    // Get user's last_seen_at
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_seen_at')
      .eq('id', userId)
      .single()

    const lastSeenAt = profile?.last_seen_at || new Date(0).toISOString()

    // 1. Count new posts since last seen
    const { count: newPostsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', lastSeenAt)
      .neq('user_id', userId)

    // 2. Count comments on my posts since last seen
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', userId)

    const myPostIds = myPosts?.map(p => p.id) || []

    let commentsOnMyPostsCount = 0
    if (myPostIds.length > 0) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', myPostIds)
        .gt('created_at', lastSeenAt)
        .neq('user_id', userId)
      commentsOnMyPostsCount = count || 0
    }

    // 3. Count comments on posts I've commented on (but not my own posts)
    const { data: myComments } = await supabase
      .from('comments')
      .select('post_id')
      .eq('user_id', userId)

    const followedPostIds = [...new Set(myComments?.map(c => c.post_id) || [])]
      .filter(id => !myPostIds.includes(id))

    let commentsOnFollowedCount = 0
    if (followedPostIds.length > 0) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', followedPostIds)
        .gt('created_at', lastSeenAt)
        .neq('user_id', userId)
      commentsOnFollowedCount = count || 0
    }

    // 4. Count likes on my posts since last seen
    let likesOnMyPostsCount = 0
    if (myPostIds.length > 0) {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', myPostIds)
        .gt('created_at', lastSeenAt)
        .neq('user_id', userId)
      likesOnMyPostsCount = count || 0
    }

    setCounts({
      newPosts: newPostsCount || 0,
      commentsOnMyPosts: commentsOnMyPostsCount,
      commentsOnFollowedPosts: commentsOnFollowedCount,
      likesOnMyPosts: likesOnMyPostsCount,
    })

    // Fetch actual notification items for the dropdown
    const items: NotificationItem[] = []

    // Get recent comments on my posts
    if (myPostIds.length > 0) {
      const { data: recentComments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          post_id,
          user:profiles!comments_user_id_fkey (
            full_name,
            avatar_url
          ),
          post:posts!comments_post_id_fkey (
            id,
            title
          )
        `)
        .in('post_id', myPostIds)
        .gt('created_at', lastSeenAt)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      recentComments?.forEach(comment => {
        const userData = Array.isArray(comment.user) ? comment.user[0] : comment.user
        const postData = Array.isArray(comment.post) ? comment.post[0] : comment.post
        items.push({
          id: `comment-${comment.id}`,
          type: 'comment_on_my_post',
          message: `kommenterte på innlegget ditt`,
          postId: postData?.id,
          postTitle: postData?.title,
          actorName: userData?.full_name || 'Ukjent',
          actorAvatar: userData?.avatar_url || undefined,
          createdAt: comment.created_at,
        })
      })
    }

    // Get recent likes on my posts
    if (myPostIds.length > 0) {
      const { data: recentLikes } = await supabase
        .from('likes')
        .select(`
          id,
          created_at,
          post_id,
          user:profiles!likes_user_id_fkey (
            full_name,
            avatar_url
          ),
          post:posts!likes_post_id_fkey (
            id,
            title
          )
        `)
        .in('post_id', myPostIds)
        .gt('created_at', lastSeenAt)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      recentLikes?.forEach(like => {
        const userData = Array.isArray(like.user) ? like.user[0] : like.user
        const postData = Array.isArray(like.post) ? like.post[0] : like.post
        items.push({
          id: `like-${like.id}`,
          type: 'like_on_my_post',
          message: `likte innlegget ditt`,
          postId: postData?.id,
          postTitle: postData?.title,
          actorName: userData?.full_name || 'Ukjent',
          actorAvatar: userData?.avatar_url || undefined,
          createdAt: like.created_at,
        })
      })
    }

    // Get recent new posts
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        created_at,
        user:profiles!posts_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .gt('created_at', lastSeenAt)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    recentPosts?.forEach(post => {
      const userData = Array.isArray(post.user) ? post.user[0] : post.user
      items.push({
        id: `post-${post.id}`,
        type: 'new_post',
        message: `opprettet et nytt innlegg`,
        postId: post.id,
        postTitle: post.title,
        actorName: userData?.full_name || 'Ukjent',
        actorAvatar: userData?.avatar_url || undefined,
        createdAt: post.created_at,
      })
    })

    // Sort by date and limit
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setNotifications(items.slice(0, 10))
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    fetchNotifications()

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
  }

  // Mark all as read - updates last_seen_at but keeps showing notifications
  const markAllAsRead = async () => {
    if (totalCount > 0) {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      // Reset counts but keep notifications visible (marked as read)
      setCounts({
        newPosts: 0,
        commentsOnMyPosts: 0,
        commentsOnFollowedPosts: 0,
        likesOnMyPosts: 0,
      })
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Akkurat nå'
    if (diffInMinutes < 60) return `${diffInMinutes} min siden`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} timer siden`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'I går'
    if (diffInDays < 7) return `${diffInDays} dager siden`
    return `${Math.floor(diffInDays / 7)} uker siden`
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_post':
        return <FileText className="w-3 h-3 text-blue-600" />
      case 'comment_on_my_post':
        return <MessageCircle className="w-3 h-3 text-green-600" />
      case 'comment_on_followed':
        return <MessageCircle className="w-3 h-3 text-green-600" />
      case 'like_on_my_post':
        return <Heart className="w-3 h-3 text-red-500 fill-red-500" />
      default:
        return <Bell className="w-3 h-3 text-gray-600" />
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none">
          <Bell className="w-5 h-5 text-white/80 hover:text-white" />

          {/* Notification badge */}
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="font-semibold text-sm">Varsler</p>
          {totalCount > 0 && (
            <p className="text-xs text-gray-500">
              {totalCount} nye siden sist
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Laster varsler...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ingen nye varsler</p>
            <p className="text-xs text-gray-400 mt-1">
              Du er oppdatert!
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Summary section */}
            {(counts.newPosts > 0 || counts.commentsOnMyPosts > 0 || counts.likesOnMyPosts > 0) && (
              <>
                <div className="px-3 py-2 bg-blue-50 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {counts.newPosts > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        <FileText className="w-3 h-3" />
                        {counts.newPosts} nye innlegg
                      </span>
                    )}
                    {counts.commentsOnMyPosts > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        <MessageCircle className="w-3 h-3" />
                        {counts.commentsOnMyPosts} kommentarer
                      </span>
                    )}
                    {counts.likesOnMyPosts > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        <Heart className="w-3 h-3" />
                        {counts.likesOnMyPosts} likes
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Individual notifications */}
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href={notification.postId ? `/#post-${notification.postId}` : '/'}
                  className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={notification.actorAvatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getInitials(notification.actorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{notification.actorName}</span>{' '}
                      <span className="text-gray-600">{notification.message}</span>
                    </p>
                    {notification.postTitle && (
                      <p className="text-xs text-gray-500 truncate">
                        «{notification.postTitle}»
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-center">
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="w-3 h-3" />
                Merk alle som lest
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
