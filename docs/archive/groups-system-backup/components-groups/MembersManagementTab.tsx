'use client'

import { useState } from 'react'
import { UserX, Shield, ShieldCheck, User, Loader2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { removeGroupMember, updateMemberRole } from '@/lib/groups'
import { toast } from 'sonner'
import type { Group, GroupMember, MemberRole } from '@/lib/types/groups'
import { memberRoleLabels } from '@/lib/types/groups'

interface MembersManagementTabProps {
  group: Group
  members: GroupMember[]
  currentUserRole: string | null
  currentUserId: string | null
  onMembershipChange: () => void
}

export function MembersManagementTab({
  group,
  members,
  currentUserRole,
  currentUserId,
  onMembershipChange,
}: MembersManagementTabProps) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<GroupMember | null>(null)

  const isAdmin = currentUserRole === 'admin'
  const isModerator = currentUserRole === 'moderator'
  const canManageMembers = isAdmin || isModerator

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-yellow-600" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadgeVariant = (role: MemberRole) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleRoleChange = async (member: GroupMember, newRole: MemberRole) => {
    if (!isAdmin) {
      toast.error('Kun administratorer kan endre roller')
      return
    }

    setProcessing(member.user_id)

    try {
      const success = await updateMemberRole(group.id, member.user_id, newRole)

      if (success) {
        toast.success(`${member.user?.full_name || 'Bruker'} er nå ${memberRoleLabels[newRole].toLowerCase()}`)
        onMembershipChange()
      } else {
        toast.error('Kunne ikke endre rolle')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Noe gikk galt')
    } finally {
      setProcessing(null)
    }
  }

  const handleRemoveMember = async () => {
    if (!removingMember) return

    setProcessing(removingMember.user_id)

    try {
      const { success, error } = await removeGroupMember(group.id, removingMember.user_id)

      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success(`${removingMember.user?.full_name || 'Bruker'} er fjernet fra gruppen`)
        onMembershipChange()
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Noe gikk galt')
    } finally {
      setProcessing(null)
      setRemovingMember(null)
    }
  }

  const canRemoveMember = (member: GroupMember) => {
    // Can't remove yourself
    if (member.user_id === currentUserId) return false
    // Admins can remove anyone except other admins
    if (isAdmin && member.role !== 'admin') return true
    // Moderators can only remove regular members
    if (isModerator && member.role === 'member') return true
    return false
  }

  const canChangeRole = (member: GroupMember) => {
    // Only admins can change roles
    if (!isAdmin) return false
    // Can't change own role (use transfer ownership instead)
    if (member.user_id === currentUserId) return false
    return true
  }

  // Sort members: admins first, then moderators, then members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { admin: 0, moderator: 1, member: 2 }
    return roleOrder[a.role] - roleOrder[b.role]
  })

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {members.length} {members.length === 1 ? 'medlem' : 'medlemmer'}
      </div>

      <div className="space-y-2">
        {sortedMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-white"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={member.user?.avatar_url || undefined} />
              <AvatarFallback>
                {member.user?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {member.user?.full_name || 'Ukjent'}
                </p>
                {member.user_id === currentUserId && (
                  <Badge variant="outline" className="text-xs">Du</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getRoleIcon(member.role)}
                <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                  {memberRoleLabels[member.role]}
                </Badge>
              </div>
            </div>

            {/* Actions menu */}
            {canManageMembers && (canRemoveMember(member) || canChangeRole(member)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={processing === member.user_id}
                  >
                    {processing === member.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreVertical className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canChangeRole(member) && (
                    <>
                      {member.role !== 'admin' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'admin')}>
                          <ShieldCheck className="w-4 h-4 mr-2 text-yellow-600" />
                          Gjør til administrator
                        </DropdownMenuItem>
                      )}
                      {member.role !== 'moderator' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'moderator')}>
                          <Shield className="w-4 h-4 mr-2 text-blue-600" />
                          Gjør til moderator
                        </DropdownMenuItem>
                      )}
                      {member.role !== 'member' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'member')}>
                          <User className="w-4 h-4 mr-2" />
                          Gjør til vanlig medlem
                        </DropdownMenuItem>
                      )}
                      {canRemoveMember(member) && <DropdownMenuSeparator />}
                    </>
                  )}
                  {canRemoveMember(member) && (
                    <DropdownMenuItem
                      onClick={() => setRemovingMember(member)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Fjern fra gruppen
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Ingen medlemmer</p>
          </div>
        )}
      </div>

      {/* Remove member confirmation dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern medlem</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne{' '}
              <span className="font-medium">{removingMember?.user?.full_name || 'denne brukeren'}</span>{' '}
              fra gruppen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing === removingMember?.user_id}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemoveMember()
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={processing === removingMember?.user_id}
            >
              {processing === removingMember?.user_id ? 'Fjerner...' : 'Ja, fjern'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
