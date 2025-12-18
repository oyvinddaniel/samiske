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
import { Bell, FileText, MessageCircle, Heart, CheckCheck, AtSign } from 'lucide-react'

interface NotificationCounts {
  newPosts: number
  commentsOnMyPosts: number
  commentsOnFollowedPosts: number
  likesOnMyPosts: number
}

interface NotificationItem {
  id: string
  type: 'new_post' | 'comment_on_my_post' | 'comment_on_followed' | 'like_on_my_post' | 'new_message' | 'mention'
  message: string
  postId?: string
  postTitle?: string
  actorName?: string
  actorAvatar?: string
  createdAt: string
  isRead: boolean
  // For grouped notifications
  groupedIds?: string[]
  count?: number
  actorId?: string
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

  // Calculate total unread count from all notifications (including messages)
  const totalCount = notifications.filter((n) => !n.isRead).length

  // Fetch notifications using new notifications table
  const fetchNotifications = useCallback(async () => {
    try {
      // Hent notifikasjoner fra ny tabell
      const { data: notifications, error: notifError } = await supabase.rpc('get_notifications', {
        p_user_id: userId,
        p_limit: 50,
        p_offset: 0,
        p_unread_only: false,
      })

      if (notifError) {
        console.error('Error fetching notifications:', notifError)
        setLoading(false)
        return
      }

      // Hent unread count
      const { data: unreadCount, error: countError } = await supabase.rpc(
        'get_unread_notification_count',
        { p_user_id: userId }
      )

      if (countError) {
        console.error('Error fetching unread count:', countError)
      }

      // Transform data til NotificationItem format
      const transformedNotifications: NotificationItem[] = (notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        postId: n.post_id,
        postTitle: n.post_title,
        actorName: n.actor_name,
        actorAvatar: n.actor_avatar,
        actorId: n.actor_id,
        createdAt: n.created_at,
        isRead: n.is_read,
      }))

      // Group message notifications by actor
      const groupedNotifications: NotificationItem[] = []
      const messageGroups = new Map<string, NotificationItem[]>()

      transformedNotifications.forEach(notif => {
        if (notif.type === 'new_message' && notif.actorId) {
          // Group messages by actor
          const key = notif.actorId
          if (!messageGroups.has(key)) {
            messageGroups.set(key, [])
          }
          messageGroups.get(key)!.push(notif)
        } else {
          // Non-message notifications go directly to the list
          groupedNotifications.push(notif)
        }
      })

      // Add grouped message notifications
      messageGroups.forEach((group) => {
        if (group.length === 1) {
          // Single message, no grouping needed
          groupedNotifications.push(group[0])
        } else {
          // Multiple messages from same person - create grouped notification
          const allRead = group.every(n => n.isRead)
          const mostRecent = group.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]

          groupedNotifications.push({
            ...mostRecent,
            count: group.length,
            groupedIds: group.map(n => n.id),
            message: group.length === 1
              ? 'sendte deg en melding'
              : `sendte deg ${group.length} meldinger`,
            isRead: allRead,
          })
        }
      })

      // Sort by createdAt
      groupedNotifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setNotifications(groupedNotifications)

