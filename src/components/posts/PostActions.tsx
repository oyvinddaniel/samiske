'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageCircle } from 'lucide-react'
import { LikeUser } from './types'
import { getInitials } from './utils'

interface PostActionsProps {
  liked: boolean
  likeCount: number
  commentCount: number
  likeUsers: LikeUser[]
  currentUserId?: string | null
  onLike: () => void
  onToggleComments: () => void
  onOpenDialog: () => void
}

export function PostActions({
  liked,
  likeCount,
  commentCount,
  likeUsers,
  currentUserId,
  onLike,
  onToggleComments,
  onOpenDialog,
}: PostActionsProps) {
  return (
    <div className="pt-1.5">
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-1.5 text-xs ${liked ? 'text-red-500' : 'text-gray-500'}`}
          onClick={onLike}
          disabled={!currentUserId}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-xs text-gray-500"
          onClick={onToggleComments}
        >
          <MessageCircle className="w-4 h-4 inline mr-1" /> {commentCount}
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5 text-gray-400 text-xs"
          onClick={onOpenDialog}
        >
          Se mer →
        </Button>
      </div>

      {/* Like users sneak peek */}
      {likeUsers.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 mt-1 cursor-pointer">
                <div className="flex -space-x-1">
                  {likeUsers.slice(0, 3).map((user) => (
                    <Avatar key={user.id} className="w-4 h-4 border border-white">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-[7px]">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 truncate flex-1">
                  Likt av <span className="font-medium">{likeUsers[0]?.full_name || 'Ukjent'}</span>
                  {likeCount > 1 && ` og ${likeCount - 1} andre`}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-1.5">
              <p className="text-xs font-medium mb-0.5">Likt av:</p>
              <div className="space-y-0.5">
                {likeUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-1">
                    <Avatar className="w-3.5 h-3.5">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-100 text-[7px]">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.full_name || 'Ukjent'}</span>
                  </div>
                ))}
                {likeCount > likeUsers.length && (
                  <p className="text-[9px] text-gray-400">
                    og {likeCount - likeUsers.length} andre
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
