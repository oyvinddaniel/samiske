'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteGroup } from '@/lib/groups'
import { toast } from 'sonner'
import type { Group } from '@/lib/types/groups'

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  group,
}: DeleteGroupDialogProps) {
  const router = useRouter()
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmName !== group.name) {
      setError('Gruppenavnet stemmer ikke')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const { success, error: deleteError } = await deleteGroup(group.id)

      if (deleteError) {
        setError(deleteError)
        return
      }

      if (success) {
        toast.success('Gruppen er slettet')
        onOpenChange(false)
        router.push('/grupper')
      }
    } catch (err) {
      console.error('Error deleting group:', err)
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmName('')
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slett gruppe</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p className="text-red-600 font-medium mb-3">
                Denne handlingen kan ikke angres!
              </p>
              <p>
                Når du sletter gruppen, vil følgende bli permanent slettet:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Alle innlegg i gruppen</li>
                <li>Alle medlemskap og invitasjoner</li>
                <li>Gruppens innstillinger og informasjon</li>
              </ul>
              <div className="mt-4">
                <Label htmlFor="confirmGroupName" className="text-sm font-medium text-gray-900">
                  Skriv gruppenavnet for å bekrefte: <span className="font-bold">{group.name}</span>
                </Label>
                <Input
                  id="confirmGroupName"
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Skriv gruppenavnet her"
                  className="mt-2"
                  autoComplete="off"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleting || confirmName !== group.name}
          >
            {deleting ? 'Sletter...' : 'Ja, slett gruppen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
