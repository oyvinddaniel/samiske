'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
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
import { Pencil, Trash2, MapPin, Share2, Bookmark, BookmarkCheck, Flag, Package, Briefcase, ExternalLink, Users, Building2, MoreVertical } from 'lucide-react'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'
import { RSVPButton } from '@/components/events/RSVPButton'
import { ReportDialog } from '@/components/reports'
import { usePostCard } from '@/hooks/usePostCard'
import { useProfileHover } from '@/hooks/useProfileHover'

// Import child components
import { PostActions } from './PostActions'
import { PostComments } from './PostComments'
import { EditPostDialog } from './EditPostDialog'
import { PostDialogContent } from './PostDialogContent'

// Import types and utils
import { PostCardProps, categoryColors } from './types'
import { getInitials, formatDate, formatEventDate } from './utils'

export function PostCard({ post, currentUserId, onClick }: PostCardProps) {
  const {
    // State
    liked,
    likeCount,
    likeUsers,
    showComments,
    comments,
    commentCount,
    loadingComments,
    newComment,
    replyingTo,
    replyContent,
    submitting,
    commentLikes,
    previewComments,
    showDialog,
    isEditing,
    showReportDialog,
    editTitle,
    editContent,
    editEventDate,
    editEventTime,
    editEventLocation,
    editGeography,
    saving,
    postData,
    isDeleted,
    deleting,
    bookmarked,
    bookmarking,
    isOwner,
    isBlurred,
    editingCommentId,
    editCommentContent,
    // Setters
    setNewComment,
    setReplyingTo,
    setReplyContent,
    setEditCommentContent,
    setShowDialog,
    setShowReportDialog,
    setEditTitle,
    setEditContent,
    setEditEventDate,
    setEditEventTime,
    setEditEventLocation,
    setEditGeography,
    // Handlers
    handleLike,
    handleCommentLike,
    handleToggleComments,
    handleSubmitComment,
    handleDeleteComment,
    handleStartEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeletePost,
    handleShare,
    handleBookmark,
    fetchComments,
  } = usePostCard({ post, currentUserId })

  const profileHover = useProfileHover(postData.user.id)
  const categoryColor = postData.category?.color || categoryColors[postData.category?.slug || ''] || '#6B7280'

  const openDialog = () => {
    if (onClick) {
      onClick()
    } else {
      setShowDialog(true)
    }
  }

  if (isDeleted) {
    return null
  }

  return (
    <>
      <Card id={`post-${postData.id}`} className={`overflow-hidden hover:shadow-md transition-shadow w-full ${isBlurred ? 'relative' : ''} !pt-0 !pb-0 !gap-0`}>
        {/* Blue accent bar at top */}
        <div className="h-3" style={{ backgroundColor: '#1472E6' }} />
        <CardContent className="p-4">
          {/* Blur overlay for members-only content */}
          {isBlurred && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="text-center p-3">
                <div className="text-xl mb-1">🔒</div>
                <p className="text-sm font-medium text-gray-700">Kun for medlemmer</p>
                <Link href="/login">
                  <Button size="sm" className="mt-1.5 h-7 text-xs">Logg inn</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Top row: avatar, name, time, category */}
          <div className="flex items-center gap-1 mb-1.5">
            <div
              onMouseEnter={profileHover.handleMouseEnter}
              onMouseLeave={profileHover.handleMouseLeave}
            >
              <button
                onClick={profileHover.handleClick}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                aria-label={`Vis profil for ${postData.user.full_name || 'Ukjent'}`}
              >
                <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                  <AvatarImage src={postData.user.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-[9px]">
                    {getInitials(postData.user.full_name)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
            <button
              onClick={profileHover.handleClick}
              onMouseEnter={profileHover.handleMouseEnter}
              onMouseLeave={profileHover.handleMouseLeave}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded truncate max-w-[100px] sm:max-w-[150px] md:max-w-none"
              aria-label={`Vis profil for ${postData.user.full_name || 'Ukjent'}`}
            >
              {postData.user.full_name || 'Ukjent'}
            </button>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(postData.created_at)}</span>
            {postData.posted_from_name && postData.posted_from_type !== 'private' && (
              <>
                <span className="text-xs text-gray-400 hidden sm:inline">·</span>
                <span className="hidden sm:flex items-center gap-0.5 text-xs text-gray-500 truncate">
                  {postData.posted_from_type === 'group' && <Users className="w-3 h-3" />}
                  {postData.posted_from_type === 'community' && <Building2 className="w-3 h-3" />}
                  {(postData.posted_from_type === 'place' || postData.posted_from_type === 'municipality') && <MapPin className="w-3 h-3" />}
                  {postData.posted_from_name}
                </span>
              </>
            )}
            <div className="flex-1" />

            {/* Visibility icon */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <img
                      src={postData.visibility === 'members' ? '/images/lock.png' : '/images/globe.png'}
                      alt={postData.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig'}
                      className="w-3.5 h-3.5"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {postData.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig synlig'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Meny"
                  aria-label="Åpne meny"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 sm:w-48 max-w-[calc(100vw-32px)]">
                {/* Share - available to everyone */}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Del
                </DropdownMenuItem>

                {/* Bookmark - for logged in users */}
                {currentUserId && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleBookmark(); }}
                    disabled={bookmarking}
                  >
                    {bookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        Fjern bokmerke
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Lagre
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {/* Edit and Delete - for owner only */}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDialog(true); handleStartEdit(); }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rediger
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleDeletePost(); }}
                      disabled={deleting}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slett
                    </DropdownMenuItem>
                  </>
                )}

                {/* Report - for logged in users (not owner) */}
                {currentUserId && !isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowReportDialog(true); }}>
                      <Flag className="w-4 h-4 mr-2" />
                      Rapporter
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title - opens dialog */}
          <button onClick={openDialog} className="text-left w-full">
            <h3 className="font-semibold text-base md:text-lg text-gray-900 hover:text-blue-600 transition-colors mb-1">
              {postData.title}
            </h3>
          </button>

          {/* Event info (compact) */}
          {postData.type === 'event' && postData.event_date && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600 mb-1.5 bg-gray-50 rounded px-2 py-1.5">
              <span>📅 {formatEventDate(postData.event_date, postData.event_time)}</span>
              {postData.event_location && <span className="truncate">📍 {postData.event_location}</span>}
            </div>
          )}

          {/* RSVP buttons for events */}
          {postData.type === 'event' && (
            <div className="mb-2">
              <RSVPButton
                postId={postData.id}
                isLoggedIn={!!currentUserId}
                compact={true}
              />
            </div>
          )}

          {/* Content preview */}
          <p className="text-gray-600 text-base line-clamp-2 mb-1.5">{postData.content}</p>

          {/* Promoted Product */}
          {postData.product && postData.product_id && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3 mb-2 border border-blue-200">
              <div className="flex gap-2 sm:gap-3">
                {/* Product image */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded overflow-hidden flex-shrink-0 bg-white">
                  {(postData.product.primary_image || (postData.product.images && postData.product.images[0])) ? (
                    <img
                      src={postData.product.primary_image || postData.product.images[0]}
                      alt={postData.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs mb-1">
                        <Package className="w-3 h-3 mr-1" />
                        Produkt
                      </Badge>
                      <p className="font-semibold text-sm text-gray-900 truncate">{postData.product.name}</p>
                    </div>
                  </div>

                  {postData.product.price && (
                    <p className="text-sm font-bold text-blue-600">
                      {postData.product.price.toLocaleString('nb-NO')} {postData.product.currency || 'NOK'}
                    </p>
                  )}

                  <Button asChild size="sm" className="mt-2 h-7 text-xs">
                    <Link href={`/produkter/${postData.product.id}`}>
                      Se produkt
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Promoted Service */}
          {postData.service && postData.service_id && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 sm:p-3 mb-2 border border-purple-200">
              <div className="flex gap-2 sm:gap-3">
                {/* Service image */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded overflow-hidden flex-shrink-0 bg-white">
                  {(postData.service.images && postData.service.images[0]) ? (
                    <img
                      src={postData.service.images[0]}
                      alt={postData.service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Service info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs mb-1">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Tjeneste
                      </Badge>
                      <p className="font-semibold text-sm text-gray-900 truncate">{postData.service.name}</p>
                    </div>
                  </div>

                  {postData.service.price && (
                    <p className="text-sm font-bold text-purple-600">
                      {postData.service.price.toLocaleString('nb-NO')} {postData.service.currency || 'NOK'}
                      {postData.service.price_type === 'hourly' && '/time'}
                    </p>
                  )}

                  <Button asChild size="sm" className="mt-2 h-7 text-xs">
                    <Link href={`/tjenester/${postData.service.id}`}>
                      Se tjeneste
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {postData.image_url && (
            <button
              onClick={openDialog}
              className="w-full overflow-hidden rounded-md bg-gray-100 mb-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Åpne innlegg: ${postData.title}`}
            >
              <img
                src={postData.image_url}
                alt={postData.title}
                className="w-full h-auto"
              />
            </button>
          )}

          {/* Actions */}
          <PostActions
            liked={liked}
            likeCount={likeCount}
            commentCount={commentCount}
            likeUsers={likeUsers}
            currentUserId={currentUserId}
            onLike={handleLike}
            onToggleComments={handleToggleComments}
            onOpenDialog={openDialog}
          />

          {/* Comments */}
          <PostComments
            comments={comments}
            previewComments={previewComments}
            commentCount={commentCount}
            showComments={showComments}
            loadingComments={loadingComments}
            newComment={newComment}
            replyingTo={replyingTo}
            replyContent={replyContent}
            submitting={submitting}
            currentUserId={currentUserId}
            commentLikes={commentLikes}
            editingCommentId={editingCommentId}
            editCommentContent={editCommentContent}
            onToggleComments={handleToggleComments}
            onNewCommentChange={setNewComment}
            onReplyContentChange={setReplyContent}
            onReplyingToChange={setReplyingTo}
            onSubmitComment={handleSubmitComment}
            onDeleteComment={handleDeleteComment}
            onCommentLike={handleCommentLike}
            onStartEditComment={handleStartEditComment}
            onSaveEditComment={handleSaveEditComment}
            onCancelEditComment={handleCancelEditComment}
            onEditCommentContentChange={setEditCommentContent}
            onProfileClick={(userId) => {
              window.dispatchEvent(
                new CustomEvent('open-user-profile-panel', {
                  detail: { userId }
                })
              )
            }}
          />
        </CardContent>

        {/* Profile overlay */}
        {profileHover.showOverlay && (
          <ProfileOverlay
            userId={postData.user.id}
            onClose={profileHover.handleForceClose}
            onMouseEnter={profileHover.handleMouseEnter}
          />
        )}

        {/* Report dialog */}
        {currentUserId && (
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            postId={postData.id}
            currentUserId={currentUserId}
          />
        )}
      </Card>

      {/* Post BottomSheet */}
      {!onClick && (
        <BottomSheet
          open={showDialog}
          onClose={() => { setShowDialog(false); if (isEditing) handleCancelEdit(); }}
          onOpen={() => { if (comments.length === 0) fetchComments(); }}
          title={isEditing ? 'Rediger innlegg' : postData.title}
          confirmClose={isEditing}
          confirmMessage="Er du sikker på at du vil avbryte? Endringer vil gå tapt."
        >
          <div className="py-4 pb-[100px]">
            {isEditing ? (
              <EditPostDialog
                postData={postData}
                editTitle={editTitle}
                editContent={editContent}
                editEventDate={editEventDate}
                editEventTime={editEventTime}
                editEventLocation={editEventLocation}
                editGeography={editGeography}
                saving={saving}
                onEditTitleChange={setEditTitle}
                onEditContentChange={setEditContent}
                onEditEventDateChange={setEditEventDate}
                onEditEventTimeChange={setEditEventTime}
                onEditEventLocationChange={setEditEventLocation}
                onEditGeographyChange={setEditGeography}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            ) : (
              <PostDialogContent
                postData={postData}
                liked={liked}
                likeCount={likeCount}
                commentCount={commentCount}
                comments={comments}
                loadingComments={loadingComments}
                newComment={newComment}
                replyingTo={replyingTo}
                replyContent={replyContent}
                submitting={submitting}
                currentUserId={currentUserId}
                isOwner={isOwner}
                commentLikes={commentLikes}
                editingCommentId={editingCommentId}
                editCommentContent={editCommentContent}
                onLike={handleLike}
                onNewCommentChange={setNewComment}
                onReplyContentChange={setReplyContent}
                onReplyingToChange={setReplyingTo}
                onSubmitComment={handleSubmitComment}
                onDeleteComment={handleDeleteComment}
                onCommentLike={handleCommentLike}
                onEdit={handleStartEdit}
                onStartEditComment={handleStartEditComment}
                onSaveEditComment={handleSaveEditComment}
                onCancelEditComment={handleCancelEditComment}
                onEditCommentContentChange={setEditCommentContent}
              />
            )}
          </div>
        </BottomSheet>
      )}
    </>
  )
}

