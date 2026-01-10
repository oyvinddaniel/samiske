'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { MediaService } from '@/lib/media/mediaService'
import { validateFile } from '@/lib/media/mediaValidation'
import { updateGroup } from '@/lib/groups'
import { toast } from 'sonner'
import type { Group, GroupType } from '@/lib/types/groups'
import { groupTypeLabels, groupTypeDescriptions } from '@/lib/types/groups'

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  onGroupUpdated: () => void
}

export function EditGroupDialog({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
}: EditGroupDialogProps) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [groupType, setGroupType] = useState<GroupType>(group.group_type)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [imageUrl, setImageUrl] = useState(group.image_url || '')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Fetch current welcome message
  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      if (!open) return

      const { data } = await supabase
        .from('groups')
        .select('welcome_message')
        .eq('id', group.id)
        .single()

      if (data?.welcome_message) {
        setWelcomeMessage(data.welcome_message)
      }
    }

    fetchWelcomeMessage()
  }, [open, group.id, supabase])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(group.name)
      setDescription(group.description || '')
      setGroupType(group.group_type)
      setImageUrl(group.image_url || '')
      setImagePreview(null)
    }
  }, [open, group])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file using MediaService
    const errors = await validateFile(file)
    if (errors.length > 0) {
      toast.error(errors[0].message)
      return
    }

    setUploadingImage(true)

    try {
      // Create preview before upload
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload using MediaService
      const result = await MediaService.upload(file, {
        entityType: 'group_avatar',
        entityId: group.id,
        altText: `${group.name} avatar`,
      })

      if (!result.success || !result.media) {
        throw new Error(result.error || 'Upload failed')
      }

      // Get URL from MediaService
      const url = MediaService.getUrl(result.media.storage_path)
      setImageUrl(url)
      toast.success('Bilde lastet opp')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Kunne ikke laste opp bilde')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setImagePreview(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Gruppenavn er påkrevd')
      return
    }

    setSaving(true)

    try {
      const { success, error } = await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        image_url: imageUrl || undefined,
        group_type: groupType,
        welcome_message: welcomeMessage.trim() || undefined,
      })

      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success('Gruppen er oppdatert')
        onGroupUpdated()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Noe gikk galt')
    } finally {
      setSaving(false)
    }
  }

  const displayImage = imagePreview || imageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger gruppe</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Group image */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={displayImage || undefined} />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {displayImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 p-1 bg-red-100 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="group-image-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {displayImage ? 'Endre bilde' : 'Last opp bilde'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Gruppenavn *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv gruppenavn..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Beskrivelse</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv gruppen..."
              rows={3}
            />
          </div>

          {/* Group type */}
          <div className="space-y-2">
            <Label>Gruppetype</Label>
            <Select value={groupType} onValueChange={(value: GroupType) => setGroupType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['open', 'closed', 'hidden'] as GroupType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div>
                      <div className="font-medium">{groupTypeLabels[type]}</div>
                      <div className="text-xs text-gray-500">{groupTypeDescriptions[type]}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Welcome message */}
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Velkomstmelding</Label>
            <Textarea
              id="welcome-message"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Skriv en velkomstmelding til nye medlemmer..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Vises automatisk første gang nye medlemmer besøker gruppen
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre endringer'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
