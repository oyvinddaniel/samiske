'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MentionTextarea } from '@/components/mentions'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { VisibilityPicker } from '@/components/circles'
import { setPostCircleVisibility } from '@/lib/circles'
import type { PostVisibility } from '@/lib/types/circles'
import { X, ImagePlus, MapPin } from 'lucide-react'
import { GeographySearchInput, type GeographySelection } from '@/components/geography'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

export interface DefaultGeography {
  type: 'language_area' | 'municipality' | 'place'
  id: string
  name: string
  nameSami?: string | null
}

interface CreatePostSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
  defaultGeography?: DefaultGeography | null
  groupId?: string | null
  communityId?: string | null
}

export function CreatePostSheet({ open, onClose, onSuccess, userId, defaultGeography, groupId, communityId }: CreatePostSheetProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState<'standard' | 'event'>('standard')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [selectedCircles, setSelectedCircles] = useState<string[]>([])
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [selectedGeography, setSelectedGeography] = useState<GeographySelection | null>(null)
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])

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
    setSelectedCircles([])
    setEventDate('')
    setEventTime('')
    setEventEndTime('')
    setEventLocation('')
    setImageFile(null)
    setImagePreview(null)
    setMentionedUserIds([])
    setError(null)
    // Set geography from default if provided
    if (defaultGeography) {
      setSelectedGeography({
        type: defaultGeography.type,
        id: defaultGeography.id,
        name: defaultGeography.name,
        nameSami: defaultGeography.nameSami
      })
    } else {
      setSelectedGeography(null)
    }
  }

  // Set default geography when opening or when it changes
  useEffect(() => {
    if (open && defaultGeography) {
      setSelectedGeography({
        type: defaultGeography.type,
        id: defaultGeography.id,
        name: defaultGeography.name,
        nameSami: defaultGeography.nameSami
      })
    }
  }, [open, defaultGeography])

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
      // Geography
      language_area_id: selectedGeography?.type === 'language_area' ? selectedGeography.id : null,
      municipality_id: selectedGeography?.type === 'municipality' ? selectedGeography.id : null,
      place_id: selectedGeography?.type === 'place' ? selectedGeography.id : null,
      // Group and Community
      created_for_group_id: groupId || null,
      created_for_community_id: communityId || null,
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
      // If visibility is 'circles', set the circle visibility
      if (visibility === 'circles' && selectedCircles.length > 0 && newPost) {
        await setPostCircleVisibility(newPost.id, selectedCircles)
      }

      // Create notifications for mentioned users
      if (mentionedUserIds.length > 0 && newPost) {
        for (const mentionedUserId of mentionedUserIds) {
          await supabase.rpc('create_mention_notification', {
            p_actor_id: userId,
            p_mentioned_user_id: mentionedUserId,
            p_post_id: newPost.id,
          })
        }
      }

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
          <MentionTextarea
            value={content}
            onChange={(newContent, userIds) => {
              setContent(newContent)
              setMentionedUserIds(userIds)
            }}
            placeholder="Hva vil du dele? Bruk @ for å nevne noen"
            rows={3}
            required
            className="text-base"
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

          {/* Only show visibility picker if not posting to a specific geography */}
          {!defaultGeography && (
            <VisibilityPicker
              value={visibility}
              selectedCircles={selectedCircles}
              onChange={(newVisibility, circleIds) => {
                setVisibility(newVisibility)
                setSelectedCircles(circleIds)
              }}
              compact
            />
          )}
        </div>

        {/* Geography - location */}
        {defaultGeography ? (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Publiserer til
            </Label>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{defaultGeography.name}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Knytt til sted (valgfritt)
            </Label>
            <GeographySearchInput
              value={selectedGeography}
              onChange={setSelectedGeography}
              placeholder="Søk etter sted, kommune eller språkområde..."
            />
          </div>
        )}

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
