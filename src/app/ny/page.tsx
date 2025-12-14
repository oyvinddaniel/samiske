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
import { GeographySelector } from '@/components/geography/GeographySelector'
import { Video, Users, Globe, MapPin } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface LanguageArea {
  id: string
  name: string
  code: string
}

interface PostAsOption {
  type: 'self' | 'group' | 'community'
  id: string | null
  name: string
}

export default function NewPostPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Opprett som (gruppe/samfunn)
  const [postAsOptions, setPostAsOptions] = useState<PostAsOption[]>([])
  const [postAs, setPostAs] = useState<string>('self') // 'self' | 'group:uuid' | 'community:uuid'

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

  // Geografisk tilknytning for arrangementer
  const [geography, setGeography] = useState<{ municipalityId: string | null; placeId: string | null }>({
    municipalityId: null,
    placeId: null
  })
  const [languageAreaId, setLanguageAreaId] = useState<string>('')

  // Digitalt arrangement
  const [isDigital, setIsDigital] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [meetingPlatform, setMeetingPlatform] = useState<string>('')

  // Maks deltakere
  const [maxParticipants, setMaxParticipants] = useState<string>('')

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

      // Fetch language areas for event location
      const { data: langAreas } = await supabase
        .from('language_areas')
        .select('id, name, code')
        .order('sort_order')

      if (langAreas) {
        setLanguageAreas(langAreas)
      }

      // Fetch groups and communities where user can create events
      const postOptions: PostAsOption[] = [{ type: 'self', id: null, name: 'Meg selv' }]

      // Fetch user's groups where they're an approved member
      const { data: userGroups } = await supabase
        .from('group_members')
        .select(`
          role,
          group:groups!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'approved')

      if (userGroups) {
        for (const membership of userGroups) {
          const group = Array.isArray(membership.group) ? membership.group[0] : membership.group
          if (group) {
            // All approved members can create posts in their groups
            postOptions.push({
              type: 'group',
              id: group.id,
              name: `Gruppe: ${group.name}`
            })
          }
        }
      }

      // Fetch user's communities where they're admin
      const { data: userCommunities } = await supabase
        .from('community_admins')
        .select(`
          community:communities!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id)

      if (userCommunities) {
        for (const admin of userCommunities) {
          const community = Array.isArray(admin.community) ? admin.community[0] : admin.community
          if (community) {
            // Only community admins can create posts for communities
            postOptions.push({
              type: 'community',
              id: community.id,
              name: `Samfunn: ${community.name}`
            })
          }
        }
      }

      setPostAsOptions(postOptions)
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

    // Parse postAs to get group/community IDs
    let createdForGroupId: string | null = null
    let createdForCommunityId: string | null = null

    if (postAs.startsWith('group:')) {
      createdForGroupId = postAs.replace('group:', '')
    } else if (postAs.startsWith('community:')) {
      createdForCommunityId = postAs.replace('community:', '')
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
      event_location: type === 'event' && !isDigital ? eventLocation : null,
      // KRITISK: Geografisk tilknytning KUN for personlige innlegg
      // Gruppe/samfunns-innlegg får ALDRI municipality_id/place_id på post-nivå
      municipality_id: (!createdForGroupId && !createdForCommunityId && type === 'event' && !isDigital)
        ? geography.municipalityId
        : null,
      place_id: (!createdForGroupId && !createdForCommunityId && type === 'event' && !isDigital)
        ? geography.placeId
        : null,
      language_area_id: type === 'event' && languageAreaId ? languageAreaId : null,
      // Digitalt arrangement
      is_digital: type === 'event' ? isDigital : false,
      meeting_url: type === 'event' && isDigital ? meetingUrl : null,
      meeting_platform: type === 'event' && isDigital && meetingPlatform ? meetingPlatform : null,
      // Maks deltakere
      max_participants: type === 'event' && maxParticipants ? parseInt(maxParticipants, 10) : null,
      // Opprett på vegne av gruppe/samfunn
      created_for_group_id: createdForGroupId,
      created_for_community_id: createdForCommunityId,
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

        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle>Opprett nytt innlegg</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {/* Post as (group/community) */}
              {postAsOptions.length > 1 && (
                <div className="space-y-2 relative z-50">
                  <Label htmlFor="postAs">Opprett som</Label>
                  <select
                    id="postAs"
                    value={postAs}
                    onChange={(e) => setPostAs(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-50"
                  >
                    {postAsOptions.map((option) => (
                      <option
                        key={option.type === 'self' ? 'self' : `${option.type}:${option.id}`}
                        value={option.type === 'self' ? 'self' : `${option.type}:${option.id}`}
                      >
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {postAs !== 'self' && (
                    <p className="text-xs text-gray-500">
                      Innlegget vil vises som opprettet på vegne av denne gruppen/samfunnet
                    </p>
                  )}
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

                  {/* Digital arrangement toggle */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isDigital}
                        onChange={(e) => setIsDigital(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Video className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Digitalt arrangement</span>
                    </label>
                    {isDigital && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Synlig for hele Sapmi
                      </span>
                    )}
                  </div>

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

                  {/* Digital meeting details */}
                  {isDigital && (
                    <div className="space-y-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="space-y-2">
                        <Label htmlFor="meetingUrl">Motelenke</Label>
                        <Input
                          id="meetingUrl"
                          type="url"
                          value={meetingUrl}
                          onChange={(e) => setMeetingUrl(e.target.value)}
                          placeholder="https://zoom.us/j/... eller https://meet.google.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meetingPlatform">Plattform</Label>
                        <select
                          id="meetingPlatform"
                          value={meetingPlatform}
                          onChange={(e) => setMeetingPlatform(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Velg plattform...</option>
                          <option value="zoom">Zoom</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="meet">Google Meet</option>
                          <option value="whereby">Whereby</option>
                          <option value="other">Annet</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Physical location - KUN for personlige innlegg */}
                  {!isDigital && postAs === 'self' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="eventLocation">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            Sted/adresse *
                          </span>
                        </Label>
                        <Input
                          id="eventLocation"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value.slice(0, 200))}
                          placeholder="F.eks. Studentersamfundet, Elgeseter gate 1"
                          required={type === 'event' && !isDigital && postAs === 'self'}
                          maxLength={200}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-4 h-4" />
                            Geografisk tilknytning
                          </span>
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">
                          Velg kommune/sted for at arrangementet skal vises i riktig kalender
                        </p>
                        <GeographySelector
                          value={geography}
                          onChange={setGeography}
                          placeholder="Velg kommune eller sted"
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Advarsel ved posting til gruppe/samfunn */}
                  {!isDigital && postAs !== 'self' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>OBS:</strong> Ved posting til gruppe/samfunn settes ikke geografisk tilknytning på innlegget.
                        {postAs.startsWith('group:') && ' Hvis gruppen er tilknyttet et sted, vil innlegget vises der.'}
                        {postAs.startsWith('community:') && ' Samfunnets administratorer kan velge hvor innlegget skal publiseres.'}
                      </p>
                    </div>
                  )}

                  {/* Language area (for both digital and physical) */}
                  <div className="space-y-2">
                    <Label htmlFor="languageArea">Sprakområde (valgfritt)</Label>
                    <p className="text-xs text-gray-500">
                      Velg hvis arrangementet er relevant for et spesifikt samisk sprakområde
                    </p>
                    <select
                      id="languageArea"
                      value={languageAreaId}
                      onChange={(e) => setLanguageAreaId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Alle sprakområder</option>
                      {languageAreas.map((la) => (
                        <option key={la.id} value={la.id}>
                          {la.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Max participants */}
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Maks antall deltakere (valgfritt)
                      </span>
                    </Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      max="10000"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      placeholder="La sta tomt for ubegrenset"
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
