'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { CircleBadge } from './CircleBadge'
import {
  getUserCircles,
  createCircle,
  updateCircle,
  deleteCircle,
  getCircleMembers,
  removeFriendFromCircle
} from '@/lib/circles'
import type { FriendCircle, FriendCircleMember } from '@/lib/types/circles'
import { circleColors, circleIcons } from '@/lib/types/circles'
import { toast } from 'sonner'

export function CircleManager() {
  const [circles, setCircles] = useState<(FriendCircle & { member_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCircle, setEditingCircle] = useState<FriendCircle | null>(null)
  const [deletingCircle, setDeletingCircle] = useState<FriendCircle | null>(null)
  const [viewingMembers, setViewingMembers] = useState<FriendCircle | null>(null)
  const [members, setMembers] = useState<FriendCircleMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState(circleColors[0])
  const [formIcon, setFormIcon] = useState(circleIcons[0])
  const [saving, setSaving] = useState(false)

  const fetchCircles = useCallback(async () => {
    setLoading(true)
    const data = await getUserCircles()
    setCircles(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCircles()
  }, [fetchCircles])

  const handleViewMembers = async (circle: FriendCircle) => {
    setViewingMembers(circle)
    setLoadingMembers(true)
    const data = await getCircleMembers(circle.id)
    setMembers(data)
    setLoadingMembers(false)
  }

  const handleRemoveMember = async (memberId: string, friendId: string) => {
    if (!viewingMembers) return

    const success = await removeFriendFromCircle(viewingMembers.id, friendId)
    if (success) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Medlem fjernet fra sirkelen')
      fetchCircles() // Refresh member counts
    } else {
      toast.error('Kunne ikke fjerne medlem')
    }
  }

  const openCreateModal = () => {
    setFormName('')
    setFormColor(circleColors[0])
    setFormIcon(circleIcons[0])
    setEditingCircle(null)
    setShowCreateModal(true)
  }

  const openEditModal = (circle: FriendCircle) => {
    setFormName(circle.name)
    setFormColor(circle.color)
    setFormIcon(circle.icon)
    setEditingCircle(circle)
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Navn er påkrevd')
      return
    }

    setSaving(true)

    try {
      if (editingCircle) {
        // Update existing
        const success = await updateCircle(editingCircle.id, {
          name: formName.trim(),
          color: formColor,
          icon: formIcon
        })

        if (success) {
          toast.success('Sirkel oppdatert')
          setShowCreateModal(false)
          fetchCircles()
        } else {
          toast.error('Kunne ikke oppdatere sirkel')
        }
      } else {
        // Create new
        const circleId = await createCircle(formName.trim(), formColor, formIcon)

        if (circleId) {
          toast.success('Sirkel opprettet')
          setShowCreateModal(false)
          fetchCircles()
        } else {
          toast.error('Kunne ikke opprette sirkel')
        }
      }
    } catch (error) {
      console.error('Error saving circle:', error)
      toast.error('Noe gikk galt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCircle) return

    const success = await deleteCircle(deletingCircle.id)

    if (success) {
      toast.success('Sirkel slettet')
      setDeletingCircle(null)
      fetchCircles()
    } else {
      toast.error('Kunne ikke slette sirkel')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vennesirkler</h3>
          <p className="text-sm text-gray-500">
            Organiser vennene dine i sirkler for enklere deling
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Ny sirkel
        </Button>
      </div>

      {circles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">Du har ingen sirkler enda</p>
          <Button variant="outline" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Opprett din første sirkel
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {circles.map(circle => (
            <div
              key={circle.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <CircleBadge
                  name={circle.name}
                  color={circle.color}
                  icon={circle.icon}
                  size="lg"
                />
                <span className="text-sm text-gray-500">
                  {circle.member_count} {circle.member_count === 1 ? 'medlem' : 'medlemmer'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewMembers(circle)}
                >
                  <Users className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(circle)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingCircle(circle)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCircle ? 'Rediger sirkel' : 'Ny sirkel'}
            </DialogTitle>
            <DialogDescription>
              {editingCircle
                ? 'Endre navn, farge eller ikon på sirkelen'
                : 'Opprett en ny sirkel for å organisere vennene dine'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="F.eks. Familie, Nære venner, Kolleger"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Farge</Label>
              <div className="flex flex-wrap gap-2">
                {circleColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ikon</Label>
              <div className="flex flex-wrap gap-2">
                {circleIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormIcon(icon)}
                    className={`p-2 rounded-lg border transition-colors ${
                      formIcon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <CircleBadge
                      name=""
                      color={formColor}
                      icon={icon}
                      size="sm"
                      showName={false}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-gray-500">Forhåndsvisning</Label>
              <div className="mt-2">
                <CircleBadge
                  name={formName || 'Sirkel'}
                  color={formColor}
                  icon={formIcon}
                  size="lg"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={saving}
            >
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : editingCircle ? (
                'Lagre endringer'
              ) : (
                'Opprett sirkel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCircle} onOpenChange={() => setDeletingCircle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett sirkel?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette sirkelen &quot;{deletingCircle?.name}&quot;?
              Medlemmene vil ikke bli slettet, men de vil bli fjernet fra denne sirkelen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Members Modal */}
      <Dialog open={!!viewingMembers} onOpenChange={() => setViewingMembers(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewingMembers && (
                <CircleBadge
                  name={viewingMembers.name}
                  color={viewingMembers.color}
                  icon={viewingMembers.icon}
                  size="md"
                />
              )}
            </DialogTitle>
            <DialogDescription>
              {members.length} {members.length === 1 ? 'medlem' : 'medlemmer'} i denne sirkelen
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Ingen medlemmer i denne sirkelen
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium">
                      {member.full_name || 'Ukjent'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.friend_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
