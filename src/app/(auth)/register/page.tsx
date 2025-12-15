'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MaintenanceBanner, useMaintenanceMode } from '@/components/maintenance/MaintenanceBanner'
import { Loader2 } from 'lucide-react'

// Password validation function
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 10) {
    errors.push('Minimum 10 tegn')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Minst én liten bokstav')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Minst én stor bokstav')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Minst ett tall')
  }

  return { valid: errors.length === 0, errors }
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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
        title="Registrering stengt"
        message={maintenance.message}
      />
    )
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate privacy consent
    if (!privacyConsent) {
      setError('Du må godta personvernerklæringen for å registrere deg')
      setLoading(false)
      return
    }

    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(`Passordet oppfyller ikke kravene: ${validation.errors.join(', ')}`)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          privacy_consent_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600">Registrering vellykket!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Vi har sendt en bekreftelseslenke til <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Sjekk innboksen din og klikk på lenken for å aktivere kontoen.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Gå til innlogging
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Opprett konto</CardTitle>
          <CardDescription>
            Bli med i det samiske miljøet i Trondheim
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Fullt navn</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ola Nordmann"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minst 10 tegn"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                minLength={10}
                required
              />
              {password.length > 0 && (
                <div className="text-xs space-y-1 mt-1">
                  <p className={password.length >= 10 ? 'text-green-600' : 'text-gray-400'}>
                    {password.length >= 10 ? '✓' : '○'} Minimum 10 tegn
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    {/[a-z]/.test(password) ? '✓' : '○'} Minst én liten bokstav
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    {/[A-Z]/.test(password) ? '✓' : '○'} Minst én stor bokstav
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                    {/[0-9]/.test(password) ? '✓' : '○'} Minst ett tall
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="privacy-consent"
                checked={privacyConsent}
                onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
              />
              <label
                htmlFor="privacy-consent"
                className="text-sm text-gray-600 leading-tight cursor-pointer"
              >
                Jeg har lest og godtar{' '}
                <Link
                  href="/personvern"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  personvernerklæringen
                </Link>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrerer...' : 'Registrer deg'}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Har du allerede konto?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Logg inn
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
