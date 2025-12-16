'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, MessageCircle, Pencil, Trash2, Heart } from 'lucide-react'
import { Comment, CommentLikeUser } from './types'
import { getInitials, formatDate } from './utils'

interface CommentLikeData {
  count: number
  liked: boolean
  users: CommentLikeUser[]
}

interface PostCommentsProps {
  comments: Comment[]
  previewComments: Comment[]
  commentCount: number
  showComments: boolean
  loadingComments: boolean
  newComment: string
  replyingTo: string | null
  replyContent: string
  submitting: boolean
  currentUserId?: string | null
  commentLikes: Record<string, CommentLikeData>
  editingCommentId: string | null
  editCommentContent: string
  onToggleComments: () => void
  onNewCommentChange: (value: string) => void
  onReplyContentChange: (value: string) => void
  onReplyingToChange: (commentId: string | null) => void
  onSubmitComment: (e: React.FormEvent, parentId: string | null) => void
  onDeleteComment: (commentId: string) => void
  onCommentLike: (commentId: string) => void
  onProfileClick: (userId: string) => void
  onStartEditComment: (commentId: string, content: string) => void
  onSaveEditComment: (commentId: string) => void
  onCancelEditComment: () => void
  onEditCommentContentChange: (value: string) => void
}

export function PostComments({
  comments,
  previewComments,
  commentCount,
  showComments,
  loadingComments,
  newComment,
  replyingTo,
  replyContent,
  submitting,
  currentUserId,
  commentLikes,
  editingCommentId,
  editCommentContent,
  onToggleComments,
  onNewCommentChange,
  onReplyContentChange,
  onReplyingToChange,
  onSubmitComment,
  onDeleteComment,
  onCommentLike,
  onProfileClick,
  onStartEditComment,
  onSaveEditComment,
  onCancelEditComment,
  onEditCommentContentChange,
}: PostCommentsProps) {
  // Render a single comment with replies
  const renderComment = (comment: Comment, depth = 0) => {
    const likeData = commentLikes[comment.id] || { count: 0, liked: false, users: [] }

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-2' : ''}`}>
        <div className="flex gap-1.5">
          <button onClick={() => onProfileClick(comment.user.id)} className="focus:outline-none flex-shrink-0">
            <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
              <AvatarImage src={comment.user.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
                {getInitials(comment.user.full_name)}
              </AvatarFallback>
            </Avatar>
          </button>
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
                      <button
                        onClick={() => onProfileClick(comment.user.id)}
                        className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none truncate max-w-[150px] sm:max-w-[200px] md:max-w-none"
                      >
                        {comment.user.full_name || 'Ukjent'}
                      </button>
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
                            likeData.liked ? 'text-red-500' : likeData.count > 0 ? 'text-red-500' : 'text-gray-400'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${likeData.liked ? 'fill-current' : ''}`} />
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
              <form onSubmit={(e) => onSubmitComment(e, comment.id)} className="mt-1.5 flex flex-col sm:flex-row gap-1.5">
                <Textarea
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder={`Svar til ${comment.user.full_name || 'Ukjent'}...`}
                  rows={1}
                  className="flex-1 resize-none text-sm min-h-[28px] py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto h-7 text-xs px-3 text-white rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 transition-all"
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
    <>
      {/* Divider */}
      <div className="mx-2 mt-2 mb-[15px] border-t border-gray-100" />

      {/* Preview comments - sneak peek */}
      {previewComments.length > 0 && !showComments && (
        <div className="space-y-1.5 mb-3">
          {previewComments.map((comment) => {
            const likeData = commentLikes[comment.id] || { count: 0, liked: false, users: [] }

            return (
              <div key={comment.id} className="flex gap-1.5">
                <button onClick={() => onProfileClick(comment.user.id)} className="focus:outline-none flex-shrink-0">
                  <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                    <AvatarImage src={comment.user.avatar_url || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
                      {getInitials(comment.user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-md px-2 py-1 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onProfileClick(comment.user.id)}
                          className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none"
                        >
                          {comment.user.full_name || 'Ukjent'}
                        </button>
                        <p className="text-sm text-gray-700 line-clamp-2">
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
                              likeData.liked ? 'text-red-500' : likeData.count > 0 ? 'text-red-500' : 'text-gray-400'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${likeData.liked ? 'fill-current' : ''}`} />
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
                </div>
              </div>
            )
          })}
          {commentCount > 2 && (
            <button
              onClick={onToggleComments}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Se alle {commentCount} kommentarer
            </button>
          )}
        </div>
      )}

      {/* Comment input - always visible */}
      {currentUserId ? (
        <form onSubmit={(e) => onSubmitComment(e, null)} className="flex gap-1.5 items-stretch">
          <Textarea
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            placeholder="Skriv en kommentar..."
            rows={1}
            className="resize-none text-sm min-h-[38px] py-2"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="h-[38px] px-4 text-xs text-white rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 transition-all"
            style={{ backgroundColor: '#1472E6' }}
          >
            {submitting ? '...' : 'Send'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-gray-500 bg-gray-50 p-1.5 rounded">
          Logg inn for å kommentere
        </p>
      )}

      {/* Expanded comments list */}
      {showComments && (
        <div className="mt-2 space-y-2">
          {loadingComments ? (
            <div className="text-xs text-gray-400">Laster kommentarer...</div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-1">
              Ingen kommentarer ennå
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
