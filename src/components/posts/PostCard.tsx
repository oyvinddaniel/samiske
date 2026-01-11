'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Pencil, Trash2, MapPin, Share2, Bookmark, BookmarkCheck, Flag, Package, Briefcase, ExternalLink, Users, Building2, MoreVertical, Pin, PinOff, Lock, Globe, BarChart3, Archive, ArchiveRestore, Repeat } from 'lucide-react'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'
import { RSVPButton } from '@/components/events/RSVPButton'
import { ReportDialog } from '@/components/reports'
import { usePostCard } from '@/hooks/usePostCard'
import { useProfileHover } from '@/hooks/useProfileHover'

// Import child components
import { PostActions } from './PostActions'
import { PostComments } from './PostComments'
import { PostStats } from './PostStats'
import { EditPostDialog } from './EditPostDialog'
import { ImageGalleryPreview } from './ImageGallery'
import { VideoPlayer } from './VideoPlayer'
import { Poll } from './Poll'
import { MentionText } from '@/components/mentions'
import { AdvancedGalleryViewer } from '@/components/gallery'
import type { GalleryImage } from '@/lib/types/gallery'
import { convertPostToGalleryFormatSync } from '@/lib/utils/galleryConverters'

// Import types and utils
import { PostCardProps, categoryColors } from './types'
import { getInitials, formatDate, formatEventDate } from './utils'

