'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { transferGroupOwnership } from '@/lib/groups'
import { toast } from 'sonner'
import type { Group, GroupMember } from '@/lib/types/groups'

interface TransferOwnershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  members: GroupMember[]
  currentUserId: string | null
  onOwnershipTransferred: () => void
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  group,
  members,
  currentUserId,
  onOwnershipTransferred,
}: TransferOwnershipDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out current user and get eligible members
  const eligibleMembers = members.filter(
    (m) => m.user_id !== currentUserId && m.status === 'approved'
  )

  const selectedMember = eligibleMembers.find((m) => m.user_id === selectedUserId)

  const handleTransfer = async () => {
    if (!selectedUserId) {
      setError('Velg en bruker')
      return
    }

    setTransferring(true)
    setError(null)

    try {
      const { success, error: transferError } = await transferGroupOwnership(
        group.id,
        selectedUserId
      )

      if (transferError) {
        setError(transferError)
        return
      }

      if (success) {
        toast.success(`${selectedMember?.user?.full_name || 'Brukeren'} er nå administrator`)
        onOwnershipTransferred()
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error transferring ownership:', err)
      setError('Noe gikk galt. Prøv igjen.')
    } finally {
      setTransferring(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedUserId(null)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-600" />
            Overfør administratorrettigheter
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">OBS: Dette kan ikke angres!</p>
                  <p>Du vil miste administratorrettighetene dine og bli vanlig medlem.</p>
                </div>
              </div>

              {eligibleMembers.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  Ingen andre medlemmer å overføre til. Inviter flere medlemmer først.
                </p>
              ) : (
                <>
                  <p className="mb-4">Velg hvem som skal bli ny administrator:</p>

                  <RadioGroup
                    value={selectedUserId || ''}
                    onValueChange={setSelectedUserId}
                    className="space-y-2"
                  >
                    {eligibleMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUserId === member.user_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedUserId(member.user_id)}
                      >
                        <RadioGroupItem
                          value={member.user_id}
                          id={member.user_id}
                        />
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <Label
                          htmlFor={member.user_id}
                          className="flex-1 cursor-pointer"
                        >
                          <p className="font-medium">
                            {member.user?.full_name || 'Ukjent'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {member.role === 'moderator' ? 'Moderator' : 'Medlem'}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={transferring}>
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleTransfer()
            }}
            className="bg-yellow-600 hover:bg-yellow-700"
            disabled={transferring || !selectedUserId || eligibleMembers.length === 0}
          >
            {transferring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Overfører...
              </>
            ) : (
              'Overfør rettigheter'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
