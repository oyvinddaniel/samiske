'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Bell, ArrowLeft, Users, MapPin, Home } from 'lucide-react'
import {
  isPushSupported,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from '@/lib/push-notifications'
import { CircleManager } from '@/components/circles'
import { GeographySelector } from '@/components/geography/GeographySelector'
import { getUserLocations, setUserLocation } from '@/lib/geography'
import { toast } from 'sonner'

interface NotificationPreferences {
  email_new_posts: 'none' | 'instant' | 'daily' | 'weekly'
  email_comments: 'none' | 'instant' | 'daily'
  push_enabled: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
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
  const [savingLocations, setSavingLocations] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Check auth and fetch preferences
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check push notification support
      if ('Notification' in window && 'serviceWorker' in navigator) {
        setPushSupported(true)
        setPushPermission(Notification.permission)
      }

      // Fetch preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // PGRST116 = no rows found, which is expected for new users
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error)
      }

      if (data) {
        setPreferences({
          email_new_posts: data.email_new_posts || 'none',
          email_comments: data.email_comments || 'daily',
          push_enabled: data.push_enabled || false,
        })
      }

      // Fetch user locations
      const locations = await getUserLocations(user.id)
      if (locations) {
        setCurrentLocation({
          municipalityId: locations.currentMunicipalityId,
          placeId: locations.currentPlaceId
        })
        setHomeLocation({
          municipalityId: locations.homeMunicipalityId,
          placeId: locations.homePlaceId
        })
      }

      setLoading(false)
    }

    init()
  }, [supabase, router])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)

    // Save notification preferences
    const { error: prefsError } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })

    if (prefsError) {
      alert('Kunne ikke lagre innstillinger. Prøv igjen.')
    } else {
      alert('Innstillinger lagret!')
    }

    setSaving(false)
  }

  const handleEnablePush = async () => {
    if (!(await isPushSupported())) {
      alert('Nettleseren din støtter ikke push-varsler.')
      return
    }

    const permission = await requestPushPermission()
    setPushPermission(permission)

    if (permission === 'granted') {
      // Subscribe to push notifications
      const subscription = await subscribeToPush()

      if (subscription) {
        setPreferences(prev => ({ ...prev, push_enabled: true }))
        // Send a test notification to confirm it works
        await sendTestNotification()
      } else {
        alert('Kunne ikke aktivere push-varsler. Sjekk at VAPID-nøkkel er konfigurert.')
      }
    } else if (permission === 'denied') {
      alert('Du har blokkert push-varsler. Endre dette i nettleserinnstillingene.')
    }
  }

  const handleDisablePush = async () => {
    const success = await unsubscribeFromPush()
    if (success) {
      setPreferences(prev => ({ ...prev, push_enabled: false }))
    }
  }

  const handleSaveLocations = async () => {
    if (!userId) return
    setSavingLocations(true)

    try {
      // Save current location
      await setUserLocation(
        userId,
        'current',
        currentLocation.municipalityId,
        currentLocation.placeId,
        true // auto-star
      )

      // Save home location
      await setUserLocation(
        userId,
        'home',
        homeLocation.municipalityId,
        homeLocation.placeId,
        true // auto-star
      )

      toast.success('Steder lagret! De er lagt til i Mine steder.')
    } catch (error) {
      console.error('Error saving locations:', error)
      toast.error('Kunne ikke lagre steder')
    }

    setSavingLocations(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-center text-gray-500 mt-4">Laster innstillinger...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>

        {/* E-post varsler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              E-postvarsler
            </CardTitle>
            <CardDescription>
              Velg hvordan du vil motta e-postvarsler om aktivitet
            </CardDescription>
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
                  <SelectItem value="instant">Umiddelbart (ved hvert innlegg)</SelectItem>
                  <SelectItem value="daily">Daglig oppsummering</SelectItem>
                  <SelectItem value="weekly">Ukentlig oppsummering</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Få varsel når noen publiserer et nytt innlegg
              </p>
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
                  <SelectItem value="daily">Daglig oppsummering (samler 10-minutters bolker)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Få varsel når noen kommenterer på dine innlegg eller innlegg du har kommentert
              </p>
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
            <CardDescription>
              Motta varsler direkte i nettleseren, selv når du ikke er på siden
            </CardDescription>
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
                      if (checked) {
                        handleEnablePush()
                      } else {
                        handleDisablePush()
                      }
                    }}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Push-varsler støttes ikke i din nettleser.
              </p>
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
            <CardDescription>
              Fortell oss hvor du bor og hvor du kommer fra. Stedene legges automatisk til i Mine steder i sidemenyen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Hvor bor du na?
              </Label>
              <GeographySelector
                value={currentLocation}
                onChange={setCurrentLocation}
                placeholder="Velg kommune eller sted"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Velg kommunen eller stedet du bor na
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="w-4 h-4 text-green-500" />
                Hvor kommer du fra?
              </Label>
              <GeographySelector
                value={homeLocation}
                onChange={setHomeLocation}
                placeholder="Velg kommune eller sted"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Velg hjemstedet ditt eller der du vokste opp
              </p>
            </div>

            <Button
              onClick={handleSaveLocations}
              disabled={savingLocations}
              className="w-full"
            >
              {savingLocations ? 'Lagrer...' : 'Lagre steder'}
            </Button>
          </CardContent>
        </Card>

        {/* Vennesirkler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Vennesirkler
            </CardTitle>
            <CardDescription>
              Organiser vennene dine i sirkler for enklere deling av innlegg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CircleManager />
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <Link href="/">
            <Button variant="outline">Avbryt</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Lagrer...' : 'Lagre innstillinger'}
          </Button>
        </div>
      </main>
    </div>
  )
}
