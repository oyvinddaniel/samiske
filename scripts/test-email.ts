/**
 * Test script for å verifisere e-postutsending via Supabase
 * Kjør: npx tsx scripts/test-email.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Mangler Supabase-variabler')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailSignup() {
  console.log('🧪 Tester e-postutsending...\n')

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'Test1234567890'

  console.log(`📧 Prøver å registrere: ${testEmail}`)

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/callback'
    }
  })

  if (error) {
    console.error('\n❌ Feil ved registrering:', error.message)
    return
  }

  console.log('\n✅ Registrering vellykket!')
  console.log('\n📊 Detaljer:')
  console.log('- Bruker-ID:', data.user?.id)
  console.log('- E-post:', data.user?.email)
  console.log('- E-post bekreftet:', data.user?.email_confirmed_at ? 'Ja' : 'Nei (venter på bekreftelse)')
  console.log('- Session:', data.session ? 'Opprettet' : 'Ingen (krever e-postbekreftelse)')

  if (!data.session) {
    console.log('\n⚠️  Ingen session ble opprettet - dette betyr at e-postbekreftelse er påkrevd.')
    console.log('📬 Sjekk om e-posten ble sendt til:', testEmail)
    console.log('\n💡 Tips:')
    console.log('   1. Sjekk spam-mappen')
    console.log('   2. Vent noen minutter (e-poster kan forsinkes)')
    console.log('   3. Sjekk Supabase Dashboard → Logs for feilmeldinger')
    console.log('   4. Verifiser at "Confirm email" er aktivert i Auth-innstillingene')
  } else {
    console.log('\n⚠️  E-postbekreftelse kan være deaktivert!')
    console.log('   Brukeren ble logget inn uten å bekrefte e-posten.')
  }
}

testEmailSignup()
