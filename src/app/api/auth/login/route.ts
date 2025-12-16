import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limiting
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(`auth:login:${clientId}`, rateLimiters.auth)

  if (!rateLimit.success) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: 'For mange innloggingsforsøk. Prøv igjen senere.' },
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
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-post og passord er påkrevd' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Generisk feilmelding for å unngå account enumeration
      return NextResponse.json(
        { error: 'Feil e-post eller passord' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: data.user,
      session: data.session
    })
  } catch {
    return NextResponse.json(
      { error: 'En feil oppstod' },
      { status: 500 }
    )
  }
}