export function PostCard({ post, currentUserId, onClick, canPin, onPin }: PostCardProps) {
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [imageViewerIndex, setImageViewerIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const {
    // State
    reactionData,
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
    archived,
    archiving,
    isOwner,
    isBlurred,
    editingCommentId,
    editCommentContent,
    // Setters
    setNewComment,
    setReplyingTo,
    setReplyContent,
    setEditCommentContent,
    setShowReportDialog,
    setEditTitle,
    setEditContent,
    setEditEventDate,
    setEditEventTime,
    setEditEventLocation,
    setEditGeography,
    // Handlers
    handleReactionChange,
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
    handleArchivePost,
    fetchComments,
    // New handlers
    reposted,
    reposting,
    handleRepost,
    handleRestorePost,
    commentsSinceOpened,
  } = usePostCard({ post, currentUserId })

  const profileHover = useProfileHover(postData.user.id)
  const categoryColor = postData.category?.color || categoryColors[postData.category?.slug || ''] || '#6B7280'

  const toggleExpand = () => {
    if (onClick) {
      onClick()
    } else {
      const newExpanded = !expanded
      setExpanded(newExpanded)
      if (newExpanded && comments.length === 0) {
        fetchComments()
      }
    }
  }

  if (isDeleted) {
    return null
  }

  return (
    <>
      <Card id={`post-${postData.id}`} className={`overflow-hidden hover:shadow-md transition-all duration-500 ease-out w-full max-w-full ${isBlurred ? 'relative' : ''} ${expanded ? 'ring-2 ring-blue-200 shadow-lg scale-[1.01]' : 'scale-100'} !pt-0 !pb-0 !gap-0`}>
        {/* Blue accent bar at top */}
        <div className="h-3" style={{ backgroundColor: '#1472E6' }} />
        <CardContent className="!px-2 !py-2 sm:!px-4 sm:!py-4">
          {/* Blur overlay for members-only content */}
          {isBlurred && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="text-center p-3">
                <Lock className="w-6 h-6 mx-auto mb-1 text-gray-600" />
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
            {/* Edited badge */}
            {postData.edited_at && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-500 cursor-help">
                        redigert
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Redigert {formatDate(postData.edited_at)}
                      {postData.edit_count && postData.edit_count > 1 && ` (${postData.edit_count} ganger)`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
            {postData.posted_from_name && postData.posted_from_type !== 'private' && (
              <>
                <span className="text-xs text-gray-400 hidden sm:inline">·</span>
                <span className="hidden sm:flex items-center gap-0.5 text-xs text-gray-500 truncate">
                  {postData.posted_from_type === 'community' && <Building2 className="w-3 h-3" />}
                  {(postData.posted_from_type === 'place' || postData.posted_from_type === 'municipality') && <MapPin className="w-3 h-3" />}
                  {postData.posted_from_name}
                </span>
              </>
            )}
            {/* Direct geography tag (when not posted from a context) */}
            {!postData.posted_from_name && (postData.place?.name || postData.municipality?.name) && (
              <>
                <span className="text-xs text-gray-400 hidden sm:inline">·</span>
                <span className="hidden sm:flex items-center gap-0.5 text-xs text-gray-500 truncate">
                  <MapPin className="w-3 h-3" />
                  {postData.place?.name || postData.municipality?.name}
                </span>
              </>
            )}
            <div className="flex-1" />

            {/* Visibility icon */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    {postData.visibility !== 'public' ? (
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {postData.visibility === 'friends' ? 'Kun for venner' :
                   postData.visibility === 'circles' ? 'Kun for vennekretser' :
                   'Offentlig synlig'}
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

                {/* Repost - for logged in users */}
                {currentUserId && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleRepost(); }}
                    disabled={reposting}
                  >
                    {reposted ? (
                      <>
                        <Repeat className="w-4 h-4 mr-2" />
                        Fjern repost
                      </>
                    ) : (
                      <>
                        <Repeat className="w-4 h-4 mr-2" />
                        Repost til min feed
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {/* Pin - for group admins/moderators */}
                {canPin && onPin && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onPin(postData.id, !postData.pinned)
                    }}
                  >
                    {postData.pinned ? (
                      <>
                        <PinOff className="w-4 h-4 mr-2" />
                        Fjern fra toppen
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4 mr-2" />
                        Fest til toppen
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {/* Edit, Archive and Delete - for owner only */}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setExpanded(true); handleStartEdit(); }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rediger
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleArchivePost(); }}
                      disabled={archiving}
                    >
                      {archived ? (
                        <>
                          <ArchiveRestore className="w-4 h-4 mr-2" />
                          Gjenopprett
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4 mr-2" />
                          Arkiver
                        </>
                      )}
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

                {/* Restore - for owner of deleted posts */}
                {isOwner && isDeleted && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleRestorePost(); }}
                    className="text-green-600 focus:text-green-600"
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Gjenopprett
                  </DropdownMenuItem>
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

          {/* Title - toggles expand */}
          <button onClick={toggleExpand} className="text-left w-full">
            <div className="flex items-start gap-2">
              {postData.pinned && (
                <Pin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-base md:text-lg text-gray-900 hover:text-blue-600 transition-colors mb-1 break-words">
                {postData.title}
              </h3>
            </div>
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

          {/* Content - preview when collapsed, full when expanded - clickable to expand */}
          <button
            onClick={toggleExpand}
            className="text-left w-full cursor-pointer"
          >
            <div className={`text-gray-600 text-base mb-1.5 break-words whitespace-pre-wrap transition-all duration-500 ease-out overflow-hidden ${expanded ? 'max-h-[2000px]' : 'max-h-[3.5em] line-clamp-2'}`}>
              <MentionText content={postData.content} />
            </div>
          </button>

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
                      className="w-full h-full object-cover max-w-full"
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
                      className="w-full h-full object-cover max-w-full"
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

          {/* Poll - if post has a poll */}
          <Poll postId={postData.id} />

          {/* Video Player - Bunny Stream */}
          {postData.video && postData.video.playback_url && (
            <div className="mb-1.5">
              <VideoPlayer
                playbackUrl={postData.video.playback_url}
                thumbnailUrl={postData.video.thumbnail_url}
                title={postData.title}
              />
            </div>
          )}

          {/* Image Gallery - clickable: expand if collapsed, fullscreen if expanded */}
          {/* Use images array from post_images table, fallback to single image_url for backwards compatibility */}
          {!postData.video && ((postData.images && postData.images.length > 0) || postData.image_url) && (() => {
            const imageUrls = postData.images && postData.images.length > 0
              ? postData.images.map(img => img.url)
              : [postData.image_url!]

            return (
              <div className="mb-1.5">
                <ImageGalleryPreview
                  images={imageUrls}
                  alt={postData.title}
                  onImageClick={(index) => {
                    // Always open gallery in masonry mode (don't require expand first)
                    setImageViewerIndex(index)
                    setShowImageViewer(true)
                  }}
                />
              </div>
            )
          })()}

          {/* Actions */}
          <PostActions
            postId={postData.id}
            reactionData={reactionData}
            commentCount={commentCount}
            currentUserId={currentUserId}
            onReactionChange={handleReactionChange}
            onToggleComments={handleToggleComments}
            onOpenDialog={toggleExpand}
            commentsSinceOpened={commentsSinceOpened}
            showComments={showComments}
          />

          {/* Statistics for post owner */}
          {isOwner && expanded && (
            <div className="flex justify-end mt-2">
              <PostStats postId={postData.id} isOwner={true} />
            </div>
          )}

          {/* Inline Edit Post - when editing */}
          {expanded && isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
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
            </div>
          )}

          {/* Comments - show full list when expanded */}
          <PostComments
            comments={comments}
            previewComments={previewComments}
            commentCount={commentCount}
            showComments={showComments || expanded}
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

          {/* Collapse button when expanded */}
          {expanded && (
            <button
              onClick={toggleExpand}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
            >
              Vis mindre ↑
            </button>
          )}
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


      {/* Advanced Gallery Viewer with Comments & Likes - Masonry Mode */}
      {showImageViewer && ((postData.images && postData.images.length > 0) || postData.image_url) && (() => {
        // Use converter to get proper gallery format with post context
        const { context, images } = convertPostToGalleryFormatSync(postData, currentUserId || undefined)

        return (
          <AdvancedGalleryViewer
            images={images}
            initialIndex={imageViewerIndex}
            initialMode="masonry"
            context={context}
            onClose={() => setShowImageViewer(false)}
          />
        )
      })()}
    </>
  )
}

