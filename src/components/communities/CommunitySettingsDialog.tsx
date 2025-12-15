'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteCommunity } from '@/lib/communities'
import { toast } from 'sonner'
import type { Community } from '@/lib/types/communities'

interface CommunitySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  community: Community
}

export function CommunitySettingsDialog({
  open,
  onOpenChange,
  community,
}: CommunitySettingsDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmText !== community.name) {
      toast.error('Vennligst skriv inn navnet på siden for å bekrefte')
      return
    }

    setIsDeleting(true)

    try {
      const success = await deleteCommunity(community.id)

      if (success) {
        toast.success('Siden er slettet')
        // Navigate first before closing dialog to prevent refetch
        router.replace('/samfunn')
      } else {
        toast.error('Kunne ikke slette siden')
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting community:', error)
      toast.error('Kunne ikke slette siden')
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sideinnstillinger</DialogTitle>
          <DialogDescription>
            Administrer innstillinger for {community.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Delete section */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Slett side</h3>
                <p className="text-sm text-red-700">
                  Dette vil permanent slette siden. Alle innlegg, produkter og tjenester
                  knyttet til siden vil forbli, men siden vil ikke lenger være synlig.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="confirm-delete" className="text-sm text-red-900">
                  Skriv inn <span className="font-mono font-semibold">{community.name}</span> for å bekrefte
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={community.name}
                  className="mt-1.5"
                />
              </div>

              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== community.name || isDeleting}
                className="w-full"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sletter...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett side permanent
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
