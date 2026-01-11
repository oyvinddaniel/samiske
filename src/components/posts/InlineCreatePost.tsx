'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MentionTextarea, type MentionData } from '@/components/mentions'
import { VisibilityPicker } from '@/components/circles'
import { setPostCircleVisibility } from '@/lib/circles'
import type { PostVisibility } from '@/lib/types/circles'
import { X, ImagePlus, MapPin, CheckCircle2 } from 'lucide-react'
import { GeographySearchInput, type GeographySelection } from '@/components/geography'
import { cn } from '@/lib/utils'

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

interface InlineCreatePostProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
  defaultGeography?: DefaultGeography | null
  groupId?: string | null
  communityId?: string | null
}

export function InlineCreatePost({ open, onClose, onSuccess, userId, defaultGeography, groupId, communityId }: InlineCreatePostProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
  const [mentions, setMentions] = useState<MentionData[]>([])

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Reset form
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
    setMentions([])
    setError(null)
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

  // Set default geography when opening
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

  // Fetch categories
  useEffect(() => {
    if (!open) return

    const fetchCategories = async () => {
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

  // Scroll into view when opened - with offset
  useEffect(() => {
    if (open && formRef.current) {
      // Get element position and scroll with 150px offset from top
      setTimeout(() => {
        if (formRef.current) {
          const rect = formRef.current.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const targetPosition = scrollTop + rect.top - 150 // 150px from top
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          })
        }
      }, 100) // Small delay to let the form render
    }
  }, [open])

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
        setError('Kunne ikke laste opp bildet. Prøv igjen.')
        setLoading(false)
        return
      }
    }

    // Convert @Name mentions to @[Name](type:id) format for storage
    let processedContent = content
    for (const mention of mentions) {
      // Replace @Name with @[Name](type:id)
      const simplePattern = new RegExp(`@${mention.name}(?![\\w])`, 'g')
      processedContent = processedContent.replace(
        simplePattern,
        `@[${mention.name}](${mention.type}:${mention.id})`
      )
    }

    const postData = {
      user_id: userId,
      category_id: categoryId || null,
      type,
      visibility,
      title,
      content: processedContent,
      image_url: imageUrl,
      event_date: type === 'event' ? eventDate : null,
      event_time: type === 'event' ? eventTime : null,
      event_end_time: type === 'event' && eventEndTime ? eventEndTime : null,
      event_location: type === 'event' ? eventLocation : null,
      language_area_id: selectedGeography?.type === 'language_area' ? selectedGeography.id : null,
      municipality_id: selectedGeography?.type === 'municipality' ? selectedGeography.id : null,
      place_id: selectedGeography?.type === 'place' ? selectedGeography.id : null,
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
      // Set circle visibility if needed
      if (visibility === 'circles' && selectedCircles.length > 0 && newPost) {
        await setPostCircleVisibility(newPost.id, selectedCircles)
      }

      // Handle mentions
      if (mentions.length > 0 && newPost) {
        // Save mentions to post_mentions table
        const mentionsData = mentions.map(m => ({ type: m.type, id: m.id }))
        await supabase.rpc('save_post_mentions', {
          p_post_id: newPost.id,
          p_mentions: mentionsData
        })

        // Send notifications based on mention type
        for (const mention of mentions) {
          if (mention.type === 'user') {
            // Notify individual user
            await supabase.rpc('create_mention_notification', {
              p_actor_id: userId,
              p_mentioned_user_id: mention.id,
              p_post_id: newPost.id,
            })
          } else if (mention.type === 'community') {
            // Notify all community followers
            await supabase.rpc('notify_community_followers_on_mention', {
              p_actor_id: userId,
              p_community_id: mention.id,
              p_post_id: newPost.id,
            })
          }
        }
      }

      setLoading(false)

      // Show success message
      setShowSuccess(true)

      // Reset and close after delay
      setTimeout(() => {
        resetForm()
        setShowSuccess(false)
        onSuccess?.()
        onClose()
      }, 2000)
    }
  }

  const handleCancel = () => {
    if (title.length > 0 || content.length > 0) {
      if (!confirm('Er du sikker på at du vil avbryte? Innholdet vil gå tapt.')) {
        return
      }
    }
    resetForm()
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Innlegget er publisert!</h3>
              <p className="text-sm text-gray-500 mt-1">Ditt innlegg er nå synlig for alle</p>
            </div>
          </div>
        </div>
      )}

      {/* Inline form with smooth expand animation */}
      <div
        ref={formRef}
        className={cn(
          "mb-6 overflow-hidden",
          "animate-in fade-in slide-in-from-top-4 duration-700 ease-out"
        )}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden transform transition-all duration-500 ease-out">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <h2 className="font-semibold text-gray-900">Opprett innlegg</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tittel"
            required
            className="text-base"
          />

          {/* Content */}
          <MentionTextarea
            value={content}
            onChange={(newContent, mentionData) => {
              setContent(newContent)
              setMentions(mentionData)
            }}
            placeholder="Hva vil du dele? Bruk @ for å nevne noen"
            rows={3}
            required
            className="text-base"
          />

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

          {/* Geography */}
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
                  alt="Forhåndsvisning"
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

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingImage || !title || !content}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (uploadingImage ? 'Laster opp...' : 'Publiserer...') : 'Publiser'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </>
  )
}
