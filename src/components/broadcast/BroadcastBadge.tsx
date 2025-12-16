'use client'

import { useState } from 'react'
import { useBroadcastMessages } from '@/hooks/useBroadcastMessages'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function BroadcastBadge() {
  const { broadcasts, unreadCount, dismissBroadcast } = useBroadcastMessages()
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Don't render if no unread broadcasts
  if (unreadCount === 0) return null

  const handleDismiss = async () => {
    if (broadcasts.length === 0) return

    const currentBroadcast = broadcasts[currentIndex]
    await dismissBroadcast(currentBroadcast.id)

    // After dismissing, if there are more broadcasts, stay on the same index
    // (which will now show the next message), otherwise close modal
    if (broadcasts.length <= 1) {
      setIsOpen(false)
      setCurrentIndex(0)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(broadcasts.length - 1, prev + 1))
  }

  const currentBroadcast = broadcasts[currentIndex]
  const hasMultipleMessages = broadcasts.length > 1

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`${unreadCount} uleste meldinger`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{currentBroadcast?.title}</DialogTitle>
            {hasMultipleMessages && (
              <DialogDescription className="text-xs text-muted-foreground">
                Melding {currentIndex + 1} av {broadcasts.length}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {currentBroadcast?.content}
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
    </>
  )
}
