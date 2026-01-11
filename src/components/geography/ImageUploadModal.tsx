'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MediaService, MediaEntityType } from '@/lib/media'

type EntityType = 'language_area' | 'municipality' | 'place'

// Mapping til MediaService entity types
const MEDIA_ENTITY_MAP: Record<EntityType, MediaEntityType> = {
  language_area: 'geography_language_area',
  municipality: 'geography_municipality',
  place: 'geography_place',
}

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: EntityType
  entityId: string
  currentImageCount: number
  onUploadComplete: () => void
}

interface UploadFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function ImageUploadModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  currentImageCount,
  onUploadComplete,
}: ImageUploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [maxImages, setMaxImages] = useState(100)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Hent max bilder fra MediaService settings
  useEffect(() => {
    async function fetchSettings() {
      const settings = await MediaService.getSettings()
      setMaxImages(settings.maxImagesPerGeography)
    }
    fetchSettings()
  }, [])

  const remainingSlots = maxImages - currentImageCount

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const imageFiles = Array.from(newFiles).filter(file =>
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      toast.error('Velg kun bildefiler')
      return
    }

    const availableSlots = remainingSlots - files.length
    if (availableSlots <= 0) {
      toast.error(`Du kan ikke laste opp flere bilder. Maks ${maxImages} bilder totalt.`)
      return
    }

    const filesToAdd = imageFiles.slice(0, availableSlots)
    if (imageFiles.length > availableSlots) {
      toast.warning(`Kun ${availableSlots} bilder ble lagt til. Maks ${maxImages} bilder totalt.`)
    }

    const newUploadFiles: UploadFile[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }))

    setFiles(prev => [...prev, ...newUploadFiles])
  }, [files.length, remainingSlots, maxImages])

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }

  const uploadAllFiles = async () => {
    if (files.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Du må være innlogget for å laste opp bilder')
      return
    }

    setIsUploading(true)
    const pendingFiles = files.filter(f => f.status === 'pending')

    // Bruk MediaService for opplasting
    const result = await MediaService.uploadMultiple(
      pendingFiles.map(f => f.file),
      {
        entityType: MEDIA_ENTITY_MAP[entityType],
        entityId,
      },
      (completed, total) => {
        // Oppdater status for hver fil
        if (completed <= pendingFiles.length) {
          const fileId = pendingFiles[completed - 1]?.id
          if (fileId) {
            setFiles(prev => prev.map(f =>
              f.id === fileId ? { ...f, status: 'success' } : f
            ))
          }
        }
      }
    )

    // Oppdater status for feilede filer
    result.failed.forEach((failed, index) => {
      const fileIndex = pendingFiles.findIndex(f => f.file.name === failed.filename)
      if (fileIndex !== -1) {
        const fileId = pendingFiles[fileIndex].id
        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'error', error: failed.error } : f
        ))
      }
    })

    setIsUploading(false)

    if (result.totalUploaded > 0) {
      toast.success(`${result.totalUploaded} ${result.totalUploaded === 1 ? 'bilde' : 'bilder'} lastet opp`)
      onUploadComplete()
    }
    if (result.totalFailed > 0) {
      toast.error(`${result.totalFailed} ${result.totalFailed === 1 ? 'bilde' : 'bilder'} feilet`)
    }

    if (result.totalFailed === 0 && result.totalUploaded > 0) {
      setTimeout(() => {
        handleClose()
      }, 1000)
    }
  }

  const handleClose = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    onClose()
  }

  if (!isOpen) return null

  const pendingFiles = files.filter(f => f.status === 'pending')
  const canUpload = pendingFiles.length > 0 && !isUploading

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Last opp bilder</h2>
            <p className="text-sm text-gray-500">
              {currentImageCount} av {maxImages} bilder brukt • {remainingSlots - files.length} plasser igjen
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            <Upload className={cn(
              'w-12 h-12 mx-auto mb-4',
              isDragging ? 'text-blue-500' : 'text-gray-400'
            )} />
            <p className="text-lg font-medium text-gray-700 mb-1">
              {isDragging ? 'Slipp bildene her' : 'Dra og slipp bilder her'}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              eller klikk for å velge filer
            </p>
            <p className="text-xs text-gray-400">
              Maks {remainingSlots - files.length} bilder • JPG, PNG, WebP
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File previews */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {files.length} {files.length === 1 ? 'bilde' : 'bilder'} valgt
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={file.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />

                    {/* Status overlay */}
                    {file.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    {file.status === 'success' && (
                      <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {file.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    )}

                    {/* Remove button (only for pending) */}
                    {file.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Fjern bilde"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={uploadAllFiles}
            disabled={!canUpload}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              canUpload
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Laster opp...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Last opp {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
