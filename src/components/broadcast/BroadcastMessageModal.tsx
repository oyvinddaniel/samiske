'use client'

import { useState, useEffect } from 'react'
import { useBroadcastMessages } from '@/hooks/useBroadcastMessages'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function BroadcastMessageModal() {
  const { broadcasts, dismissBroadcast } = useBroadcastMessages()
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasAutoShown, setHasAutoShown] = useState(false)

  // Auto-show modal 5 seconds after mount if there are unread broadcasts
  useEffect(() => {
    if (broadcasts.length > 0 && !hasAutoShown) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasAutoShown(true)
      }, 5000) // 5 seconds

      return () => clearTimeout(timer)
    }
  }, [broadcasts.length, hasAutoShown])

  // Reset currentIndex when broadcasts change
  useEffect(() => {
    if (currentIndex >= broadcasts.length && broadcasts.length > 0) {
      setCurrentIndex(0)
    }
  }, [broadcasts.length, currentIndex])

  // Close modal if no broadcasts left
  useEffect(() => {
    if (broadcasts.length === 0 && isOpen) {
      setIsOpen(false)
    }
  }, [broadcasts.length, isOpen])

  const handleDismiss = async () => {
    if (broadcasts.length === 0) return

    const currentBroadcast = broadcasts[currentIndex]
    await dismissBroadcast(currentBroadcast.id)

    // After dismissing, if there are more broadcasts, stay on the same index
    // (which will now show the next message), otherwise close modal
    if (broadcasts.length <= 1) {
      setIsOpen(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(broadcasts.length - 1, prev + 1))
  }

  // Don't render if no broadcasts
  if (broadcasts.length === 0) return null

  const currentBroadcast = broadcasts[currentIndex]
  const hasMultipleMessages = broadcasts.length > 1

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{currentBroadcast.title}</DialogTitle>
          {hasMultipleMessages && (
            <DialogDescription className="text-xs text-muted-foreground">
              Melding {currentIndex + 1} av {broadcasts.length}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {currentBroadcast.content}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {hasMultipleMessages && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Forrige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIndex === broadcasts.length - 1}
                  className="gap-1"
                >
                  Neste
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Lukk
            </Button>
            <Button
              variant="default"
              onClick={handleDismiss}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Ikke vis igjen
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
