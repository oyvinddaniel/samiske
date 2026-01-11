'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, Crown, Shield, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  getCommunityAdmins,
  addCommunityAdmin,
  removeCommunityAdmin,
  updateAdminRole
} from '@/lib/communities'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Community, CommunityAdmin, AdminRole } from '@/lib/types/communities'
import { adminRoleLabels } from '@/lib/types/communities'

const roleIcons: Record<AdminRole, React.ReactNode> = {
  owner: <Crown className="w-4 h-4 text-yellow-500" />,
  admin: <Shield className="w-4 h-4 text-blue-500" />,
  editor: <UserCog className="w-4 h-4 text-green-500" />,
  analyst: <UserCog className="w-4 h-4 text-gray-500" />,
}

interface TeamSettingsTabProps {
  community: Community
  onUpdated: () => void
}

interface UserSearchResult {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
}

export function TeamSettingsTab({ community, onUpdated }: TeamSettingsTabProps) {
  const [admins, setAdmins] = useState<CommunityAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingUser, setAddingUser] = useState<string | null>(null)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<CommunityAdmin | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  // Get current user and fetch admins
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const adminData = await getCommunityAdmins(community.id)
      setAdmins(adminData)
      setLoading(false)
    }
    fetchData()
  }, [community.id, supabase])

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(5)

        if (error) throw error

        // Filter out existing admins
        const adminIds = admins.map(a => a.user_id)
        const filtered = (data || []).filter(u => !adminIds.includes(u.id))
        setSearchResults(filtered)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, admins, supabase])

  const handleAddAdmin = async (userId: string, role: AdminRole = 'admin') => {
    setAddingUser(userId)
    try {
      const success = await addCommunityAdmin(community.id, userId, role)
      if (success) {
        toast.success('Administrator lagt til')
        // Refresh admins
        const adminData = await getCommunityAdmins(community.id)
        setAdmins(adminData)
        setSearchQuery('')
        setSearchResults([])
        onUpdated()
      } else {
        toast.error('Kunne ikke legge til administrator')
      }
    } catch (error) {
      console.error('Error adding admin:', error)
      toast.error('Kunne ikke legge til administrator')
    } finally {
      setAddingUser(null)
    }
  }

  const handleRemoveAdmin = async (admin: CommunityAdmin) => {
    // Check if this is the owner
    if (admin.role === 'owner') {
      toast.error('Kan ikke fjerne eieren av siden')
      return
    }

    setRemovingUser(admin.user_id)
    try {
      const success = await removeCommunityAdmin(community.id, admin.user_id)
      if (success) {
        toast.success('Administrator fjernet')
        setAdmins(admins.filter(a => a.user_id !== admin.user_id))
        onUpdated()
      } else {
        toast.error('Kunne ikke fjerne administrator')
      }
    } catch (error) {
      console.error('Error removing admin:', error)
      toast.error('Kunne ikke fjerne administrator')
    } finally {
      setRemovingUser(null)
      setConfirmRemove(null)
    }
  }

  const handleRoleChange = async (admin: CommunityAdmin, newRole: AdminRole) => {
    // Don't allow changing owner role
    if (admin.role === 'owner') {
      toast.error('Kan ikke endre eierens rolle')
      return
    }

    try {
      const success = await updateAdminRole(community.id, admin.user_id, newRole)
      if (success) {
        toast.success('Rolle oppdatert')
        setAdmins(admins.map(a =>
          a.user_id === admin.user_id ? { ...a, role: newRole } : a
        ))
        onUpdated()
      } else {
        toast.error('Kunne ikke oppdatere rolle')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Kunne ikke oppdatere rolle')
    }
  }

  // Find current user's admin status
  const currentUserAdmin = admins.find(a => a.user_id === currentUserId)
  const isOwner = currentUserAdmin?.role === 'owner'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Team-administrasjon</h3>
        <p className="text-sm text-gray-500">
          Administrer hvem som har tilgang til å redigere denne siden.
        </p>
      </div>

      {/* Current admins */}
      <div className="space-y-3">
        <Label>Administratorer ({admins.length})</Label>
        <div className="border rounded-lg divide-y">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={admin.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {admin.user?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {admin.user?.full_name || 'Ukjent'}
                    {roleIcons[admin.role]}
                  </p>
                  <p className="text-sm text-gray-500">
                    {adminRoleLabels[admin.role]}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Role selector - only show for non-owners and if current user is owner */}
                {isOwner && admin.role !== 'owner' && (
                  <Select
                    value={admin.role}
                    onValueChange={(value) => handleRoleChange(admin, value as AdminRole)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="editor">Redaktør</SelectItem>
                      <SelectItem value="analyst">Analytiker</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Remove button - only for non-owners and if current user is owner/admin */}
                {admin.role !== 'owner' && (isOwner || currentUserAdmin?.role === 'admin') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmRemove(admin)}
                    disabled={removingUser === admin.user_id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {removingUser === admin.user_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add new admin */}
      {(isOwner || currentUserAdmin?.role === 'admin') && (
        <div className="space-y-3">
          <Label>Legg til administrator</Label>
          <div className="relative">
            <Input
              placeholder="Søk etter bruker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Search results dropdown */}
            {(searchResults.length > 0 || searching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                {searching ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Søker...
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddAdmin(user.id)}
                      disabled={addingUser === user.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name || 'Ukjent'}</p>
                        {user.username && (
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        )}
                      </div>
                      {addingUser === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ))
                )}
                {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-gray-500">
                    Ingen brukere funnet
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Søk etter navn eller brukernavn for å legge til en administrator.
          </p>
        </div>
      )}

      {/* Confirm remove dialog */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne {confirmRemove?.user?.full_name || 'denne brukeren'} som administrator?
              De vil miste tilgang til å redigere denne siden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemoveAdmin(confirmRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Fjern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
