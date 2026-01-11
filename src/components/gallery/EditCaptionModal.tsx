/**
 * Edit Caption Modal
 * Modal for editing image metadata (caption, title, alt text)
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { updatePostImageMetadata, type ImageMetadata } from '@/lib/imageMetadata'

interface EditCaptionModalProps {
  imageId: string
  currentMetadata: ImageMetadata
  isOpen: boolean
  onClose: () => void
  onSuccess: (metadata: ImageMetadata) => void
}

export function EditCaptionModal({
  imageId,
  currentMetadata,
  isOpen,
  onClose,
  onSuccess
}: EditCaptionModalProps) {
  const [title, setTitle] = useState(currentMetadata.title || '')
  const [caption, setCaption] = useState(currentMetadata.caption || '')
  const [altText, setAltText] = useState(currentMetadata.alt_text || '')
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setTitle(currentMetadata.title || '')
      setCaption(currentMetadata.caption || '')
      setAltText(currentMetadata.alt_text || '')
    }
  }, [isOpen, currentMetadata])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const metadata: ImageMetadata = {
        title: title.trim() || null,
        caption: caption.trim() || null,
        alt_text: altText.trim() || null
      }

      await updatePostImageMetadata(imageId, metadata)

      toast.success('Bildetekst oppdatert')
      onSuccess(metadata)
      onClose()
    } catch (error) {
      console.error('Error updating image metadata:', error)
      toast.error('Kunne ikke oppdatere bildetekst')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Rediger bildetekst</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Lukk"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="image-title" className="block text-sm font-medium text-gray-300 mb-2">
                Tittel <span className="text-gray-500">(valgfritt)</span>
              </label>
              <input
                id="image-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gi bildet en tittel..."
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200 tegn</p>
            </div>

            {/* Caption */}
            <div>
              <label htmlFor="image-caption" className="block text-sm font-medium text-gray-300 mb-2">
                Bildetekst <span className="text-gray-500">(valgfritt)</span>
              </label>
              <textarea
                id="image-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Beskriv bildet..."
                maxLength={1000}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{caption.length}/1000 tegn</p>
            </div>

            {/* Alt Text */}
            <div>
              <label htmlFor="image-alt" className="block text-sm font-medium text-gray-300 mb-2">
                Alt-tekst <span className="text-gray-500">(for tilgjengelighet)</span>
              </label>
              <input
                id="image-alt"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Beskriv bildet for skjermlesere..."
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{altText.length}/200 tegn</p>
              <p className="text-xs text-gray-400 mt-2">
                Alt-tekst hjelper personer som bruker skjermlesere å forstå bildet.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Lagrer...' : 'Lagre'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
