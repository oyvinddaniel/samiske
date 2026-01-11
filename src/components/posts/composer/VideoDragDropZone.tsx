'use client'

import { useState, useRef } from 'react'
import { Video, Upload, FileVideo } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoDragDropZoneProps {
  onVideoSelect: (file: File) => void
  maxSize?: number // in MB
  maxDuration?: number // in seconds
  className?: string
}

export function VideoDragDropZone({
  onVideoSelect,
  maxSize = 500,
  maxDuration = 600,
  className,
}: VideoDragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateVideo = async (file: File): Promise<boolean> => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Kun videofiler støttes')
      return false
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSize) {
      setError(`Video er for stor. Maksimum ${maxSize}MB`)
      return false
    }

    // Check duration (if possible)
    try {
      const duration = await getVideoDuration(file)
      if (duration > maxDuration) {
        const maxMinutes = maxDuration / 60
        setError(`Video er for lang. Maksimum ${maxMinutes} minutter`)
        return false
      }
    } catch (err) {
      // Duration check failed, but we can still proceed
      console.warn('Could not check video duration:', err)
    }

    setError(null)
    return true
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find((file) => file.type.startsWith('video/'))

    if (videoFile) {
      const isValid = await validateVideo(videoFile)
      if (isValid) {
        onVideoSelect(videoFile)
      }
    } else {
      setError('Vennligst dra en videofil')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isValid = await validateVideo(file)
      if (isValid) {
        onVideoSelect(file)
      }
    }
    // Reset input
    e.target.value = ''
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('relative', className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ease-out',
          isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          error && 'border-red-300 bg-red-50'
        )}
      >
        {/* Animated Background Gradient when Dragging */}
        {isDragging && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-purple-50 opacity-50 rounded-lg animate-pulse" />
        )}

        <div className="relative z-10">
          {/* Icon */}
          <div className={cn(
            'mx-auto w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-all duration-200',
            isDragging
              ? 'bg-blue-100 scale-110'
              : 'bg-gray-100'
          )}>
            {isDragging ? (
              <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
            ) : (
              <Video className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className={cn(
              'text-sm font-medium transition-colors',
              isDragging ? 'text-blue-700' : 'text-gray-700'
            )}>
              {isDragging ? 'Slipp video her!' : 'Dra og slipp video her'}
            </p>
            <p className="text-xs text-gray-500">
              eller klikk for å velge fil
            </p>
          </div>

          {/* Specifications */}
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FileVideo className="w-3 h-3" />
              MP4, MOV, AVI
            </span>
            <span>•</span>
            <span>Maks {maxSize}MB</span>
            <span>•</span>
            <span>Opptil {maxDuration / 60} min</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
