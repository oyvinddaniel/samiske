/**
 * Test API for å verifisere e-postutsending
 * Tilgang: http://localhost:3000/api/test-email?email=test@example.com
 *
 * VIKTIG: Slett denne filen etter testing!
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testEmail = searchParams.get('email')

  if (!testEmail || !testEmail.includes('@')) {
    return NextResponse.json({
      error: 'Mangler gyldig e-postadresse. Bruk: /api/test-email?email=din@epost.no'
    }, { status: 400 })
  }

  const supabase = await createClient()
  const testPassword = 'TestPassord123!'

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      data: {
        full_name: 'Test Bruker',
        privacy_consent_at: new Date().toISOString(),
      }
    }
  })

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: 'Registrering vellykket!',
    details: {
      userId: data.user?.id,
      email: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at ? true : false,
      sessionCreated: data.session ? true : false,
      analysis: {
        emailConfirmationRequired: !data.session,
        message: !data.session
          ? '✅ E-postbekreftelse er aktivert. Sjekk innboksen til ' + testEmail
          : '⚠️  E-postbekreftelse ser ut til å være DEAKTIVERT! Brukeren ble logget inn umiddelbart.'
      }
    }
  })
}
