'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  confirmClose?: boolean
  confirmMessage?: string
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  confirmClose = false,
  confirmMessage = 'Er du sikker på at du vil avbryte? Endringer vil gå tapt.',
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const currentTranslateY = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setIsClosing(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleClose = useCallback(() => {
    if (confirmClose) {
      if (window.confirm(confirmMessage)) {
        setIsClosing(true)
        setTimeout(onClose, 300)
      }
    } else {
      setIsClosing(true)
      setTimeout(onClose, 300)
    }
  }, [confirmClose, confirmMessage, onClose])

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !sheetRef.current) return

    const deltaY = e.touches[0].clientY - touchStartY.current

    // Only allow dragging down
    if (deltaY > 0) {
      currentTranslateY.current = deltaY
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!sheetRef.current) return

    // If dragged more than 100px, close
    if (currentTranslateY.current > 100) {
      handleClose()
    } else {
      // Snap back
      sheetRef.current.style.transform = 'translateY(0)'
    }

    touchStartY.current = null
    currentTranslateY.current = 0
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Overlay - clicking above sheet closes it */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 lg:hidden',
          open && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleOverlayClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          'h-[85vh] max-h-[85vh]',
          open && !isClosing ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Lukk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe" style={{ maxHeight: title ? 'calc(85vh - 80px)' : 'calc(85vh - 40px)' }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
