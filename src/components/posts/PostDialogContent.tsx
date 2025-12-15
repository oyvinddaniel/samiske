'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pencil, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PostData, Comment, CommentLikeUser, categoryColors } from './types'
import { getInitials, formatDate, formatEventDate } from './utils'
import { RSVPButton } from '@/components/events/RSVPButton'
import { ShareEventDialog } from '@/components/events/ShareEventDialog'

interface CommentLikeData {
  count: number
  liked: boolean
  users: CommentLikeUser[]
}

interface PostDialogContentProps {
  postData: PostData
  liked: boolean
  likeCount: number
  commentCount: number
  comments: Comment[]
  loadingComments: boolean
  newComment: string
  replyingTo: string | null
  replyContent: string
  submitting: boolean
  currentUserId?: string | null
  isOwner: boolean
  commentLikes: Record<string, CommentLikeData>
  editingCommentId: string | null
  editCommentContent: string
  onLike: () => void
  onNewCommentChange: (value: string) => void
  onReplyContentChange: (value: string) => void
  onReplyingToChange: (commentId: string | null) => void
  onSubmitComment: (e: React.FormEvent, parentId: string | null) => void
  onDeleteComment: (commentId: string) => void
  onCommentLike: (commentId: string) => void
  onEdit: () => void
  onStartEditComment: (commentId: string, content: string) => void
  onSaveEditComment: (commentId: string) => void
  onCancelEditComment: () => void
  onEditCommentContentChange: (value: string) => void
}

