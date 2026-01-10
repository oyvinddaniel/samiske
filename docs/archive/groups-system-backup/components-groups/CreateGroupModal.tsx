'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { createGroup, generateSlug } from '@/lib/groups'
import { Eye, Lock, EyeOff } from 'lucide-react'
import type { GroupType } from '@/lib/types/groups'
import { groupTypeDescriptions } from '@/lib/types/groups'

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupType, setGroupType] = useState<GroupType>('open')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Gruppenavn er påkrevd')
      return
    }

    setLoading(true)

    const slug = generateSlug(name)
    const { id, error } = await createGroup(
      name.trim(),
      slug,
      description.trim() || undefined,
      groupType
    )

    if (error) {
      if (error.includes('duplicate') || error.includes('unique')) {
        toast.error('En gruppe med dette navnet finnes allerede')
      } else {
        toast.error('Kunne ikke opprette gruppen')
      }
      setLoading(false)
      return
    }

    toast.success('Gruppen ble opprettet!')
    onOpenChange(false)
    setName('')
    setDescription('')
    setGroupType('open')
    router.push(`/grupper/${slug}`)

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett ny gruppe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Gruppenavn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Samisk ungdomsforening"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hva handler gruppen om?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Group type */}
          <div className="space-y-3">
            <Label>Gruppetype</Label>
            <RadioGroup
              value={groupType}
              onValueChange={(value) => setGroupType(value as GroupType)}
              className="space-y-2"
            >
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="open" id="open" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Åpen</span>
                  </div>
                  <p className="text-sm text-gray-500">{groupTypeDescriptions.open}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="closed" id="closed" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Lukket</span>
                  </div>
                  <p className="text-sm text-gray-500">{groupTypeDescriptions.closed}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="hidden" id="hidden" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Skjult</span>
                  </div>
                  <p className="text-sm text-gray-500">{groupTypeDescriptions.hidden}</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oppretter...' : 'Opprett gruppe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
