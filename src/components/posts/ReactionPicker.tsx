'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { REACTIONS, type ReactionType } from './composer/constants'
import { toast } from 'sonner'

interface ReactionUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  reaction_type: ReactionType
}

interface ReactionData {
  total_count: number
  user_reaction: ReactionType | null
  reactions: Partial<Record<ReactionType, number>> | null
  recent_users: ReactionUser[] | null
}

interface ReactionPickerProps {
  postId: string
  initialData?: ReactionData | null
  currentUserId?: string | null
  onReactionChange?: (data: ReactionData) => void
  className?: string
  compact?: boolean
}

const getInitials = (name: string | null): string => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getReactionEmoji = (type: ReactionType): string => {
  const reaction = REACTIONS.find((r) => r.name === type)
  return reaction?.emoji || '❤️'
}

export function ReactionPicker({
  postId,
  initialData,
  currentUserId,
  onReactionChange,
  className,
  compact = false,
}: ReactionPickerProps) {
  const [data, setData] = useState<ReactionData>(
    initialData || {
      total_count: 0,
      user_reaction: null,
      reactions: null,
      recent_users: null,
    }
  )
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Update data when initialData changes
  useEffect(() => {
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPickerOpen(true)
    }, 300)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsPickerOpen(false)
    }, 300)
  }

  const handlePickerMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleReaction = async (reactionType: ReactionType) => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    setIsPickerOpen(false)

    // Optimistic update
    const wasRemoved = data.user_reaction === reactionType
    const oldData = { ...data }

    setData((prev) => {
      const newReactions = { ...(prev.reactions || {}) } as Partial<Record<ReactionType, number>>

      // Remove old reaction if exists
      if (prev.user_reaction && newReactions[prev.user_reaction]) {
        newReactions[prev.user_reaction] = (newReactions[prev.user_reaction] || 0) - 1
        if ((newReactions[prev.user_reaction] || 0) <= 0) {
          delete newReactions[prev.user_reaction]
        }
      }

      // Add new reaction if not removing
      if (!wasRemoved) {
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1
      }

      const totalCount = Object.values(newReactions).reduce((sum, count) => sum + (count || 0), 0)

      return {
        ...prev,
        total_count: totalCount,
        user_reaction: wasRemoved ? null : reactionType,
        reactions: totalCount > 0 ? newReactions : null,
      }
    })

    try {
      const { error } = await supabase.rpc('react_to_post', {
        p_post_id: postId,
        p_reaction_type: reactionType,
      })

      if (error) {
        console.error('Error reacting to post:', error)
        setData(oldData)
        toast.error('Kunne ikke registrere reaksjon')
        return
      }

      // Notify parent
      onReactionChange?.(data)
    } catch (err) {
      console.error('Error reacting to post:', err)
      setData(oldData)
      toast.error('Noe gikk galt')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReaction = () => {
    if (data.user_reaction) {
      // Remove current reaction
      handleReaction(data.user_reaction)
    } else {
      // Add default reaction (elsker)
      handleReaction('elsker')
    }
  }

  // Get the dominant reaction to show
  const dominantReaction = data.reactions
    ? (Object.entries(data.reactions).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] as ReactionType) || 'elsker'
    : 'elsker'

  const userReactionEmoji = data.user_reaction
    ? getReactionEmoji(data.user_reaction)
    : null

  // Get unique reaction types for display
  const reactionTypes = data.reactions
    ? Object.keys(data.reactions).slice(0, 3) as ReactionType[]
    : []

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {/* Main reaction button */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-1.5 text-xs gap-1',
            data.user_reaction
              ? 'text-red-500'
              : data.total_count > 0
              ? 'text-red-500'
              : 'text-gray-400'
          )}
          onClick={handleQuickReaction}
          disabled={!currentUserId || isLoading}
          aria-label={data.user_reaction ? 'Fjern reaksjon' : 'Reager'}
        >
          {userReactionEmoji ? (
            <span className="text-base leading-none">{userReactionEmoji}</span>
          ) : data.total_count > 0 && reactionTypes.length > 0 ? (
            <span className="text-base leading-none">
              {getReactionEmoji(reactionTypes[0])}
            </span>
          ) : (
            <Heart className={cn('w-4 h-4', data.user_reaction && 'fill-current')} />
          )}
          {data.total_count > 0 && <span>{data.total_count}</span>}
        </Button>

        {/* Reaction picker popup */}
        {isPickerOpen && currentUserId && (
          <div
            ref={pickerRef}
            onMouseEnter={handlePickerMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute bottom-full left-0 mb-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1 flex gap-0.5">
              {/* Row 1 */}
              {REACTIONS.slice(0, 5).map((reaction) => (
                <button
                  key={reaction.name}
                  type="button"
                  onClick={() => handleReaction(reaction.name as ReactionType)}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-125 hover:bg-gray-100',
                    data.user_reaction === reaction.name && 'bg-blue-100 scale-110'
                  )}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-full shadow-lg border border-gray-200 p-1 flex gap-0.5 mt-1">
              {/* Row 2 */}
              {REACTIONS.slice(5, 10).map((reaction) => (
                <button
                  key={reaction.name}
                  type="button"
                  onClick={() => handleReaction(reaction.name as ReactionType)}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-125 hover:bg-gray-100',
                    data.user_reaction === reaction.name && 'bg-blue-100 scale-110'
                  )}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reaction summary (non-compact mode) */}
      {!compact && data.total_count > 0 && reactionTypes.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 ml-1 cursor-pointer">
                <div className="flex -space-x-0.5">
                  {reactionTypes.map((type) => (
                    <span
                      key={type}
                      className="text-sm bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {getReactionEmoji(type)}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-2 max-w-xs">
              <div className="space-y-2">
                {/* Reaction breakdown */}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.reactions || {}).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-0.5"
                    >
                      <span>{getReactionEmoji(type as ReactionType)}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>

                {/* Recent users */}
                {data.recent_users && data.recent_users.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <div className="space-y-1">
                      {data.recent_users.map((user) => (
                        <div key={user.id} className="flex items-center gap-1.5">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gray-100 text-[7px]">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">
                            {user.full_name || 'Ukjent'}
                          </span>
                          <span className="text-sm">
                            {getReactionEmoji(user.reaction_type)}
                          </span>
                        </div>
                      ))}
                      {data.total_count > (data.recent_users?.length || 0) && (
                        <p className="text-[10px] text-gray-400">
                          og {data.total_count - data.recent_users.length} andre
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// Compact inline version for comments
export function InlineReactionPicker({
  postId,
  initialData,
  currentUserId,
  onReactionChange,
}: Omit<ReactionPickerProps, 'compact'>) {
  return (
    <ReactionPicker
      postId={postId}
      initialData={initialData}
      currentUserId={currentUserId}
      onReactionChange={onReactionChange}
      compact
    />
  )
}
