'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, ImageIcon, Upload, GripVertical, ExternalLink } from 'lucide-react'
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
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioMedia,
  isValidMediaUrl,
  type PortfolioItem,
  type MediaType
} from '@/lib/portfolio'
import { toast } from 'sonner'
import Image from 'next/image'

interface PortfolioEditorProps {
  communityId: string
  onUpdated?: () => void
}

export function PortfolioEditor({ communityId, onUpdated }: PortfolioEditorProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<PortfolioItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [mediaUrl, setMediaUrl] = useState('')
  const [externalLink, setExternalLink] = useState('')

  useEffect(() => {
    fetchItems()
  }, [communityId])

  const fetchItems = async () => {
    setLoading(true)
    const data = await getPortfolioItems(communityId)
    setItems(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setCreating(true)
    setEditing(null)
    resetForm()
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditing(item.id)
    setCreating(false)
    setTitle(item.title)
    setDescription(item.description || '')
    setMediaType(item.media_type)
    setMediaUrl(item.media_url)
    setExternalLink(item.external_link || '')
  }

  const handleCancel = () => {
    setCreating(false)
    setEditing(null)
    resetForm()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setMediaType('image')
    setMediaUrl('')
    setExternalLink('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes: Record<MediaType, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      link: []
    }

    if (!validTypes[mediaType].includes(file.type)) {
      toast.error(`Ugyldig filtype for ${mediaType}`)
      return
    }

    // Check file size (max 50MB for images, 200MB for video/audio)
    const maxSize = mediaType === 'image' ? 50 * 1024 * 1024 : 200 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Filen er for stor (maks ${maxSize / 1024 / 1024}MB)`)
      return
    }

    setUploading(true)
    try {
      const url = await uploadPortfolioMedia(communityId, file, mediaType)
      if (url) {
        setMediaUrl(url)
        toast.success('Fil lastet opp')
      } else {
        toast.error('Kunne ikke laste opp fil')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp fil')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Tittel er påkrevd')
      return
    }

    if (mediaType !== 'link' && !mediaUrl.trim()) {
      toast.error('Media-URL er påkrevd')
      return
    }

    if (mediaType === 'link' && !externalLink.trim()) {
      toast.error('Ekstern lenke er påkrevd')
      return
    }

    // Validate URL format
    if (mediaType !== 'link' && !isValidMediaUrl(mediaUrl, mediaType)) {
      toast.error('Ugyldig media-URL')
      return
    }

    setSaving(true)
    try {
      if (creating) {
        const newItem = await createPortfolioItem(communityId, {
          title: title.trim(),
          description: description.trim() || undefined,
          media_type: mediaType,
          media_url: mediaUrl.trim(),
          external_link: externalLink.trim() || undefined
        })

        if (newItem) {
          setItems([...items, newItem])
          toast.success('Porteføljepost lagt til')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke lagre')
        }
      } else if (editing) {
        const success = await updatePortfolioItem(editing, {
          title: title.trim(),
          description: description.trim() || undefined,
          media_url: mediaUrl.trim(),
          external_link: externalLink.trim() || undefined
        })

        if (success) {
          setItems(items.map(i =>
            i.id === editing
              ? {
                  ...i,
                  title: title.trim(),
                  description: description.trim() || null,
                  media_url: mediaUrl.trim(),
                  external_link: externalLink.trim() || null
                }
              : i
          ))
          toast.success('Porteføljepost oppdatert')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke oppdatere')
        }
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error)
      toast.error('Kunne ikke lagre')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: PortfolioItem) => {
    const success = await deletePortfolioItem(item.id)
    if (success) {
      setItems(items.filter(i => i.id !== item.id))
      toast.success('Porteføljepost slettet')
      setDeleting(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error('Kunne ikke slette')
    }
  }

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
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Portefølje
        </h3>
        <p className="text-sm text-gray-500">
          Legg til bilder, videoer, lydfiler eller lenker til arbeidet ditt.
        </p>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {item.media_type === 'image' ? (
                <Image
                  src={item.thumbnail_url || item.media_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {item.media_type === 'video' && '🎥'}
                  {item.media_type === 'audio' && '🎵'}
                  {item.media_type === 'link' && '🔗'}
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors" />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium px-2 text-center">{item.title}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                  >
                    Rediger
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit form */}
      {(creating || editing) && (
        <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Navn på verket"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv verket..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-type">Type media</Label>
            <Select
              value={mediaType}
              onValueChange={(value) => setMediaType(value as MediaType)}
              disabled={!!editing}
            >
              <SelectTrigger id="media-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Bilde</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Lyd</SelectItem>
                <SelectItem value="link">Ekstern lenke</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mediaType !== 'link' && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Last opp fil</Label>
              <div className="flex gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept={
                    mediaType === 'image' ? 'image/*' :
                    mediaType === 'video' ? 'video/*' :
                    'audio/*'
                  }
                  disabled={uploading}
                />
                {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {mediaUrl && (
                <p className="text-xs text-green-600">✓ Fil lastet opp</p>
              )}
            </div>
          )}

          {mediaType !== 'link' && (
            <div className="space-y-2">
              <Label htmlFor="media-url">Eller lim inn URL</Label>
              <Input
                id="media-url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={
                  mediaType === 'image' ? 'https://example.com/bilde.jpg' :
                  mediaType === 'video' ? 'https://youtube.com/watch?v=...' :
                  'https://example.com/lyd.mp3'
                }
              />
            </div>
          )}

          {mediaType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="external-link">Ekstern lenke</Label>
              <Input
                id="external-link"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre'
              )}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!creating && !editing && (
        <Button onClick={handleCreate} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Legg til porteføljepost
        </Button>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett porteføljepost?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette &quot;{deleting?.title}&quot;? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && handleDelete(deleting)}
              className="bg-red-600 hover:bg-red-700"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
