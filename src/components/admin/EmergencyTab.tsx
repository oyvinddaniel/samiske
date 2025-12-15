'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertTriangle, Shield, ShieldOff, Loader2, CheckCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MaintenanceStatus {
  enabled: boolean
  message: string
  enabled_at: string | null
  enabled_by: string | null
}

export function EmergencyTab() {
  const [status, setStatus] = useState<MaintenanceStatus>({
    enabled: false,
    message: 'Vi jobber med en oppdatering. Prøv igjen senere.',
    enabled_at: null,
    enabled_by: null
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoutUsers, setLogoutUsers] = useState(true)
  const [lastAction, setLastAction] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/maintenance')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const toggleMaintenance = async (enabled: boolean) => {
    setSaving(true)
    setLastAction(null)

    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          message: status.message,
          logoutAllUsers: enabled && logoutUsers
        })
      })

      const data = await res.json()

      if (data.success) {
        setStatus(prev => ({
          ...prev,
          enabled,
          enabled_at: enabled ? new Date().toISOString() : null
        }))

        if (enabled && data.loggedOutUsers > 0) {
          setLastAction({
            type: 'success',
            message: `Vedlikeholdsmodus aktivert. ${data.loggedOutUsers} brukere logget ut.`
          })
        } else if (enabled) {
          setLastAction({
            type: 'success',
            message: 'Vedlikeholdsmodus aktivert.'
          })
        } else {
          setLastAction({
            type: 'success',
            message: 'Vedlikeholdsmodus deaktivert. Innlogging er åpen igjen.'
          })
        }
      } else {
        setLastAction({
          type: 'error',
          message: data.error || 'Noe gikk galt'
        })
      }
    } catch (error) {
      console.error('Failed to toggle maintenance:', error)
      setLastAction({
        type: 'error',
        message: 'Kunne ikke oppdatere status'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateMessage = async () => {
    setSaving(true)
    setLastAction(null)

    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: status.enabled,
          message: status.message,
          logoutAllUsers: false
        })
      })

      const data = await res.json()

      if (data.success) {
        setLastAction({
          type: 'success',
          message: 'Melding oppdatert.'
        })
      } else {
        setLastAction({
          type: 'error',
          message: data.error || 'Kunne ikke oppdatere melding'
        })
      }
    } catch (error) {
      console.error('Failed to update message:', error)
      setLastAction({
        type: 'error',
        message: 'Kunne ikke oppdatere melding'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Laster...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Emergency Toggle Card */}
      <Card className={cn(
        'border-2 transition-colors',
        status.enabled ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {status.enabled ? (
              <ShieldOff className="w-8 h-8 text-red-600" />
            ) : (
              <Shield className="w-8 h-8 text-green-600" />
            )}
            <div>
              <CardTitle className={status.enabled ? 'text-red-900' : 'text-green-900'}>
                {status.enabled ? 'Plattformen er STENGT' : 'Plattformen er ÅPEN'}
              </CardTitle>
              <CardDescription className={status.enabled ? 'text-red-700' : 'text-green-700'}>
                {status.enabled
                  ? 'Innlogging og registrering er blokkert for alle brukere'
                  : 'Brukere kan logge inn og registrere seg normalt'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {status.enabled ? (
              <Button
                size="lg"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => toggleMaintenance(false)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Åpne plattformen
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={() => toggleMaintenance(true)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                STENG PLATTFORMEN
              </Button>
            )}
          </div>

          {/* Logout option when closing */}
          {!status.enabled && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-white/50 rounded-lg">
              <Switch
                id="logout-users"
                checked={logoutUsers}
                onCheckedChange={setLogoutUsers}
              />
              <Label htmlFor="logout-users" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Logg ut alle brukere når plattformen stenges</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admins forblir innlogget
                </p>
              </Label>
            </div>
          )}

          {/* Status message */}
          {lastAction && (
            <div className={cn(
              'mt-4 p-3 rounded-lg flex items-center gap-2',
              lastAction.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            )}>
              {lastAction.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {lastAction.message}
            </div>
          )}

          {/* Timestamp */}
          {status.enabled && status.enabled_at && (
            <p className="text-xs text-red-600 mt-4">
              Stengt siden: {new Date(status.enabled_at).toLocaleString('nb-NO')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Message Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vedlikeholdsmelding</CardTitle>
          <CardDescription>
            Denne meldingen vises til brukere som prøver å logge inn eller registrere seg
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={status.message}
            onChange={(e) => setStatus(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Skriv en melding til brukerne..."
            rows={3}
          />
          <Button
            variant="outline"
            onClick={updateMessage}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Lagre melding
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Viktig informasjon</p>
              <ul className="mt-1 list-disc list-inside space-y-1 text-amber-700">
                <li>Når plattformen stenges, blokkeres all innlogging og registrering umiddelbart</li>
                <li>Admins kan fortsatt logge inn og bruke admin-panelet</li>
                <li>Brukere som allerede er innlogget vil bli logget ut hvis valgt</li>
                <li>Endringen trer i kraft øyeblikkelig uten redeploy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
