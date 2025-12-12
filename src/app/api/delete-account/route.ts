import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    // Get password from request body
    const body = await request.json().catch(() => ({}))
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Du må oppgi passordet ditt for å slette kontoen' },
        { status: 400 }
      )
    }

    // Get current user from session
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Du må være innlogget for å slette kontoen' },
        { status: 401 }
      )
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Feil passord. Vennligst prøv igjen.' },
        { status: 401 }
      )
    }

    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server er ikke konfigurert for kontosletting. Kontakt administrator.' },
        { status: 500 }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete user from auth.users (CASCADE will delete profile, posts, comments, likes, etc.)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Kunne ikke slette kontoen. Prøv igjen senere.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'En uventet feil oppstod' },
      { status: 500 }
    )
  }
}
