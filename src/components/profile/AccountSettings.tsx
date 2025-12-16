'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { compressProfileImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Download, Shield, Trash2, Mail, Bell, MapPin, Users, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  isPushSupported,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-notifications'
import { CircleManager } from '@/components/circles'
import { GeographySelector } from '@/components/geography/GeographySelectorWithAdd'
import { getUserLocations, setUserLocation } from '@/lib/geography'

interface NotificationPreferences {
  email_new_posts: 'none' | 'instant' | 'daily' | 'weekly'
  email_comments: 'none' | 'instant' | 'daily'
  push_enabled: boolean
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  phone_public: boolean
}

interface AccountSettingsProps {
  userId: string
}

export function AccountSettings({ userId }: AccountSettingsProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_posts: 'none',
    email_comments: 'daily',
    push_enabled: false,
  })
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  const [currentLocation, setCurrentLocation] = useState<{
    municipalityId: string | null
    placeId: string | null
  }>({ municipalityId: null, placeId: null })
  const [homeLocation, setHomeLocation] = useState<{
    municipalityId: string | null
    placeId: string | null
  }>({ municipalityId: null, placeId: null })
  const [showCurrentLocation, setShowCurrentLocation] = useState(true)
  const [showHomeLocation, setShowHomeLocation] = useState(true)
  const [savingLocations, setSavingLocations] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exporting, setExporting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const init = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setBio(profileData.bio || '')
        setLocation(profileData.location || '')
        setPhone(profileData.phone || '')
        setPhonePublic(profileData.phone_public || false)
        setAvatarUrl(profileData.avatar_url || '')
        setShowCurrentLocation(profileData.show_current_location ?? true)
        setShowHomeLocation(profileData.show_home_location ?? true)
      }

      // Check push notification support
      if ('Notification' in window && 'serviceWorker' in navigator) {
        setPushSupported(true)
        setPushPermission(Notification.permission)
      }

      // Fetch notification preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error fetching preferences:', prefsError)
      }

      if (prefsData) {
        setPreferences({
          email_new_posts: prefsData.email_new_posts || 'none',
          email_comments: prefsData.email_comments || 'daily',
          push_enabled: prefsData.push_enabled || false,
        })
      }

      // Fetch user locations
      const locations = await getUserLocations(userId)
      console.log('👤 User locations loaded:', locations)
      if (locations) {
        setCurrentLocation({
          municipalityId: locations.currentMunicipalityId,
          placeId: locations.currentPlaceId
        })
        setHomeLocation({
          municipalityId: locations.homeMunicipalityId,
          placeId: locations.homePlaceId
        })
        console.log('👤 Home location set to:', {
          municipalityId: locations.homeMunicipalityId,
          placeId: locations.homePlaceId
        })
      }

      setLoading(false)
    }

    init()
  }, [userId, supabase])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bildet kan ikke være større enn 5MB')
      return
    }

    setUploadingImage(true)

    try {
      const compressedFile = await compressProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)

      const fileExt = 'jpg'
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      toast.success('Bilde lastet opp!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp bildet')
    }

    setUploadingImage(false)
  }

  const handleSaveAll = async () => {
    if (!profile) return

    setSaving(true)
    let hasError = false

    try {
      // Save profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          bio: bio || null,
          location: location.trim() || null,
          phone: phone.trim() || null,
          phone_public: phonePublic,
          avatar_url: avatarUrl || null,
          show_current_location: showCurrentLocation,
          show_home_location: showHomeLocation,
        })
        .eq('id', profile.id)

      if (profileError) {
        console.error('Profile save error:', profileError)
        hasError = true
      } else {
        setProfile({ ...profile, full_name: fullName, bio, location, phone, phone_public: phonePublic, avatar_url: avatarUrl })
        setAvatarPreview(null)
      }

      // Save notification preferences
      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id'
          }
        )

      if (prefsError) {
        console.error('Preferences save error:', prefsError)
        hasError = true
      }

      // Save locations if changed
      if (currentLocation.municipalityId || currentLocation.placeId) {
        await setUserLocation(userId, 'current', currentLocation.municipalityId, currentLocation.placeId)
      }
      if (homeLocation.municipalityId || homeLocation.placeId) {
        await setUserLocation(userId, 'home', homeLocation.municipalityId, homeLocation.placeId)
      }

      if (hasError) {
        toast.error('Noen innstillinger kunne ikke lagres')
      } else {
        toast.success('Alle innstillinger lagret!')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Kunne ikke lagre endringene')
    }

    setSaving(false)
  }

  const handleEnablePush = async () => {
    if (!(await isPushSupported())) {
      toast.error('Nettleseren din støtter ikke push-varsler')
      return
    }

    const permission = await requestPushPermission()
    setPushPermission(permission)

    if (permission === 'granted') {
      const subscription = await subscribeToPush()
      if (subscription) {
        setPreferences(prev => ({ ...prev, push_enabled: true }))
        await supabase
          .from('notification_preferences')
          .upsert(
            {
              user_id: userId,
              push_enabled: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id'
            }
          )
        toast.success('Push-varsler aktivert!')
      }
    }
  }

  const handleDisablePush = async () => {
    await unsubscribeFromPush()
    setPreferences(prev => ({ ...prev, push_enabled: false }))
    await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          push_enabled: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id'
        }
      )
    toast.success('Push-varsler deaktivert')
  }

  const handleCurrentLocationChange = (value: { municipalityId: string | null; placeId: string | null }) => {
    setCurrentLocation(value)
  }

  const handleHomeLocationChange = (value: { municipalityId: string | null; placeId: string | null }) => {
    setHomeLocation(value)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDeleteError(data.error || 'Kunne ikke slette kontoen')
        setDeleting(false)
        return
      }

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

      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'samiske-data-export.json'

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
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Laster innstillinger...</div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Rediger profil
          </CardTitle>
          <CardDescription>Fortell litt om deg selv slik at andre kan bli kjent med deg</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarPreview || profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
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
              <div>
                <p className="text-sm font-medium text-gray-700">Profilbilde</p>
                <p className="text-xs text-gray-500">Klikk på bildet for å endre</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Fullt navn</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Skriv inn ditt fulle navn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Om meg</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Fortell litt om deg selv..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{bio.length}/500 tegn</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Sted</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="F.eks. Trondheim, Norge"
              />
              <p className="text-xs text-amber-600">
                ⚠️ Denne kommer til å forsvinne. Gå ned til Mine steder for å velge dine steder.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Mobilnummer</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="F.eks. 912 34 567"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="phonePublic"
                  checked={phonePublic}
                  onChange={(e) => setPhonePublic(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="phonePublic" className="text-sm text-gray-600">
                  Vis mobilnummer for andre medlemmer
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-post</Label>
              <Input value={profile.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">E-postadressen kan ikke endres</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E-post varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            E-postvarsler
          </CardTitle>
          <CardDescription>Velg hvordan du vil motta e-postvarsler om aktivitet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email_new_posts">Nye innlegg</Label>
            <Select
              value={preferences.email_new_posts}
              onValueChange={(value) =>
                setPreferences(prev => ({ ...prev, email_new_posts: value as NotificationPreferences['email_new_posts'] }))
              }
            >
              <SelectTrigger id="email_new_posts">
                <SelectValue placeholder="Velg frekvens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen varsler</SelectItem>
                <SelectItem value="instant">Umiddelbart</SelectItem>
                <SelectItem value="daily">Daglig oppsummering</SelectItem>
                <SelectItem value="weekly">Ukentlig oppsummering</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_comments">Kommentarer på dine innlegg</Label>
            <Select
              value={preferences.email_comments}
              onValueChange={(value) =>
                setPreferences(prev => ({ ...prev, email_comments: value as NotificationPreferences['email_comments'] }))
              }
            >
              <SelectTrigger id="email_comments">
                <SelectValue placeholder="Velg frekvens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen varsler</SelectItem>
                <SelectItem value="instant">Umiddelbart</SelectItem>
                <SelectItem value="daily">Daglig oppsummering</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Push-varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Push-varsler i nettleser
          </CardTitle>
          <CardDescription>Motta varsler direkte i nettleseren</CardDescription>
        </CardHeader>
        <CardContent>
          {pushSupported ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Push-varsler</p>
                <p className="text-xs text-gray-500">
                  {pushPermission === 'granted'
                    ? 'Aktivert - du vil motta varsler'
                    : pushPermission === 'denied'
                    ? 'Blokkert - aktiver i nettleserinnstillinger'
                    : 'Klikk for å aktivere'
                  }
                </p>
              </div>
              {pushPermission === 'denied' ? (
                <p className="text-xs text-red-500">Blokkert</p>
              ) : (
                <Switch
                  checked={preferences.push_enabled && pushPermission === 'granted'}
                  onCheckedChange={(checked) => {
                    if (checked) handleEnablePush()
                    else handleDisablePush()
                  }}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Push-varsler støttes ikke i din nettleser.</p>
          )}
        </CardContent>
      </Card>

      {/* Mine steder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Mine steder
          </CardTitle>
          <CardDescription>Velg hvor du bor nå og hvor du kommer fra</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nåværende sted</Label>
              <GeographySelector
                value={{
                  municipalityId: currentLocation.municipalityId,
                  placeId: currentLocation.placeId
                }}
                onChange={handleCurrentLocationChange}
                placeholder="Velg nåværende sted"
                disabled={savingLocations}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-current-location"
                checked={showCurrentLocation}
                onChange={(e) => setShowCurrentLocation(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-current-location" className="text-sm text-gray-700 cursor-pointer">
                Vis nåværende sted offentlig på profilen
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Hjemsted</Label>
              <GeographySelector
                value={{
                  municipalityId: homeLocation.municipalityId,
                  placeId: homeLocation.placeId
                }}
                onChange={handleHomeLocationChange}
                placeholder="Velg hjemsted"
                disabled={savingLocations}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-home-location"
                checked={showHomeLocation}
                onChange={(e) => setShowHomeLocation(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-home-location" className="text-sm text-gray-700 cursor-pointer">
                Vis hjemsted offentlig på profilen
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sirkler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Mine sirkler
          </CardTitle>
          <CardDescription>Organiser dine venner i sirkler</CardDescription>
        </CardHeader>
        <CardContent>
          <CircleManager />
        </CardContent>
      </Card>

      {/* Data export (GDPR) */}
      <Card className="border-blue-200">
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
            Last ned en komplett kopi av alle dine personopplysninger lagret på samiske.no.
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
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Slett konto
          </CardTitle>
          <CardDescription>
            Permanent sletting av kontoen din. Denne handlingen kan ikke angres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Når du sletter kontoen din, vil alle dine innlegg, kommentarer, likes og annen data bli permanent slettet.
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
                      og fjerne alle dine data.
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

      {/* Master save button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 shadow-lg">
        <Button
          onClick={handleSaveAll}
          disabled={saving || uploadingImage}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {saving ? 'Lagrer alle endringer...' : 'Lagre alle endringer'}
        </Button>
      </div>
    </div>
  )
}
