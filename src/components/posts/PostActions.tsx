'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ReactionPicker } from './ReactionPicker'
import type { ReactionType } from './composer/constants'

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

interface PostActionsProps {
  postId: string
  reactionData?: ReactionData | null
  commentCount: number
  currentUserId?: string | null
  onReactionChange?: (data: ReactionData) => void
  onToggleComments: () => void
  onOpenDialog: () => void
  commentsSinceOpened?: number
  showComments?: boolean
}

export function PostActions({
  postId,
  reactionData,
  commentCount,
  currentUserId,
  onReactionChange,
  onToggleComments,
  onOpenDialog,
  commentsSinceOpened = 0,
  showComments = false,
}: PostActionsProps) {
  return (
    <div className="pt-1.5">
      <div className="flex items-center gap-0.5">
        <ReactionPicker
          postId={postId}
          initialData={reactionData}
          currentUserId={currentUserId}
          onReactionChange={onReactionChange}
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs text-gray-500 relative"
          onClick={onToggleComments}
          aria-label={`Vis kommentarer (${commentCount})`}
        >
          <MessageCircle className="w-4 h-4 inline mr-1" /> {commentCount}

          {/* New comments badge */}
          {commentsSinceOpened > 0 && !showComments && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {commentsSinceOpened}
            </span>
          )}
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-gray-400 text-xs"
          onClick={onOpenDialog}
          aria-label="Se mer om innlegget"
        >
          Se mer →
        </Button>
      </div>
    </div>
  )
}
