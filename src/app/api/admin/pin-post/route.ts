import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verifiser at bruker er admin
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
      return NextResponse.json({ error: 'Kun admin kan pinne innlegg' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { postId, pinned } = body

    if (!postId || typeof pinned !== 'boolean') {
      return NextResponse.json({ error: 'Mangler postId eller pinned' }, { status: 400 })
    }

    // Bruk service role for å oppdatere innlegget (omgår RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({ pinned })
      .eq('id', postId)

    if (updateError) {
      console.error('Error pinning post:', updateError)
      return NextResponse.json({ error: 'Kunne ikke oppdatere innlegg' }, { status: 500 })
    }

    return NextResponse.json({ success: true, pinned })
  } catch (error) {
    console.error('Pin post error:', error)
    return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
  }
}
