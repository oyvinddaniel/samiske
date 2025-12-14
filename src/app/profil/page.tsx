'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressProfileImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Download, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  phone_public: boolean
  role: string
  created_at: string
}

interface UserStats {
  postCount: number
  commentCount: number
  likeCount: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats>({ postCount: 0, commentCount: 0, likeCount: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [phonePublic, setPhonePublic] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setBio(profileData.bio || '')
        setLocation(profileData.location || '')
        setPhone(profileData.phone || '')
        setPhonePublic(profileData.phone_public || false)
        setAvatarUrl(profileData.avatar_url || '')
      }

      // Fetch stats
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: likeCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        postCount: postCount || 0,
        commentCount: commentCount || 0,
        likeCount: likeCount || 0,
      })

      setLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vennligst velg en bildefil' })
      return
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Bildet kan ikke være større enn 5MB' })
      return
    }

    setUploadingImage(true)
    setMessage(null)

    try {
      // Compress image
      const compressedFile = await compressProfileImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)

      // Upload to Supabase Storage
      const fileExt = 'jpg' // Always save as jpg after compression
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Bilde lastet opp!' })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Kunne ikke laste opp bildet' })
    }

    setUploadingImage(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        bio: bio || null, // Don't trim to preserve whitespace and line breaks
        location: location.trim() || null,
        phone: phone.trim() || null,
        phone_public: phonePublic,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Kunne ikke lagre endringene: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Profilen er oppdatert!' })
      setProfile({ ...profile, full_name: fullName, bio, location, phone, phone_public: phonePublic, avatar_url: avatarUrl })
      setAvatarPreview(null)
    }

    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Du må oppgi passordet ditt')
      return
    }

    setDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDeleteError(data.error || 'Kunne ikke slette kontoen')
        setDeleting(false)
        return
      }

      // Sign out and redirect to home page
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Delete error:', error)
      setDeleteError('En uventet feil oppstod')
      setDeleting(false)
    }
  }

  const resetDeleteDialog = () => {
    setDeletePassword('')
    setDeleteError(null)
    setShowDeleteDialog(false)
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/export-data')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Kunne ikke eksportere data')
      }

      // Hent filnavnet fra Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'samiske-data-export.json'

      // Last ned filen
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Data eksportert! Filen lastes ned.')
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Kunne ikke eksportere data')
    }
    setExporting(false)
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-yellow-500">Moderator</Badge>
      default:
        return <Badge variant="outline">Medlem</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-32 h-6 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Tilbake til forsiden
          </Link>
        </div>

        {/* Profile header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview || profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {uploadingImage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'Ukjent'}
                </h1>
                <p className="text-gray-500">{profile.email}</p>
                {profile.location && (
                  <p className="text-sm text-gray-400 mt-1">📍 {profile.location}</p>
                )}
                {profile.phone && (
                  <p className="text-sm text-gray-400 mt-1">📱 {profile.phone}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {getRoleBadge(profile.role)}
                  <span className="text-sm text-gray-500">
                    Medlem siden {formatDate(profile.created_at)}
                  </span>
                </div>
                {profile.bio && (
                  <p className="text-gray-600 mt-3 text-sm whitespace-pre-wrap">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.postCount}</p>
              <p className="text-sm text-gray-500">Innlegg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.commentCount}</p>
              <p className="text-sm text-gray-500">Kommentarer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.likeCount}</p>
              <p className="text-sm text-gray-500">Likes gitt</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit profile */}
        <Card>
          <CardHeader>
            <CardTitle>Rediger profil</CardTitle>
            <CardDescription>Fortell litt om deg selv slik at andre kan bli kjent med deg</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              {message && (
                <div
                  className={`p-3 text-sm rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Fullt navn</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Skriv inn ditt fulle navn"
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Dette navnet vil vises på innlegg og kommentarer
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Om meg</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fortell litt om deg selv, dine interesser, eller din tilknytning til det samiske miljøet..."
                  rows={4}
                  className="resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {bio.length}/500 tegn
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Sted</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="F.eks. Trondheim, Norge"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobilnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="F.eks. 912 34 567"
                  className="h-11"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="phonePublic"
                    checked={phonePublic}
                    onChange={(e) => setPhonePublic(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="phonePublic" className="text-sm text-gray-600">
                    Vis mobilnummer for andre medlemmer
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>E-post</Label>
                <Input value={profile.email} disabled className="bg-gray-50 h-11" />
                <p className="text-xs text-gray-500">
                  E-postadressen kan ikke endres
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={saving || uploadingImage} className="w-full h-11">
                  {saving ? 'Lagrer...' : 'Lagre endringer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Data export (GDPR) */}
        <Card className="mt-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="w-5 h-5" />
              Dine personopplysninger
            </CardTitle>
            <CardDescription>
              I henhold til GDPR har du rett til innsyn i og portabilitet av dine data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Last ned en komplett kopi av alle dine personopplysninger lagret på samiske.no,
              inkludert profil, innlegg, kommentarer, meldinger og innstillinger.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={exporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Eksporterer...' : 'Last ned mine data'}
              </Button>
              <Link href="/personvern">
                <Button variant="ghost" className="text-blue-600">
                  Les personvernerklæringen
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Delete account */}
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Slett konto</CardTitle>
            <CardDescription>
              Permanent sletting av kontoen din. Denne handlingen kan ikke angres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Når du sletter kontoen din, vil alle dine innlegg, kommentarer, likes og annen data bli permanent slettet.
              Du vil ikke kunne gjenopprette noe av dette.
            </p>

            {deleteError && (
              <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200 mb-4">
                {deleteError}
              </div>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
              if (!open) resetDeleteDialog()
              else setShowDeleteDialog(true)
            }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? 'Sletter...' : 'Slett min konto'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      <p>
                        Denne handlingen kan ikke angres. Dette vil permanent slette kontoen din
                        og fjerne alle dine data fra serverne våre, inkludert:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Alle innlegg du har opprettet</li>
                        <li>Alle kommentarer du har skrevet</li>
                        <li>Alle likes du har gitt</li>
                        <li>Din profilinformasjon</li>
                      </ul>
                      <div className="mt-4">
                        <Label htmlFor="deletePassword" className="text-sm font-medium text-gray-900">
                          Bekreft med passord
                        </Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Skriv inn passordet ditt"
                          className="mt-1"
                          autoComplete="current-password"
                        />
                      </div>
                      {deleteError && (
                        <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteAccount()
                    }}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleting || !deletePassword.trim()}
                  >
                    {deleting ? 'Sletter...' : 'Ja, slett kontoen min'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
