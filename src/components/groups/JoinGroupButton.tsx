'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { joinGroup, leaveGroup } from '@/lib/groups'
import { UserPlus, UserMinus, Clock, Check } from 'lucide-react'
import type { GroupType, MemberStatus } from '@/lib/types/groups'

interface JoinGroupButtonProps {
  groupId: string
  groupType: GroupType
  isMember: boolean
  memberStatus: MemberStatus | null
  userRole: string | null
  onStatusChange?: () => void
}

export function JoinGroupButton({
  groupId,
  groupType,
  isMember,
  memberStatus,
  userRole,
  onStatusChange,
}: JoinGroupButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    setLoading(true)

    const { status, error } = await joinGroup(groupId)

    if (error) {
      console.error('Join group error:', error)
      toast.error(`Kunne ikke bli med i gruppen: ${error}`)
    } else if (status === 'joined') {
      toast.success('Du er nå medlem av gruppen!')
      onStatusChange?.()
    } else if (status === 'pending') {
      toast.success('Forespørsel sendt! Venter på godkjenning.')
      onStatusChange?.()
    } else if (status === 'already_member') {
      toast.info('Du er allerede medlem')
    } else if (status === 'invite_required') {
      toast.error('Du må være invitert for å bli med i denne gruppen')
    }

    setLoading(false)
  }

  const handleLeave = async () => {
    if (userRole === 'admin') {
      toast.error('Administratorer kan ikke forlate gruppen. Overfør admin-rollen først.')
      return
    }

    if (!confirm('Er du sikker på at du vil forlate gruppen?')) {
      return
    }

    setLoading(true)
    const success = await leaveGroup(groupId)

    if (success) {
      toast.success('Du har forlatt gruppen')
      onStatusChange?.()
    } else {
      toast.error('Kunne ikke forlate gruppen')
    }

    setLoading(false)
  }

  // Pending status
  if (memberStatus === 'pending') {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Clock className="w-4 h-4" />
        Venter på godkjenning
      </Button>
    )
  }

  // Already a member
  if (isMember) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2" disabled>
          <Check className="w-4 h-4" />
          Medlem
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          disabled={loading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <UserMinus className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Hidden groups require invite
  if (groupType === 'hidden') {
    return (
      <Button variant="outline" disabled className="gap-2">
        Kun på invitasjon
      </Button>
    )
  }

  // Join button
  return (
    <Button onClick={handleJoin} disabled={loading} className="gap-2">
      <UserPlus className="w-4 h-4" />
      {groupType === 'closed' ? 'Søk om medlemskap' : 'Bli med'}
    </Button>
  )
}
