'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

export default function NewPostPage() {
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

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Fetch categories
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

    init()
  }, [supabase, router])

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vennligst velg en bildefil')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Bildet kan ikke være større enn 5MB')
        return
      }

      setImageFile(file)
      setError(null)

      // Create preview
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
      // Compress image before uploading
      const compressedFile = await compressPostImage(imageFile)

      const fileExt = 'jpg' // Always save as jpg after compression
      const fileName = `${userId}-${Date.now()}.${fileExt}`
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

    // Upload image if selected
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

    const { error } = await supabase.from('posts').insert(postData)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Tilbake til forsiden
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opprett nytt innlegg</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <span className="text-sm">Standard innlegg</span>
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
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="Skriv en tittel..."
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 text-right">{title.length}/100 tegn</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Innhold *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                  placeholder="Skriv innholdet her..."
                  rows={5}
                  required
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 text-right">{content.length}/5000 tegn</p>
              </div>

              {/* Event fields */}
              {type === 'event' && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-medium text-gray-900">Arrangementdetaljer</h3>

                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Dato *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required={type === 'event'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventTime">Starttid *</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        required={type === 'event'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventEndTime">Sluttid (valgfritt)</Label>
                      <Input
                        id="eventEndTime"
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventLocation">Sted *</Label>
                    <Input
                      id="eventLocation"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value.slice(0, 200))}
                      placeholder="F.eks. Studentersamfundet, Trondheim"
                      required={type === 'event'}
                      maxLength={200}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
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
                    <span className="text-sm">Offentlig (alle kan se)</span>
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
                    <div className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-gray-100">
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
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  >
                    <div className="text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">Klikk for å laste opp bilde</p>
                      <p className="text-xs mt-1">PNG, JPG eller GIF (maks 5MB)</p>
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
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading || uploadingImage} className="flex-1">
                  {loading ? (uploadingImage ? 'Laster opp bilde...' : 'Publiserer...') : 'Publiser innlegg'}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline">
                    Avbryt
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
