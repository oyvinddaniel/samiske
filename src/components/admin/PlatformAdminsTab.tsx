'use client'

import { useState, useEffect } from 'react'
import { Loader2, UserPlus, Trash2, Crown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { getPlatformAdmins, removePlatformAdmin } from '@/lib/platform'
import type { PlatformAdminWithUser } from '@/lib/types/platform'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface PlatformAdminsTabProps {
  currentUserRole: 'owner' | 'admin'
}

export function PlatformAdminsTab({ currentUserRole }: PlatformAdminsTabProps) {
  const [admins, setAdmins] = useState<PlatformAdminWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [adminToRemove, setAdminToRemove] = useState<PlatformAdminWithUser | null>(null)

  const supabase = createClient()

  const fetchAdmins = async () => {
    setLoading(true)
    const data = await getPlatformAdmins()
    setAdmins(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const result = await removePlatformAdmin(adminToRemove.id, user.id)
    if (result.success) {
      toast.success('Administrator fjernet')
      setAdminToRemove(null)
      fetchAdmins()
    } else {
      toast.error(result.error || 'Kunne ikke fjerne administrator')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const owner = admins.find((a) => a.role === 'owner')
  const otherAdmins = admins.filter((a) => a.role === 'admin')

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Platform-administratorer kan moderere bransjer og innhold. Kun eier kan legge til eller fjerne administratorer.
        </p>
      </div>

      {/* Owner */}
      {owner && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Platform-eier
          </h3>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={owner.user?.avatar_url || undefined} />
                <AvatarFallback>
                  {owner.user?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{owner.user?.full_name || 'Ukjent'}</p>
                <p className="text-sm text-gray-500">{owner.user?.email}</p>
              </div>
              <Badge variant="default" className="bg-yellow-500">
                <Crown className="w-3 h-3 mr-1" />
                Eier
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Admins */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Administratorer ({otherAdmins.length})
          </h3>
        </div>

        {otherAdmins.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Ingen andre administratorer ennå</p>
            {currentUserRole === 'owner' && (
              <Button variant="outline" className="mt-4" disabled>
                <UserPlus className="w-4 h-4 mr-2" />
                Legg til administrator
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrator</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Lagt til</TableHead>
                  {currentUserRole === 'owner' && (
                    <TableHead className="text-right">Handlinger</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={admin.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {admin.user?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {admin.user?.full_name || 'Ukjent'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {admin.user?.email}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(admin.created_at).toLocaleDateString('nb-NO')}
                    </TableCell>
                    {currentUserRole === 'owner' && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setAdminToRemove(admin)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Fjern
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!adminToRemove} onOpenChange={() => setAdminToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil fjerne {adminToRemove?.user?.full_name} som platform-administrator?
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-red-600 hover:bg-red-700"
            >
              Fjern administrator
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
