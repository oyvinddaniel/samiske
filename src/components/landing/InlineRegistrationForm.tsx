'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction, Loader2 } from 'lucide-react'
import { useMaintenanceMode } from '@/components/maintenance/MaintenanceBanner'

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

interface InlineRegistrationFormProps {
  onLoginClick: () => void
}

export function InlineRegistrationForm({ onLoginClick }: InlineRegistrationFormProps) {
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
      <Card className="w-full">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  // Always show registration closed message
  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <Construction className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          Registrering stengt
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          Registrering er midlertidig stengt frem til appen er klar til bruk.
        </p>
        <p className="text-xs text-gray-500">
          Har du allerede en konto?
        </p>
        <Button
          variant="outline"
          onClick={onLoginClick}
          className="w-full"
        >
          Logg inn
        </Button>
      </CardContent>
    </Card>
  )

  // Show maintenance message if enabled (kept for future use, but unreachable)
  if (maintenance.enabled) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
            <Construction className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Vedlikehold pågår
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            {maintenance.message}
          </p>
          <p className="text-xs text-gray-500">
            Prøv igjen senere!
          </p>
        </CardContent>
      </Card>
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
      <Card className="w-full">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-green-600">
            ✓ Velkommen!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Din konto er opprettet og klar til bruk.
          </p>
          <p className="text-xs text-gray-500">
            Klikk på "Logg inn" for å fortsette.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Gå inn. Ta en titt.</CardTitle>
        <CardDescription>
          Hvis du ikke er fornøyd kan du enkelt slette kontoen igjen.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-3">
          {error && (
            <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm">Fullt navn</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Ola Nordmann"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">E-post</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm">Passord</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minst 10 tegn"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              minLength={10}
              required
              className="h-9"
            />
            {password.length > 0 && (
              <div className="text-xs space-y-0.5 mt-1">
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
          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="privacy-consent"
              checked={privacyConsent}
              onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
            />
            <label
              htmlFor="privacy-consent"
              className="text-xs text-gray-600 leading-tight cursor-pointer"
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
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full h-9 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30"
            disabled={loading}
          >
            {loading ? 'Registrerer...' : 'Registrer deg'}
          </Button>
          <p className="text-xs text-gray-600 text-center">
            Har du allerede konto?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 hover:underline font-medium"
            >
              Logg inn
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
