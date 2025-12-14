import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    // Rate limit check
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(`export-data:${clientId}`, rateLimiters.export)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'For mange forsøk. Du kan eksportere data 5 ganger i timen.' },
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

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Du må være innlogget for å laste ned dine data' },
        { status: 401 }
      )
    }

    // Hent all brukerdata parallelt
    const [
      profileResult,
      postsResult,
      commentsResult,
      likesResult,
      friendshipsResult,
      messagesResult,
      notificationPrefsResult,
      starredMunicipalitiesResult,
      starredPlacesResult,
      feedbackResult,
    ] = await Promise.all([
      // Profil
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, bio, location, phone, phone_public, role, created_at, updated_at, privacy_consent_at, onboarding_completed')
        .eq('id', user.id)
        .single(),

      // Innlegg
      supabase
        .from('posts')
        .select('id, title, content, type, visibility, image_url, event_date, event_time, event_location, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Kommentarer
      supabase
        .from('comments')
        .select('id, post_id, content, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Likes
      supabase
        .from('likes')
        .select('id, post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Venneforhold
      supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status, created_at')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),

      // Meldinger
      supabase
        .from('messages')
        .select('id, conversation_id, content, created_at')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false }),

      // Varslingsinnstillinger
      supabase
        .from('notification_preferences')
        .select('email_new_posts, email_comments, push_enabled, created_at, updated_at')
        .eq('user_id', user.id)
        .single(),

      // Favoritt-kommuner
      supabase
        .from('user_starred_municipalities')
        .select('municipality_id, starred_at, municipalities(name)')
        .eq('user_id', user.id),

      // Favoritt-steder
      supabase
        .from('user_starred_places')
        .select('place_id, starred_at, places(name)')
        .eq('user_id', user.id),

      // Tilbakemeldinger
      supabase
        .from('feedback')
        .select('id, message, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    // Bygg dataeksport-objekt
    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,

      profile: profileResult.data || null,

      posts: postsResult.data || [],
      posts_count: postsResult.data?.length || 0,

      comments: commentsResult.data || [],
      comments_count: commentsResult.data?.length || 0,

      likes: likesResult.data || [],
      likes_count: likesResult.data?.length || 0,

      friendships: friendshipsResult.data || [],
      friendships_count: friendshipsResult.data?.length || 0,

      messages_sent: messagesResult.data || [],
      messages_count: messagesResult.data?.length || 0,

      notification_preferences: notificationPrefsResult.data || null,

      starred_municipalities: starredMunicipalitiesResult.data || [],
      starred_places: starredPlacesResult.data || [],

      feedback: feedbackResult.data || [],

      // Metadata
      _gdpr_info: {
        description: 'Dette er en eksport av alle dine personopplysninger lagret på samiske.no',
        format: 'JSON',
        generated_by: 'samiske.no GDPR dataeksport',
        your_rights: {
          access: 'Du har rett til innsyn i dine data (denne filen)',
          rectification: 'Du kan rette feil data på din profilside',
          erasure: 'Du kan slette kontoen din fra profilsiden',
          portability: 'Du kan ta med deg denne filen til en annen tjeneste',
        },
        contact: 'kontakt@samiske.no',
        privacy_policy: 'https://samiske.no/personvern',
      },
    }

    // Returner som JSON-fil for nedlasting
    const filename = `samiske-data-export-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'En feil oppstod ved eksport av data' },
      { status: 500 }
    )
  }
}
