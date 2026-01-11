'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MentionTextarea, type MentionData } from '@/components/mentions'
import { BottomSheet } from '@/components/ui/bottom-sheet'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface NewPostSheetProps {
  open: boolean
  onClose: () => void
}

export function NewPostSheet({ open, onClose }: NewPostSheetProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState<'standard' | 'event'>('standard')
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [mentions, setMentions] = useState<MentionData[]>([])

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  // Check if form has been modified
  const hasChanges = title.trim() !== '' || content.trim() !== '' || imageFile !== null

  useEffect(() => {
    if (!open) return

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        onClose()
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .order('sort_order')

      if (cats) {
        setCategories(cats)
        const genereltCat = cats.find(c => c.slug === 'generelt')
        if (genereltCat) {
          setCategoryId(genereltCat.id)
        }
      }
    }

    init()
  }, [open, supabase, router, onClose])

  useEffect(() => {
    if (type === 'event') {
      const arrangementCat = categories.find(c => c.slug === 'arrangement')
      if (arrangementCat) {
        setCategoryId(arrangementCat.id)
      }
    }
  }, [type, categories])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setCategoryId(categories.find(c => c.slug === 'generelt')?.id || '')
    setType('standard')
    setVisibility('public')
    setEventDate('')
    setEventTime('')
    setEventEndTime('')
    setEventLocation('')
    setImageFile(null)
    setImagePreview(null)
    setMentions([])
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vennligst velg en bildefil')
        return
      }

      // Check file size against MediaService settings
      try {
        const { MediaService } = await import('@/lib/media')
        const settings = await MediaService.getSettings()
        const maxSizeBytes = settings.maxFileSizeMb * 1024 * 1024

        if (file.size > maxSizeBytes) {
          setError(`Bildet kan ikke være større enn ${settings.maxFileSizeMb}MB`)
          return
        }
      } catch (error) {
        console.error('Failed to get media settings:', error)
        // Fallback to 20MB
        if (file.size > 20 * 1024 * 1024) {
          setError('Bildet kan ikke være større enn 20MB')
          return
        }
      }

      setImageFile(file)
      setError(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return null

    setUploadingImage(true)

    try {
      const compressedFile = await compressPostImage(imageFile)
      const fileName = `${userId}-${Date.now()}.jpg`
      const filePath = `post-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile)

      if (uploadError) {
        setUploadingImage(false)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setUploadingImage(false)
      return publicUrl
    } catch {
      setUploadingImage(false)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setError(null)

    let imageUrl: string | null = null
    if (imageFile) {
      imageUrl = await uploadImage()
      if (!imageUrl && imageFile) {
        setError('Kunne ikke laste opp bildet. Prøv igjen.')
        setLoading(false)
        return
      }
    }

    const postData = {
      user_id: userId,
      category_id: categoryId || null,
      type,
      visibility,
      title,
      content,
      image_url: imageUrl,
      event_date: type === 'event' ? eventDate : null,
      event_time: type === 'event' ? eventTime : null,
      event_end_time: type === 'event' && eventEndTime ? eventEndTime : null,
      event_location: type === 'event' ? eventLocation : null,
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert(postData)
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Create notifications for mentioned users
      if (mentions.length > 0 && newPost && userId) {
        for (const mention of mentions) {
          if (mention.type === 'user') {
            await supabase.rpc('create_mention_notification', {
              p_actor_id: userId,
              p_mentioned_user_id: mention.id,
              p_post_id: newPost.id,
            })
          }
        }
      }

      resetForm()
      onClose()
      router.refresh()
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Opprett nytt innlegg"
      confirmClose={hasChanges}
      confirmMessage="Er du sikker på at du vil avbryte? Innholdet vil gå tapt."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4 pb-8">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Post type */}
        <div className="space-y-2">
          <Label>Type innlegg</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="standard"
                checked={type === 'standard'}
                onChange={() => setType('standard')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Standard</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="event"
                checked={type === 'event'}
                onChange={() => setType('event')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Arrangement</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="titleMobile">Tittel *</Label>
          <Input
            id="titleMobile"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Skriv en tittel..."
            required
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="contentMobile">Innhold *</Label>
          <MentionTextarea
            id="contentMobile"
            value={content}
            onChange={(newContent, mentionData) => {
              setContent(newContent)
              setMentions(mentionData)
            }}
            placeholder="Skriv innholdet her... Bruk @ for å nevne noen"
            rows={4}
            required
          />
        </div>

        {/* Event fields */}
        {type === 'event' && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">Arrangementdetaljer</h3>

            <div className="space-y-2">
              <Label htmlFor="eventDateMobile">Dato *</Label>
              <Input
                id="eventDateMobile"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required={type === 'event'}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="eventTimeMobile">Starttid *</Label>
                <Input
                  id="eventTimeMobile"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required={type === 'event'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndTimeMobile">Sluttid</Label>
                <Input
                  id="eventEndTimeMobile"
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocationMobile">Sted *</Label>
              <Input
                id="eventLocationMobile"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="F.eks. Studentersamfundet"
                required={type === 'event'}
              />
            </div>
          </div>
        )}

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="categoryMobile">Kategori</Label>
          <select
            id="categoryMobile"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Velg kategori...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label>Synlighet</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Offentlig</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="members"
                checked={visibility === 'members'}
                onChange={() => setVisibility('members')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Kun medlemmer</span>
            </label>
          </div>
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <Label>Bilde (valgfritt)</Label>

          {imagePreview ? (
            <div className="relative">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Forhåndsvisning"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
              <div className="text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Trykk for å laste opp bilde</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" disabled={loading || uploadingImage} className="w-full">
            {loading ? (uploadingImage ? 'Laster opp bilde...' : 'Publiserer...') : 'Publiser innlegg'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}
