import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY
const BUNNY_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME || 'vz-xxxxxxxx-xxx.b-cdn.net'

// Max video duration: 10 minutes
const MAX_VIDEO_DURATION_SECONDS = 600
// Max video size: 500MB
const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024

interface BunnyCreateVideoResponse {
  videoLibraryId: number
  guid: string
  title: string
  dateUploaded: string
  views: number
  isPublic: boolean
  length: number
  status: number
  framerate: number
  width: number
  height: number
  availableResolutions: string | null
  thumbnailCount: number
  encodeProgress: number
  storageSize: number
  captions: unknown[]
  hasMP4Fallback: boolean
  collectionId: string
  thumbnailFileName: string
  averageWatchTime: number
  totalWatchTime: number
}

// POST: Create a new video in Bunny Stream and return upload URL
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    // Check for required env vars
    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      console.error('Missing Bunny Stream configuration')
      return NextResponse.json(
        { error: 'Videofunksjon er ikke konfigurert' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { title, fileSize, duration } = body

    // Validate file size
    if (fileSize && fileSize > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Video kan ikke være større enn ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Validate duration (if provided)
    if (duration && duration > MAX_VIDEO_DURATION_SECONDS) {
      return NextResponse.json(
        { error: `Video kan ikke være lengre enn ${MAX_VIDEO_DURATION_SECONDS / 60} minutter` },
        { status: 400 }
      )
    }

    // Step 1: Create video object in Bunny Stream
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || `Video fra ${user.email}`,
        }),
      }
    )

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Bunny create video error:', errorText)
      return NextResponse.json(
        { error: 'Kunne ikke opprette video' },
        { status: 500 }
      )
    }

    const videoData: BunnyCreateVideoResponse = await createResponse.json()

    // Return upload URL and video info
    return NextResponse.json({
      videoId: videoData.guid,
      libraryId: BUNNY_LIBRARY_ID,
      uploadUrl: `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoData.guid}`,
      thumbnailUrl: `https://${BUNNY_CDN_HOSTNAME}/${videoData.guid}/thumbnail.jpg`,
      playbackUrl: `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoData.guid}`,
      hlsUrl: `https://${BUNNY_CDN_HOSTNAME}/${videoData.guid}/playlist.m3u8`,
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'En feil oppstod under videoopplasting' },
      { status: 500 }
    )
  }
}

// PUT: Upload video binary to Bunny Stream
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      return NextResponse.json(
        { error: 'Videofunksjon er ikke konfigurert' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID mangler' },
        { status: 400 }
      )
    }

    // Get the raw video data
    const videoData = await request.arrayBuffer()

    // Upload to Bunny Stream
    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Accept': 'application/json',
        },
        body: videoData,
      }
    )

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Bunny upload error:', errorText)
      return NextResponse.json(
        { error: 'Kunne ikke laste opp video' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'En feil oppstod under videoopplasting' },
      { status: 500 }
    )
  }
}

// GET: Get video status/info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autorisert' },
        { status: 401 }
      )
    }

    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      return NextResponse.json(
        { error: 'Videofunksjon er ikke konfigurert' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID mangler' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Kunne ikke hente videostatus' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Status codes: 0=created, 1=uploaded, 2=processing, 3=transcoding, 4=finished, 5=error
    return NextResponse.json({
      status: data.status,
      encodeProgress: data.encodeProgress,
      length: data.length,
      width: data.width,
      height: data.height,
      isReady: data.status === 4,
    })
  } catch (error) {
    console.error('Video status error:', error)
    return NextResponse.json(
      { error: 'En feil oppstod' },
      { status: 500 }
    )
  }
}
