import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit'

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

export async function POST(request: Request) {
  // Rate limiting (stricter for registration)
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`auth:register:${clientId}`, rateLimiters.register)

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'For mange registreringsforsøk. Prøv igjen senere.' },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      }
    )
  }

  try {
    const { email, password, fullName, privacyConsent } = await request.json()

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Alle felt er påkrevd' },
        { status: 400 }
      )
    }

    // Validate privacy consent
    if (!privacyConsent) {
      return NextResponse.json(
        { error: 'Du må godta personvernerklæringen for å registrere deg' },
        { status: 400 }
      )
    }

    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Passordet oppfyller ikke kravene: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the origin from the request for the redirect URL
    const origin = request.headers.get('origin') || 'https://samiske.no'

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
          privacy_consent_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      // Don't reveal if email already exists
      return NextResponse.json(
        { error: 'Kunne ikke opprette konto. Prøv igjen.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user
    })
  } catch {
    return NextResponse.json(
      { error: 'En feil oppstod' },
      { status: 500 }
    )
  }
}
