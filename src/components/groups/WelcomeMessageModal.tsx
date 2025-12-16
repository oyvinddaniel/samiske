'use client'

import { useState, useEffect } from 'react'
import { PartyPopper, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { hasSeenWelcomeMessage, markWelcomeMessageSeen } from '@/lib/groups'
import type { Group } from '@/lib/types/groups'

interface WelcomeMessageModalProps {
  group: Group & { welcome_message?: string | null }
  isMember: boolean
}

export function WelcomeMessageModal({ group, isMember }: WelcomeMessageModalProps) {
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkWelcome = async () => {
      // Only show if member and group has welcome message
      if (!isMember || !group.welcome_message) {
        setChecking(false)
        return
      }

      const seen = await hasSeenWelcomeMessage(group.id)
      if (!seen) {
        setOpen(true)
      }
      setChecking(false)
    }

    checkWelcome()
  }, [group.id, group.welcome_message, isMember])

  const handleClose = async () => {
    await markWelcomeMessageSeen(group.id)
    setOpen(false)
  }

  // Don't render anything while checking or if no welcome message
  if (checking || !group.welcome_message) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Lukk</span>
        </button>

        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <PartyPopper className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle>Velkommen til {group.name}!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{group.welcome_message}</p>
          </div>

          <Button onClick={handleClose} className="w-full">
            Fortsett til gruppen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
