'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { X, ImagePlus } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface CreatePostSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
}

export function CreatePostSheet({ open, onClose, onSuccess, userId }: CreatePostSheetProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Reset form when opening
  const resetForm = () => {
    setTitle('')
    setContent('')
    setType('standard')
    setVisibility('public')
    setEventDate('')
    setEventTime('')
    setEventEndTime('')
    setEventLocation('')
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  // Fetch categories when opened
  useEffect(() => {
    if (!open) return

    const fetchCategories = async () => {
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .order('sort_order')

      if (cats) {
        setCategories(cats)
        // Auto-select generelt if available
        const genereltCat = cats.find(c => c.slug === 'generelt')
        if (genereltCat) {
          setCategoryId(genereltCat.id)
        }
      }
    }

    fetchCategories()
  }, [open, supabase])

  // Auto-select arrangement category when type changes to event
  useEffect(() => {
    if (type === 'event') {
      const arrangementCat = categories.find(c => c.slug === 'arrangement')
      if (arrangementCat) {
        setCategoryId(arrangementCat.id)
      }
    }
  }, [type, categories])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vennligst velg en bildefil')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Bildet kan ikke vaere storre enn 5MB')
        return
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
        console.error('Upload error:', uploadError)
        setUploadingImage(false)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setUploadingImage(false)
      return publicUrl
    } catch (error) {
      console.error('Compression/upload error:', error)
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
        setError('Kunne ikke laste opp bildet. Prov igjen.')
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

    const { error } = await supabase.from('posts').insert(postData)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      resetForm()
      onSuccess?.()
      onClose()
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Opprett innlegg"
      confirmClose={title.length > 0 || content.length > 0}
      confirmMessage="Er du sikker pa at du vil avbryte? Innholdet vil ga tapt."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Post type */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('standard')}
            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
              type === 'standard'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Innlegg
          </button>
          <button
            type="button"
            onClick={() => setType('event')}
            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
              type === 'event'
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Arrangement
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tittel"
            required
            className="text-base"
          />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Hva vil du dele?"
            rows={3}
            required
            className="text-base resize-none"
          />
        </div>

        {/* Event fields */}
        {type === 'event' && (
          <div className="p-3 bg-orange-50 rounded-lg space-y-3">
            <div className="space-y-1">
              <Label htmlFor="eventDate" className="text-xs text-gray-600">Dato</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required={type === 'event'}
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="eventTime" className="text-xs text-gray-600">Fra</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required={type === 'event'}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="eventEndTime" className="text-xs text-gray-600">Til (valgfritt)</Label>
                <Input
                  id="eventEndTime"
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="eventLocation" className="text-xs text-gray-600">Sted</Label>
              <Input
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="F.eks. Studentersamfundet"
                required={type === 'event'}
                className="h-9"
              />
            </div>
          </div>
        )}

        {/* Category & Visibility row */}
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Kategori...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'public' | 'members')}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="public">Offentlig</option>
            <option value="members">Kun medlemmer</option>
          </select>
        </div>

        {/* Image */}
        {imagePreview ? (
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={imagePreview}
                alt="Forhandsvisning"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-sm">Legg til bilde</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || uploadingImage || !title || !content}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (uploadingImage ? 'Laster opp...' : 'Publiserer...') : 'Publiser'}
        </Button>
      </form>
    </BottomSheet>
  )
}
