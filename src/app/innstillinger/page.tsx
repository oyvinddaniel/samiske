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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Bell, MessageSquare, ArrowLeft, Phone } from 'lucide-react'
import {
  isPushSupported,
  getPushPermission,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
} from '@/lib/push-notifications'

interface NotificationPreferences {
  email_new_posts: 'none' | 'instant' | 'daily' | 'weekly'
  email_comments: 'none' | 'instant' | 'daily'
  push_enabled: boolean
  sms_enabled: boolean
  sms_new_posts: boolean
  sms_comments: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_new_posts: 'none',
    email_comments: 'daily',
    push_enabled: false,
    sms_enabled: false,
    sms_new_posts: false,
    sms_comments: false,
  })
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')
  const [phoneNumber, setPhoneNumber] = useState('')
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
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences({
          email_new_posts: data.email_new_posts || 'none',
          email_comments: data.email_comments || 'daily',
          push_enabled: data.push_enabled || false,
          sms_enabled: data.sms_enabled || false,
          sms_new_posts: data.sms_new_posts || false,
          sms_comments: data.sms_comments || false,
        })
      }

      // Fetch phone number from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single()

      if (profile?.phone_number) {
        setPhoneNumber(profile.phone_number)
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

    // Save phone number to profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ phone_number: phoneNumber || null })
      .eq('id', userId)

    if (prefsError || profileError) {
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

        {/* SMS-varsler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              SMS-varsler
            </CardTitle>
            <CardDescription>
              Motta viktige varsler på SMS (krever telefonnummer i profilen)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone number input */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefonnummer</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="12345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Norsk mobilnummer (8 siffer). Landskode +47 legges til automatisk.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Aktiver SMS-varsler</p>
                <p className="text-xs text-gray-500">
                  {phoneNumber ? 'SMS sendes til ' + phoneNumber : 'Legg til telefonnummer først'}
                </p>
              </div>
              <Switch
                checked={preferences.sms_enabled}
                disabled={!phoneNumber}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, sms_enabled: checked }))
                }
              />
            </div>

            {preferences.sms_enabled && phoneNumber && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_new_posts" className="text-sm">
                    Nye innlegg
                  </Label>
                  <Switch
                    id="sms_new_posts"
                    checked={preferences.sms_new_posts}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, sms_new_posts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_comments" className="text-sm">
                    Kommentarer på mine innlegg
                  </Label>
                  <Switch
                    id="sms_comments"
                    checked={preferences.sms_comments}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, sms_comments: checked }))
                    }
                  />
                </div>
              </div>
            )}
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