      // Calculate counts from unread notifications
      const unreadNotifications = transformedNotifications.filter((n) => !n.isRead)
      const newCounts = {
        newPosts: unreadNotifications.filter((n) => n.type === 'new_post').length,
        commentsOnMyPosts: unreadNotifications.filter((n) => n.type === 'comment_on_my_post')
          .length,
        commentsOnFollowedPosts: unreadNotifications.filter((n) => n.type === 'comment_on_followed')
          .length,
        likesOnMyPosts: unreadNotifications.filter((n) => n.type === 'like_on_my_post').length,
      }
      setCounts(newCounts)

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
    const channel = supabase
      .channel('notifications-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Fetch immediately - no debounce for instant updates
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // Update local state directly for instant feedback
          const updatedNotif = payload.new as any
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotif.id ? { ...n, isRead: updatedNotif.is_read } : n
            )
          )
          // Recalculate counts
          setNotifications((prev) => {
            const unreadCount = prev.filter((n) => !n.isRead).length
            const newCounts = {
              newPosts: prev.filter((n) => !n.isRead && n.type === 'new_post').length,
              commentsOnMyPosts: prev.filter(
                (n) => !n.isRead && n.type === 'comment_on_my_post'
              ).length,
              commentsOnFollowedPosts: prev.filter(
                (n) => !n.isRead && n.type === 'comment_on_followed'
              ).length,
              likesOnMyPosts: prev.filter((n) => !n.isRead && n.type === 'like_on_my_post').length,
            }
            setCounts(newCounts)
            return prev
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          // Remove notification from local state immediately
          const deletedNotif = payload.old as any
          setNotifications((prev) => {
            const filtered = prev.filter((n) => n.id !== deletedNotif.id)

            // Recalculate counts
            const unreadNotifications = filtered.filter((n) => !n.isRead)
            const newCounts = {
              newPosts: unreadNotifications.filter((n) => n.type === 'new_post').length,
              commentsOnMyPosts: unreadNotifications.filter((n) => n.type === 'comment_on_my_post')
                .length,
              commentsOnFollowedPosts: unreadNotifications.filter(
                (n) => n.type === 'comment_on_followed'
              ).length,
              likesOnMyPosts: unreadNotifications.filter((n) => n.type === 'like_on_my_post').length,
            }
            setCounts(newCounts)

            return filtered
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, fetchNotifications])

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
  }

  // Mark single notification as read (or all grouped notifications)
  const markAsRead = async (notificationId: string) => {
    // Find the notification to check if it's grouped
    const notification = notifications.find((n) => n.id === notificationId)
    const idsToMark = notification?.groupedIds || [notificationId]

    // Optimistic update - mark all grouped IDs as read
    setNotifications((prev) =>
      prev.map((n) => (idsToMark.includes(n.id) ? { ...n, isRead: true } : n))
    )

    // Recalculate counts optimistically
    setNotifications((prev) => {
      const unreadNotifications = prev.filter((n) => !n.isRead)
      const newCounts = {
        newPosts: unreadNotifications.filter((n) => n.type === 'new_post').length,
        commentsOnMyPosts: unreadNotifications.filter((n) => n.type === 'comment_on_my_post')
          .length,
        commentsOnFollowedPosts: unreadNotifications.filter(
          (n) => n.type === 'comment_on_followed'
        ).length,
        likesOnMyPosts: unreadNotifications.filter((n) => n.type === 'like_on_my_post').length,
      }
      setCounts(newCounts)
      return prev
    })

    // Sync with backend - mark all grouped IDs
    try {
      for (const id of idsToMark) {
        const { error } = await supabase.rpc('mark_notification_as_read', {
          p_notification_id: id,
        })

        if (error) {
          console.error('Error marking notification as read:', error)
          throw error
        }
      }

      // Trigger messages-read event for message notifications
      if (notification?.type === 'new_message') {
        window.dispatchEvent(new CustomEvent('messages-read'))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      // Revert optimistic update on error
      fetchNotifications()
    }
  }

  // Mark all as read - uses new RPC function
  const markAllAsRead = async () => {
    if (totalCount === 0) return

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setCounts({
      newPosts: 0,
      commentsOnMyPosts: 0,
      commentsOnFollowedPosts: 0,
      likesOnMyPosts: 0,
    })

    // Sync with backend
    const { error } = await supabase.rpc('mark_all_notifications_as_read', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Error marking all notifications as read:', error)
      // Revert on error
      fetchNotifications()
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
      case 'new_message':
        return <MessageCircle className="w-3 h-3 text-purple-600 fill-purple-600" />
      case 'mention':
        return <AtSign className="w-3 h-3 text-orange-600" />
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
          <div className="h-[400px] overflow-y-auto">
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
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={(e) => {
                    // Mark as read
                    if (!notification.isRead) {
                      markAsRead(notification.id)
                    }

                    // For message notifications, open messages panel instead
                    if (notification.type === 'new_message') {
                      e.preventDefault()
                      window.dispatchEvent(new CustomEvent('open-messages-panel'))
                      setIsOpen(false)
                    }
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className={`w-8 h-8 ${notification.isRead ? 'opacity-60' : ''}`}>
                      <AvatarImage src={notification.actorAvatar} />
                      <AvatarFallback
                        className={`text-xs ${
                          !notification.isRead
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {getInitials(notification.actorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 ${
                        notification.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.isRead ? 'text-gray-500' : ''}`}>
                      <span
                        className={
                          !notification.isRead ? 'font-medium' : 'font-normal text-gray-500'
                        }
                      >
                        {notification.actorName}
                      </span>{' '}
                      <span className={!notification.isRead ? 'text-gray-600' : 'text-gray-400'}>
                        {notification.message}
                      </span>
                    </p>
                    {notification.postTitle && (
                      <p
                        className={`text-xs truncate ${
                          !notification.isRead ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        «{notification.postTitle}»
                      </p>
                    )}
                    <p
                      className={`text-[10px] mt-0.5 ${
                        !notification.isRead ? 'text-gray-400' : 'text-gray-300'
                      }`}
                    >
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
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
