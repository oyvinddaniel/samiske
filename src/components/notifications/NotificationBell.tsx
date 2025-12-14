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
  isNew: boolean
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

  const totalCount =
    counts.newPosts +
    counts.commentsOnMyPosts +
    counts.commentsOnFollowedPosts +
    counts.likesOnMyPosts

  // Fetch notifications using optimized RPC function
  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_notification_summary', {
        p_user_id: userId,
      })

      if (error) {
        console.error('Error fetching notifications:', error)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setLoading(false)
        return
      }

      const summary = data[0]

      setCounts({
        newPosts: summary.new_posts_count || 0,
        commentsOnMyPosts: summary.comments_on_my_posts_count || 0,
        commentsOnFollowedPosts: summary.comments_on_followed_count || 0,
        likesOnMyPosts: summary.likes_count || 0,
      })

      // Parse recent notifications from JSONB
      const recentNotifications = summary.recent_notifications || []
      setNotifications(recentNotifications)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    }
  }, [supabase, userId])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime subscriptions for instant updates
  useEffect(() => {
    console.log('🔔 Setting up Realtime subscriptions for notifications')

    const channel = supabase
      .channel('notifications-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          console.log('📝 New post detected:', payload.new)
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          console.log('💬 New comment detected:', payload.new)
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
        },
        (payload) => {
          console.log('❤️ New like detected:', payload.new)
          fetchNotifications()
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up notification subscriptions')
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, fetchNotifications])

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
  }

  // Mark all as read - updates last_seen_at
  const markAllAsRead = async () => {
    if (totalCount > 0) {
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('Error marking notifications as read:', error)
        return
      }

      // Reset counts and mark all notifications as read locally
      setCounts({
        newPosts: 0,
        commentsOnMyPosts: 0,
        commentsOnFollowedPosts: 0,
        likesOnMyPosts: 0,
      })

      // Mark all notifications as read in UI
      setNotifications((prev) => prev.map((n) => ({ ...n, isNew: false })))
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
        <button
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={`Varsler${totalCount > 0 ? ` (${totalCount} uleste)` : ''}`}
        >
          <Bell className="w-5 h-5 text-white/80 hover:text-white" />

          {/* Notification badge */}
          {totalCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
              aria-hidden="true"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="font-semibold text-sm">Varsler</p>
          {totalCount > 0 && <p className="text-xs text-gray-500">{totalCount} nye siden sist</p>}
        </div>

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Laster varsler...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ingen varsler</p>
            <p className="text-xs text-gray-400 mt-1">Ingen aktivitet de siste 7 dagene</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Summary section */}
            {(counts.newPosts > 0 ||
              counts.commentsOnMyPosts > 0 ||
              counts.likesOnMyPosts > 0) && (
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
                  className={`flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    notification.isNew ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className={`w-8 h-8 ${!notification.isNew ? 'opacity-60' : ''}`}>
                      <AvatarImage src={notification.actorAvatar} />
                      <AvatarFallback
                        className={`text-xs ${
                          notification.isNew
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getInitials(notification.actorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 ${
                        !notification.isNew ? 'opacity-60' : ''
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isNew ? 'text-gray-500' : ''}`}>
                      <span
                        className={
                          notification.isNew ? 'font-medium' : 'font-normal text-gray-500'
                        }
                      >
                        {notification.actorName}
                      </span>{' '}
                      <span className={notification.isNew ? 'text-gray-600' : 'text-gray-400'}>
                        {notification.message}
                      </span>
                    </p>
                    {notification.postTitle && (
                      <p
                        className={`text-xs truncate ${
                          notification.isNew ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        «{notification.postTitle}»
                      </p>
                    )}
                    <p
                      className={`text-[10px] mt-0.5 ${
                        notification.isNew ? 'text-gray-400' : 'text-gray-300'
                      }`}
                    >
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {notification.isNew && (
                    <div className="flex-shrink-0 self-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
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
