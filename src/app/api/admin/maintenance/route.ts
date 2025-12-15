import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single()

    if (error) {
      return NextResponse.json({ enabled: false, message: '' })
    }

    return NextResponse.json({
      enabled: data.value?.enabled || false,
      message: data.value?.message || '',
      enabled_at: data.value?.enabled_at,
      enabled_by: data.value?.enabled_by
    })
  } catch {
    return NextResponse.json({ enabled: false, message: '' })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin status
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, message, logoutAllUsers } = body

    // Update maintenance mode setting
    const { error: updateError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'maintenance_mode',
        value: {
          enabled,
          message: message || 'Vi jobber med en oppdatering. Prøv igjen senere.',
          enabled_at: enabled ? new Date().toISOString() : null,
          enabled_by: enabled ? user.id : null
        },
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })

    if (updateError) {
      console.error('Error updating maintenance mode:', updateError)
      return NextResponse.json({ error: 'Kunne ikke oppdatere innstilling' }, { status: 500 })
    }

    // If enabling and logoutAllUsers is true, invalidate all sessions
    if (enabled && logoutAllUsers) {
      // Get all users except admins
      const { data: nonAdminUsers } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .neq('role', 'admin')

      if (nonAdminUsers && nonAdminUsers.length > 0) {
        // Sign out each non-admin user
        for (const u of nonAdminUsers) {
          await supabaseAdmin.auth.admin.signOut(u.id, 'global')
        }
      }

      return NextResponse.json({
        success: true,
        enabled,
        loggedOutUsers: nonAdminUsers?.length || 0
      })
    }

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('Maintenance mode error:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}
