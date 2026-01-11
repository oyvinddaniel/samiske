import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit'

export async function DELETE(request: Request) {
  try {
    // Rate limit check (very strict for account deletion)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`delete-account:${clientId}`, rateLimiters.sensitive)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'For mange forsøk. Vennligst vent før du prøver igjen.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

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

    // GDPR: Slett bilder fra storage før bruker slettes
    try {
      // 1. Hent brukerens profil for avatar
      const { data: profile } = await adminClient
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      // 2. Hent alle innlegg med bilder
      const { data: posts } = await adminClient
        .from('posts')
        .select('image_url')
        .eq('user_id', user.id)
        .not('image_url', 'is', null)

      // 3. Samle alle bilde-URLer
      const imageUrls: string[] = []

      if (profile?.avatar_url) {
        imageUrls.push(profile.avatar_url)
      }

      if (posts) {
        for (const post of posts) {
          if (post.image_url) {
            imageUrls.push(post.image_url)
          }
        }
      }

      // 4. Ekstraher fil-stier fra URLer og slett fra storage
      const filePaths: string[] = []
      for (const url of imageUrls) {
        // URL format: https://xxx.supabase.co/storage/v1/object/public/images/avatars/xxx.jpg
        // eller: https://xxx.supabase.co/storage/v1/object/public/images/posts/xxx.jpg
        const match = url.match(/\/images\/(.+)$/)
        if (match) {
          filePaths.push(match[1])
        }
      }

      if (filePaths.length > 0) {
        const { error: storageError } = await adminClient.storage
          .from('images')
          .remove(filePaths)

        if (storageError) {
          console.error('Error deleting images from storage:', storageError)
          // Fortsett med sletting selv om bilder ikke kunne slettes
        }
      }
    } catch (storageError) {
      console.error('Error cleaning up storage:', storageError)
      // Fortsett med sletting selv om storage cleanup feiler
    }

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
