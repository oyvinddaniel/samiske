'use client'

import { useRef, useEffect, useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PostComposerCore } from './PostComposerCore'
import { usePostComposer } from './usePostComposer'
import type { GeographySelection } from '@/components/geography'

interface PostComposerInlineProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
  defaultGeography?: GeographySelection | null
  groupId?: string | null
  communityId?: string | null
}

export function PostComposerInline({
  open,
  onClose,
  onSuccess,
  userId,
  defaultGeography,
  groupId,
  communityId,
}: PostComposerInlineProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const composer = usePostComposer({
    userId,
    defaultGeography,
    groupId,
    communityId,
    onSuccess: () => {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onSuccess?.()
        onClose()
      }, 2000)
    },
  })

  // Scroll into view when opened
  useEffect(() => {
    if (open && formRef.current) {
      setTimeout(() => {
        if (formRef.current) {
          const rect = formRef.current.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const targetPosition = scrollTop + rect.top - 150
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth',
          })
        }
      }, 100)
    }
  }, [open])

  const handleCancel = () => {
    if (composer.state.isDirty) {
      if (!confirm('Er du sikker på at du vil avbryte? Innholdet vil gå tapt.')) {
        return
      }
    }
    composer.reset()
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Innlegget er publisert!</h3>
              <p className="text-sm text-gray-500 mt-1">Ditt innlegg er nå synlig for alle</p>
            </div>
          </div>
        </div>
      )}

      {/* Inline form */}
      <div
        ref={formRef}
        className={cn(
          'mb-6 overflow-hidden',
          'animate-in fade-in slide-in-from-top-4 duration-700 ease-out'
        )}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <h2 className="font-semibold text-gray-900">Opprett innlegg</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4">
            <PostComposerCore
              composer={composer}
              variant="inline"
              showGeography={!defaultGeography && !groupId && !communityId}
            />
          </div>
        </div>
      </div>
    </>
  )
}
