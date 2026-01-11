'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2 } from 'lucide-react'
import { uploadCoverImage, deleteCoverImage } from '@/lib/profile/coverImageUpload'
import { toast } from 'sonner'
import Image from 'next/image'

interface ProfileCoverUploadProps {
  userId: string
  currentCoverUrl?: string | null
  onUploadSuccess: (url: string) => void
  onDelete?: () => void
  isEditable?: boolean
}

export function ProfileCoverUpload({
  userId,
  currentCoverUrl,
  onUploadSuccess,
  onDelete,
  isEditable = false,
}: ProfileCoverUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const result = await uploadCoverImage(file, userId)
    setUploading(false)

    if (result.success && result.url) {
      toast.success('Cover-bilde oppdatert!')
      onUploadSuccess(result.url)
      setPreview(null)
    } else {
      toast.error(result.error || 'Opplasting feilet')
      setPreview(null)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      // Validate file type
      if (file.type.startsWith('image/')) {
        await uploadFile(file)
      } else {
        toast.error('Kun bildefiler er tillatt')
      }
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Er du sikker på at du vil slette cover-bildet?')) {
      return
    }

    setDeleting(true)
    const result = await deleteCoverImage(userId)
    setDeleting(false)

    if (result.success) {
      toast.success('Cover-bilde slettet')
      if (onDelete) onDelete()
    } else {
      toast.error(result.error || 'Kunne ikke slette cover-bilde')
    }
  }

  const coverUrl = preview || currentCoverUrl

  return (
    <div
      className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 overflow-hidden group"
      onDragEnter={isEditable ? handleDragEnter : undefined}
      onDragLeave={isEditable ? handleDragLeave : undefined}
      onDragOver={isEditable ? handleDragOver : undefined}
      onDrop={isEditable ? handleDrop : undefined}
    >
      {/* Cover image */}
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt="Cover"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <p className="text-sm">Ingen cover-bilde</p>
        </div>
      )}

      {/* Drag-over overlay */}
      {isEditable && isDragging && (
        <div className="absolute inset-0 bg-blue-600/80 flex items-center justify-center border-4 border-dashed border-white z-20">
          <div className="text-center text-white">
            <Camera className="w-16 h-16 mx-auto mb-2" />
            <p className="text-lg font-semibold">Slipp bildet her</p>
          </div>
        </div>
      )}

      {/* Upload overlay (shown on hover for own profile) */}
      {isEditable && !isDragging && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {uploading ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Laster opp...</span>
            </div>
          ) : deleting ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sletter...</span>
            </div>
          ) : (
            <>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || deleting}
              >
                <Camera className="w-5 h-5 mr-2" />
                {coverUrl ? 'Endre cover-bilde' : 'Last opp cover-bilde'}
              </Button>

              {coverUrl && (
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleDelete}
                  disabled={uploading || deleting}
                >
                  <X className="w-5 h-5 mr-2" />
                  Slett
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
