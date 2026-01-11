'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteCommunity } from '@/lib/communities'
import { toast } from 'sonner'
import type { Community } from '@/lib/types/communities'

interface DangerZoneTabProps {
  community: Community
  onDeleted?: () => void
}

export function DangerZoneTab({ community, onDeleted }: DangerZoneTabProps) {
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
        if (onDeleted) {
          onDeleted()
        } else {
          router.replace('/samfunn')
        }
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-red-900">Faresone</h3>
        <p className="text-sm text-gray-500">
          Vær forsiktig - handlinger her kan ikke angres.
        </p>
      </div>

      {/* Delete section */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Slett side permanent</h3>
            <p className="text-sm text-red-700">
              Dette vil permanent slette siden. Alle innlegg, produkter og tjenester
              knyttet til siden vil forbli, men siden vil ikke lenger være synlig.
              Denne handlingen kan ikke angres.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="confirm-delete" className="text-sm text-red-900">
              Skriv inn <span className="font-mono font-semibold bg-red-100 px-1 rounded">{community.name}</span> for å bekrefte
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={community.name}
              className="mt-1.5 border-red-300 focus:border-red-500 focus:ring-red-500"
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
  )
}
