'use client'

import { UserPlus, UserCheck, Clock, UserX, MessageCircle } from 'lucide-react'
import { useFriendship } from '@/hooks/useFriendship'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FriendActionButtonsProps {
  targetUserId: string
  currentUserId: string | null
  onStartConversation?: (userId: string) => void
  variant?: 'default' | 'compact' | 'outline'
  className?: string
  showMessageButton?: boolean
  /** If true, shows message button only for friends. If false, shows for everyone. Default: false */
  messageButtonFriendsOnly?: boolean
}

/**
 * Reusable component for displaying friend action buttons
 * Handles all friendship states and actions
 *
 * @example Default usage (large buttons)
 * ```tsx
 * <FriendActionButtons
 *   targetUserId="user-123"
 *   currentUserId={currentUser?.id}
 * />
 * ```
 *
 * @example Compact variant (for tight spaces)
 * ```tsx
 * <FriendActionButtons
 *   targetUserId="user-123"
 *   currentUserId={currentUser?.id}
 *   variant="compact"
 * />
 * ```
 *
 * @example With message button (for everyone)
 * ```tsx
 * <FriendActionButtons
 *   targetUserId="user-123"
 *   currentUserId={currentUser?.id}
 *   showMessageButton
 *   onStartConversation={(userId) => console.log('Start conversation with', userId)}
 * />
 * ```
 *
 * @example With message button (friends only)
 * ```tsx
 * <FriendActionButtons
 *   targetUserId="user-123"
 *   currentUserId={currentUser?.id}
 *   showMessageButton
 *   messageButtonFriendsOnly
 *   onStartConversation={(userId) => console.log('Start conversation with', userId)}
 * />
 * ```
 */
export function FriendActionButtons({
  targetUserId,
  currentUserId,
  onStartConversation,
  variant = 'default',
  className,
  showMessageButton = true,
  messageButtonFriendsOnly = false
}: FriendActionButtonsProps) {
  const {
    friendshipStatus,
    isLoading,
    isMutating,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriendship
  } = useFriendship({
    targetUserId,
    currentUserId,
    enabled: !!currentUserId && currentUserId !== targetUserId
  })

  // Don't render if viewing own profile or not logged in
  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex gap-2 animate-pulse', className)}>
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
      </div>
    )
  }

  const isDisabled = isMutating

  // Variant styles
  const getButtonClasses = (baseColor: string, isOutline = false) => {
    const size = variant === 'compact' ? ('sm' as const) : ('default' as const)

    if (variant === 'outline') {
      return {
        size,
        variant: 'outline' as const,
        className: cn(
          isOutline && 'border-gray-300 hover:border-gray-400',
          !isOutline && `border-${baseColor}-600 text-${baseColor}-600 hover:bg-${baseColor}-50`
        )
      }
    }

    return {
      size,
      className: cn(
        isOutline
          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          : `bg-${baseColor}-600 text-white hover:bg-${baseColor}-700`
      )
    }
  }

  // Determine if message button should be shown
  const shouldShowMessageButton = showMessageButton && onStartConversation && (
    !messageButtonFriendsOnly || friendshipStatus === 'accepted'
  )

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* None - Show "Legg til venn" */}
      {friendshipStatus === 'none' && (
        <>
          <Button
            onClick={sendFriendRequest}
            disabled={isDisabled}
            {...getButtonClasses('blue')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Legg til venn
          </Button>

          {/* Message button - for non-friends (if messageButtonFriendsOnly is false) */}
          {shouldShowMessageButton && (
            <Button
              onClick={() => onStartConversation(targetUserId)}
              disabled={isDisabled}
              {...getButtonClasses('gray', true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send melding
            </Button>
          )}
        </>
      )}

      {/* Pending Sent - Show "Forespørsel sendt" (can cancel) */}
      {friendshipStatus === 'pending_sent' && (
        <>
          <Button
            onClick={removeFriendship}
            disabled={isDisabled}
            {...getButtonClasses('gray', true)}
          >
            <Clock className="w-4 h-4 mr-2" />
            Forespørsel sendt
          </Button>

          {/* Message button - for non-friends (if messageButtonFriendsOnly is false) */}
          {shouldShowMessageButton && (
            <Button
              onClick={() => onStartConversation(targetUserId)}
              disabled={isDisabled}
              {...getButtonClasses('gray', true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send melding
            </Button>
          )}
        </>
      )}

      {/* Pending Received - Show "Godta" and "Avslå" */}
      {friendshipStatus === 'pending_received' && (
        <>
          <Button
            onClick={acceptFriendRequest}
            disabled={isDisabled}
            {...getButtonClasses('green')}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Godta
          </Button>
          <Button
            onClick={declineFriendRequest}
            disabled={isDisabled}
            {...getButtonClasses('gray', true)}
          >
            <UserX className="w-4 h-4 mr-2" />
            Avslå
          </Button>

          {/* Message button - for non-friends (if messageButtonFriendsOnly is false) */}
          {shouldShowMessageButton && (
            <Button
              onClick={() => onStartConversation(targetUserId)}
              disabled={isDisabled}
              {...getButtonClasses('gray', true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send melding
            </Button>
          )}
        </>
      )}

      {/* Accepted - Show "Venner" (can remove) */}
      {friendshipStatus === 'accepted' && (
        <>
          <Button
            onClick={removeFriendship}
            disabled={isDisabled}
            {...getButtonClasses('green', true)}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Venner
          </Button>

          {/* Message button - always shown for friends */}
          {shouldShowMessageButton && (
            <Button
              onClick={() => onStartConversation(targetUserId)}
              disabled={isDisabled}
              {...getButtonClasses('gray', true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send melding
            </Button>
          )}
        </>
      )}
    </div>
  )
}
