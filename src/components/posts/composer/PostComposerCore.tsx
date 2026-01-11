'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MentionTextarea } from '@/components/mentions'
import { VisibilityPicker } from '@/components/circles'
import { GeographySearchInput, type GeographySelection } from '@/components/geography'
import { GifPicker } from './GifPicker'
import { ImageEditor, type ImageEdits } from './ImageEditor'
import { PollEditor } from './PollEditor'
import { EmojiPicker } from './EmojiPicker'
import { VideoUploadCard } from './VideoUploadCard'
import { VideoDragDropZone } from './VideoDragDropZone'
import {
  X,
  ImagePlus,
  Video,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Pencil,
  BarChart3,
  Smile,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UsePostComposerReturn } from './usePostComposer'
import type { ComposerVariant, MediaItem } from './types'

interface PostComposerCoreProps {
  composer: UsePostComposerReturn
  variant?: ComposerVariant
  showGeography?: boolean
  className?: string
}

export function PostComposerCore({
  composer,
  variant = 'sheet',
  showGeography = true,
  className,
}: PostComposerCoreProps) {
  const {
    state,
    categories,
    isValid,
    canSubmit,
    setTitle,
    setContent,
    setPostType,
    setVisibility,
    setCategory,
    setEventDetails,
    setGeography,
    setPoll,
    addMedia,
    addGif,
    removeMedia,
    updateMedia,
    updateMediaCaption,
    submit,
  } = composer

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPollEditor, setShowPollEditor] = useState(false)
  const [showVideoDragZone, setShowVideoDragZone] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)

  // Separate video from other media
  const videoMedia = state.media.find((m) => m.type === 'video')
  const otherMedia = state.media.filter((m) => m.type !== 'video')

  // Handle file selection
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      const files = e.target.files
      if (!files) return

      for (const file of Array.from(files)) {
        await addMedia(file)
      }

      // Reset input
      e.target.value = ''
    },
    [addMedia]
  )

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  // Handle image edit save
  const handleImageEditSave = useCallback(
    async (edits: ImageEdits, croppedBlob: Blob) => {
      if (!editingMedia) return

      // Create file from blob
      const editedFile = new File([croppedBlob], `edited-${editingMedia.id}.jpg`, {
        type: 'image/jpeg',
      })

      // Create thumbnail URL from the edited blob
      const editedUrl = URL.createObjectURL(croppedBlob)

      // Update the media item
      updateMedia(editingMedia.id, {
        edits,
        editedFile,
        thumbnailUrl: editedUrl,
        originalUrl: editingMedia.originalUrl || editingMedia.thumbnailUrl,
      })

      setEditingMedia(null)
    },
    [editingMedia, updateMedia]
  )

  // Handle emoji selection
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setContent(state.content + emoji, state.mentions)
      setShowEmojiPicker(false)
    },
    [state.content, state.mentions, setContent]
  )

  // Handle video from drag-drop zone
  const handleVideoFromDragZone = useCallback(
    async (file: File) => {
      await addMedia(file)
      setShowVideoDragZone(false)
    },
    [addMedia]
  )

  const isCompact = variant === 'inline'

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Error message */}
      {state.error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {/* Post type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPostType('standard')}
          className={cn(
            'flex-1 py-2 px-3 text-sm rounded-lg border transition-colors',
            state.type === 'standard'
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          Innlegg
        </button>
        <button
          type="button"
          onClick={() => setPostType('event')}
          className={cn(
            'flex-1 py-2 px-3 text-sm rounded-lg border transition-colors',
            state.type === 'event'
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          )}
        >
          Arrangement
        </button>
      </div>

      {/* Title */}
      <Input
        value={state.title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tittel"
        required
        className="text-base"
      />

      {/* Content with mentions */}
      <MentionTextarea
        value={state.content}
        onChange={(content, mentions) => setContent(content, mentions)}
        placeholder="Hva vil du dele? Bruk @ for å nevne noen"
        rows={isCompact ? 3 : 4}
        required
        className="text-base"
      />

      {/* Event fields */}
      {state.type === 'event' && (
        <div className="p-3 bg-orange-50 rounded-lg space-y-3">
          <div className="space-y-1">
            <Label htmlFor="eventDate" className="text-xs text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Dato
            </Label>
            <Input
              id="eventDate"
              type="date"
              value={state.eventDate}
              onChange={(e) => setEventDetails({ date: e.target.value })}
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="eventTime" className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Fra
              </Label>
              <Input
                id="eventTime"
                type="time"
                value={state.eventTime}
                onChange={(e) => setEventDetails({ time: e.target.value })}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eventEndTime" className="text-xs text-gray-600">
                Til (valgfritt)
              </Label>
              <Input
                id="eventEndTime"
                type="time"
                value={state.eventEndTime}
                onChange={(e) => setEventDetails({ endTime: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="eventLocation" className="text-xs text-gray-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Sted
            </Label>
            <Input
              id="eventLocation"
              value={state.eventLocation}
              onChange={(e) => setEventDetails({ location: e.target.value })}
              placeholder="F.eks. Studentersamfundet"
              required
              className="h-9"
            />
          </div>
        </div>
      )}

      {/* Category & Visibility */}
      <div className="flex gap-2">
        <select
          value={state.categoryId}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Kategori...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {showGeography && !state.geography && (
          <VisibilityPicker
            value={state.visibility}
            selectedCircles={state.selectedCircles}
            onChange={(visibility, circles) => setVisibility(visibility, circles)}
            compact
          />
        )}
      </div>

      {/* Geography */}
      {showGeography && (
        state.groupId || state.communityId ? null : state.geography ? (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Publiserer til
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 flex-1">
                {state.geography.name}
              </span>
              <button
                type="button"
                onClick={() => setGeography(null)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-3 h-3 text-blue-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Knytt til sted (valgfritt)
            </Label>
            <GeographySearchInput
              value={null}
              onChange={(geo: GeographySelection | null) => setGeography(geo)}
              placeholder="Søk etter sted, kommune eller språkområde..."
            />
          </div>
        )
      )}

      {/* Video Preview - Dedicated large card */}
      {videoMedia && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Video</Label>
          <VideoUploadCard
            video={videoMedia}
            onRemove={() => removeMedia(videoMedia.id)}
          />
        </div>
      )}

      {/* Video Drag & Drop Zone (when no video) */}
      {!videoMedia && showVideoDragZone && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Legg til video</Label>
          <VideoDragDropZone
            onVideoSelect={handleVideoFromDragZone}
            maxSize={500}
            maxDuration={600}
          />
          <button
            type="button"
            onClick={() => setShowVideoDragZone(false)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Avbryt
          </button>
        </div>
      )}

      {/* Images and GIFs preview - Grid layout */}
      {otherMedia.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">
            Bilder og GIFs ({otherMedia.length})
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {otherMedia.map((media) => (
              <MediaPreviewItem
                key={media.id}
                media={media}
                onRemove={() => removeMedia(media.id)}
                onEdit={media.type === 'image' ? () => setEditingMedia(media) : undefined}
                onCaptionChange={updateMediaCaption}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image editor modal */}
      {editingMedia && editingMedia.type === 'image' && (editingMedia.originalUrl || editingMedia.thumbnailUrl) && (
        <ImageEditor
          imageUrl={editingMedia.originalUrl || editingMedia.thumbnailUrl!}
          initialEdits={editingMedia.edits}
          onSave={handleImageEditSave}
          onCancel={() => setEditingMedia(null)}
        />
      )}

      {/* Media toolbar */}
      <div className="flex items-center gap-2 py-2 border-t border-gray-100 relative">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Bilde</span>
        </button>

        <button
          type="button"
          onClick={() => setShowVideoDragZone(!showVideoDragZone)}
          disabled={!!videoMedia}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
            videoMedia
              ? "text-gray-400 cursor-not-allowed"
              : showVideoDragZone
              ? "text-purple-600 bg-purple-50"
              : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
          )}
          title={videoMedia ? "Kun én video per innlegg" : "Legg til video"}
        >
          <Video className="w-4 h-4" />
          <span className="hidden sm:inline">Video</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGifPicker(!showGifPicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
        >
          <span className="text-base font-medium">GIF</span>
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
          title="Legg til emoji"
        >
          <Smile className="w-4 h-4" />
          <span className="hidden sm:inline">Emoji</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPollEditor(!showPollEditor)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
            state.poll
              ? "text-green-600 bg-green-50"
              : "text-gray-600 hover:text-green-600 hover:bg-green-50"
          )}
          title="Lag avstemning"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Avstemning</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />

        {/* GIF picker popup */}
        {showGifPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50 w-full sm:w-[400px]">
            <GifPicker
              onSelect={(gif) => {
                addGif(gif.url, gif.preview, gif.width, gif.height)
                setShowGifPicker(false)
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}

        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50 w-full sm:w-[360px]">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              className="max-h-[400px]"
            />
          </div>
        )}
      </div>

      {/* Poll editor */}
      {(showPollEditor || state.poll) && (
        <div className="py-2 border-t border-gray-100">
          <PollEditor
            value={state.poll}
            onChange={(poll) => {
              setPoll(poll)
              if (!poll) setShowPollEditor(false)
            }}
            maxOptions={10}
          />
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {state.isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Publiserer...
          </>
        ) : state.scheduledFor ? (
          'Planlegg innlegg'
        ) : (
          'Publiser'
        )}
      </Button>
    </form>
  )
}

// Media preview item component
interface MediaPreviewItemProps {
  media: MediaItem
  onRemove: () => void
  onEdit?: () => void
  onCaptionChange?: (id: string, caption: string) => void
}

function MediaPreviewItem({ media, onRemove, onEdit, onCaptionChange }: MediaPreviewItemProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const isUploading = media.uploadProgress !== undefined && media.uploadProgress < 100
  const isEdited = !!media.edits

  // Show success checkmark when upload completes
  useEffect(() => {
    if (media.uploadProgress === 100 && !showSuccess) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 2000) // Show for 2 seconds
      return () => clearTimeout(timer)
    }
  }, [media.uploadProgress, showSuccess])

  return (
    <div className="space-y-2">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
      {media.thumbnailUrl && (
        <img
          src={media.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-sm font-medium">
            {media.uploadProgress}%
          </div>
        </div>
      )}

      {/* Upload success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-1">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-white text-xs font-medium">Lastet opp!</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {media.uploadError && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
          <span className="text-white text-xs text-center">{media.uploadError}</span>
        </div>
      )}

      {/* Video indicator */}
      {media.type === 'video' && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-xs">
          Video
        </div>
      )}

      {/* GIF indicator */}
      {media.type === 'gif' && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-purple-600/90 rounded text-white text-xs font-medium">
          GIF
        </div>
      )}

      {/* Edited indicator */}
      {isEdited && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-600/90 rounded text-white text-xs">
          Redigert
        </div>
      )}

      {/* Edit button (images only) */}
      {onEdit && !isUploading && (
        <button
          type="button"
          onClick={onEdit}
          className="absolute top-1 left-1 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/90 transition-all"
          title="Rediger bilde"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
      </div>

      {/* Caption input (images only) */}
      {media.type === 'image' && onCaptionChange && (
        <input
          type="text"
          value={media.caption || ''}
          onChange={(e) => onCaptionChange(media.id, e.target.value)}
          placeholder="Bildetekst (valgfritt)"
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )
}
