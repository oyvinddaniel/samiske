'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()
  }, [supabase])

  const handlePasswordChange = (value: string) => {
    setPassword(value)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError('Passordet oppfyller ikke kravene')
      setLoading(false)
      return
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Verifiserer...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No valid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <CardTitle>Ugyldig lenke</CardTitle>
            <CardDescription>
              Lenken er utløpt eller ugyldig. Be om en ny tilbakestillingslenke.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/glemt-passord" className="w-full">
              <Button className="w-full">
                Be om ny lenke
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Tilbake til innlogging
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle>Passord oppdatert!</CardTitle>
            <CardDescription>
              Passordet ditt er nå oppdatert. Du kan logge inn med ditt nye passord.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">
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
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <CardTitle>Velg nytt passord</CardTitle>
          <CardDescription>
            Skriv inn ditt nye passord nedenfor.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Nytt passord</Label>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft passord</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Gjenta passordet"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={10}
                required
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passordene stemmer ikke overens</p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="text-xs text-green-600">✓ Passordene stemmer</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Oppdaterer...' : 'Oppdater passord'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
