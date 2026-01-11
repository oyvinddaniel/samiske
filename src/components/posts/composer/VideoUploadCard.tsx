'use client'

import { useState, useRef } from 'react'
import { Play, X, Loader2, CheckCircle2, AlertCircle, Pencil, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { MediaItem } from './types'

interface VideoUploadCardProps {
  video: MediaItem
  onRemove: () => void
  onThumbnailChange?: (thumbnailIndex: number) => void
  className?: string
}

export function VideoUploadCard({
  video,
  onRemove,
  onThumbnailChange,
  className,
}: VideoUploadCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isUploading = video.uploadProgress !== undefined && video.uploadProgress < 100
  const isProcessing = video.isProcessing
  const hasError = !!video.uploadError
  const isComplete = !isUploading && !isProcessing && !hasError

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Video Preview */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black group">
        {/* Video Element */}
        {(video.url || video.thumbnailUrl || (video.file && URL.createObjectURL(video.file))) && (
          <video
            ref={videoRef}
            src={video.url || (video.file ? URL.createObjectURL(video.file) : video.thumbnailUrl)}
            className="w-full h-full object-contain"
            onEnded={() => setIsPlaying(false)}
            poster={video.thumbnailUrl || undefined}
          />
        )}

        {/* Thumbnail/Poster */}
        {!isPlaying && video.thumbnailUrl && (
          <div className="absolute inset-0">
            <img
              src={video.thumbnailUrl}
              alt="Video preview"
              className="w-full h-full object-cover"
            />

            {/* Play Button Overlay */}
            {isComplete && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Duration Badge */}
        {video.duration && !isUploading && !isProcessing && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration)}
          </div>
        )}

        {/* File Size Badge */}
        {video.file && !isUploading && !isProcessing && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-medium">
            {formatFileSize(video.file.size)}
          </div>
        )}

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Fjern video"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <div className="w-64 space-y-2">
              <Progress value={video.uploadProgress} className="h-2" />
              <p className="text-white text-sm text-center font-medium">
                Laster opp video... {video.uploadProgress}%
              </p>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <div className="text-center">
              <p className="text-white text-sm font-medium">Behandler video...</p>
              <p className="text-white/70 text-xs mt-1">Dette kan ta 1-2 minutter</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-white" />
            <div className="text-center px-4">
              <p className="text-white text-sm font-medium">Opplasting feilet</p>
              <p className="text-white/90 text-xs mt-1">{video.uploadError}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRemove}
              className="mt-2"
            >
              Prøv igjen
            </Button>
          </div>
        )}

        {/* Success Indicator */}
        {isComplete && !hasError && video.uploadProgress === 100 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500/90 rounded text-white text-xs font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Klar!
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isComplete && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="flex-1"
          >
            <Pencil className="w-3 h-3 mr-1" />
            {showThumbnails ? 'Skjul' : 'Velg'} thumbnail
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-3 h-3 mr-1" />
            Fjern
          </Button>
        </div>
      )}

      {/* Thumbnail Selection (placeholder for now) */}
      {showThumbnails && isComplete && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">Velg thumbnail for video:</p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                onClick={() => onThumbnailChange?.(idx)}
                className="aspect-video rounded border-2 border-gray-300 hover:border-blue-500 transition-colors bg-gray-200"
                title={`Thumbnail ${idx + 1}`}
              >
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Automatisk thumbnail-generering kommer snart
          </p>
        </div>
      )}
    </div>
  )
}
