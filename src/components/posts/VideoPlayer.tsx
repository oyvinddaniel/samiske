'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  playbackUrl: string
  thumbnailUrl?: string | null
  title?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
}

export function VideoPlayer({
  playbackUrl,
  thumbnailUrl,
  title,
  className,
  autoPlay = false,
  muted = true,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if playbackUrl is an embed URL (iframe) or direct video URL
  const isEmbed = playbackUrl.includes('iframe.mediadelivery.net') || playbackUrl.includes('embed')

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact
        setIsPlaying(false)
      })
    }
  }, [autoPlay])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(progress)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  // If it's an embed URL, render iframe
  if (isEmbed) {
    return (
      <div className={cn('relative aspect-video rounded-lg overflow-hidden bg-black', className)}>
        <iframe
          src={playbackUrl}
          title={title || 'Video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Direct video URL - use native video player
  return (
    <div
      className={cn(
        'relative aspect-video rounded-lg overflow-hidden bg-black cursor-pointer group',
        className
      )}
      onClick={togglePlay}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Thumbnail before playing */}
      {thumbnailUrl && !isPlaying && (
        <div className="absolute inset-0 z-10">
          <img
            src={thumbnailUrl}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={playbackUrl}
        className="w-full h-full object-contain"
        muted={isMuted}
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading spinner */}
      {isLoading && isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <div className="absolute bottom-12 left-0 right-0 px-4">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