export function PostDialogContent({
  postData,
  liked,
  likeCount,
  commentCount,
  comments,
  loadingComments,
  newComment,
  replyingTo,
  replyContent,
  submitting,
  currentUserId,
  isOwner,
  commentLikes,
  editingCommentId,
  editCommentContent,
  onLike,
  onNewCommentChange,
  onReplyContentChange,
  onReplyingToChange,
  onSubmitComment,
  onDeleteComment,
  onCommentLike,
  onEdit,
  onStartEditComment,
  onSaveEditComment,
  onCancelEditComment,
  onEditCommentContentChange,
}: PostDialogContentProps) {
  const categoryColor = postData.category?.color || categoryColors[postData.category?.slug || ''] || '#6B7280'
  const [showShareDialog, setShowShareDialog] = useState(false)

  // Render a single comment with replies
  const renderComment = (comment: Comment, depth = 0) => {
    const likeData = commentLikes[comment.id] || { count: 0, liked: false, users: [] }

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-2' : ''}`}>
        <div className="flex gap-1.5">
          <Avatar className="w-5 h-5 flex-shrink-0">
            <AvatarImage src={comment.user.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
              {getInitials(comment.user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {editingCommentId === comment.id ? (
              // Edit mode
              <div className="space-y-1.5">
                <Textarea
                  value={editCommentContent}
                  onChange={(e) => onEditCommentContentChange(e.target.value)}
                  className="resize-none text-sm min-h-[60px] py-2"
                  autoFocus
                />
                <div className="flex gap-1.5 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelEditComment}
                    className="h-7 text-xs"
                  >
                    Avbryt
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSaveEditComment(comment.id)}
                    disabled={submitting || !editCommentContent.trim()}
                    className="h-7 text-xs"
                    style={{ backgroundColor: '#1472E6' }}
                  >
                    {submitting ? 'Lagrer...' : 'Lagre'}
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                <div className="bg-gray-50 rounded-md px-2 py-1 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-900">
                        {comment.user.full_name || 'Ukjent'}
                      </span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>

                    {/* 3-dot menu for comment actions */}
                    {currentUserId === comment.user.id && (
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Kommentarmeny"
                            >
                              <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onStartEditComment(comment.id, comment.content)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Rediger
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteComment(comment.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Slett
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-0.5 px-0.5">
                  <span className="text-[9px] text-gray-400">
                    {formatDate(comment.created_at)}
                  </span>

                  {/* Comment like button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onCommentLike(comment.id)}
                          disabled={!currentUserId}
                          className={`text-[9px] hover:underline flex items-center gap-0.5 ${
                            likeData.liked ? 'text-red-500' : 'text-gray-400'
                          }`}
                        >
                          {likeData.liked ? '❤️' : '🤍'}
                          {likeData.count > 0 && <span>{likeData.count}</span>}
                        </button>
                      </TooltipTrigger>
                      {likeData.count > 0 && (
                        <TooltipContent side="top" className="p-1.5">
                          <p className="text-xs font-medium mb-0.5">Likt av:</p>
                          <div className="space-y-0.5">
                            {likeData.users.slice(0, 5).map((user) => (
                              <p key={user.id} className="text-xs">{user.full_name || 'Ukjent'}</p>
                            ))}
                            {likeData.count > 5 && (
                              <p className="text-[9px] text-gray-400">og {likeData.count - 5} andre</p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  {/* Reply button */}
                  {currentUserId && (
                    <button
                      onClick={() => onReplyingToChange(replyingTo === comment.id ? null : comment.id)}
                      className="text-[9px] text-gray-400 hover:underline"
                    >
                      Svar
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => onSubmitComment(e, comment.id)} className="mt-1.5 flex gap-1.5">
                <Textarea
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder={`Svar til ${comment.user.full_name || 'Ukjent'}...`}
                  rows={1}
                  className="resize-none text-sm min-h-[28px] py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-7 text-xs px-3 text-white rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 transition-all"
                  style={{ backgroundColor: '#1472E6' }}
                >
                  Svar
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1.5 space-y-1.5">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Author info with edit button */}
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={postData.user.avatar_url || undefined} />
          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
            {getInitials(postData.user.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">{postData.user.full_name || 'Ukjent'}</p>
          <p className="text-xs text-gray-500">{formatDate(postData.created_at)}</p>
        </div>
        {isOwner && (
          <button
            onClick={onEdit}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Rediger innlegg"
          >
            <Pencil className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {postData.category && (
          <Badge
            style={{ backgroundColor: categoryColor, color: 'white' }}
            className="text-xs"
          >
            {postData.category.name}
          </Badge>
        )}
      </div>

      {/* Event info */}
      {postData.type === 'event' && postData.event_date && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <span>📅 {formatEventDate(postData.event_date, postData.event_time)}</span>
            {postData.event_location && <span>📍 {postData.event_location}</span>}
          </div>
          {/* Share to other areas - for event owner */}
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Del til andre områder
            </Button>
          )}
        </div>
      )}

      {/* RSVP for events */}
      {postData.type === 'event' && (
        <RSVPButton
          postId={postData.id}
          isLoggedIn={!!currentUserId}
        />
      )}

      {/* Full content */}
      <p className="text-gray-700 whitespace-pre-wrap">{postData.content}</p>

      {/* Image */}
      {postData.image_url && (
        <div className="w-full overflow-hidden rounded-lg">
          <img
            src={postData.image_url}
            alt={postData.title}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className={`${liked ? 'text-red-500' : 'text-gray-500'}`}
          onClick={onLike}
          disabled={!currentUserId}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </Button>
        <span className="text-sm text-gray-500">
          <MessageCircle className="w-4 h-4 inline mr-1" /> {commentCount}
        </span>
      </div>

      {/* Comments - always visible */}
      <div className="space-y-3 pt-2 border-t">
        <h4 className="text-sm font-medium">Kommentarer ({commentCount})</h4>
        {loadingComments ? (
          <p className="text-xs text-gray-400">Laster kommentarer...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-500">Ingen kommentarer ennå</p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => renderComment(comment))}
          </div>
        )}

        {currentUserId ? (
          <form onSubmit={(e) => onSubmitComment(e, null)} className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => onNewCommentChange(e.target.value)}
              placeholder="Skriv en kommentar..."
              rows={1}
              className="resize-none text-sm"
            />
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? '...' : 'Send'}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Logg inn for å kommentere
          </p>
        )}
      </div>

      {/* Share Event Dialog */}
      {postData.type === 'event' && isOwner && (
        <ShareEventDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          postId={postData.id}
        />
      )}
    </div>
  )
}
