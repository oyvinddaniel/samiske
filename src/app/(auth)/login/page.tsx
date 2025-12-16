'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceBanner, useMaintenanceMode } from '@/components/maintenance/MaintenanceBanner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const maintenance = useMaintenanceMode()

  // Show loading while checking maintenance status
  if (maintenance.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Show maintenance banner if enabled
  if (maintenance.enabled) {
    return (
      <MaintenanceBanner
        title="Innlogging stengt"
        message={maintenance.message}
      />
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Bruk API-rute med rate limiting
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError('For mange innloggingsforsøk. Prøv igjen om 15 minutter.')
        } else {
          setError(data.error || 'Feil e-post eller passord')
        }
        setLoading(false)
        return
      }

      // Oppdater Supabase-session på klienten
      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      // Use hard reload to ensure all client-side components get fresh auth state
      window.location.href = '/'
    } catch {
      setError('En feil oppstod. Prøv igjen.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Logg inn</CardTitle>
          <CardDescription>
            Velkommen tilbake til samiske.no
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passord</Label>
                <Link href="/glemt-passord" className="text-xs text-blue-600 hover:underline">
                  Glemt passord?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logger inn...' : 'Logg inn'}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Har du ikke konto?{' '}
              <Link href="/register" className="text-blue-600 hover:underline">
                Registrer deg
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
