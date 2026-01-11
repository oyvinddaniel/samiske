import { NextRequest, NextResponse } from 'next/server'

const TENOR_API_URL = 'https://tenor.googleapis.com/v2'
const TENOR_API_KEY = process.env.TENOR_API_KEY

interface TenorResult {
  id: string
  title: string
  media_formats: {
    gif: { url: string; dims: [number, number]; size: number }
    tinygif: { url: string; dims: [number, number]; size: number }
    mediumgif: { url: string; dims: [number, number]; size: number }
    nanogif: { url: string; dims: [number, number]; size: number }
  }
  created: number
  content_description: string
}

interface TenorSearchResponse {
  results: TenorResult[]
  next: string
}

export async function GET(request: NextRequest) {
  if (!TENOR_API_KEY) {
    return NextResponse.json(
      { error: 'Tenor API key not configured' },
      { status: 500 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get('q')
  const pos = searchParams.get('pos') || ''
  const type = searchParams.get('type') || 'search' // 'search' or 'featured'
  const limit = searchParams.get('limit') || '20'

  try {
    let url: string

    if (type === 'featured' || !q) {
      // Featured/trending GIFs
      url = `${TENOR_API_URL}/featured?key=${TENOR_API_KEY}&client_key=samiske&limit=${limit}&media_filter=gif,tinygif,nanogif${pos ? `&pos=${pos}` : ''}`
    } else {
      // Search GIFs
      url = `${TENOR_API_URL}/search?key=${TENOR_API_KEY}&client_key=samiske&q=${encodeURIComponent(q)}&limit=${limit}&media_filter=gif,tinygif,nanogif${pos ? `&pos=${pos}` : ''}`
    }

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Tenor API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch GIFs' },
        { status: response.status }
      )
    }

    const data: TenorSearchResponse = await response.json()

    // Transform the response to a simpler format
    const gifs = data.results.map((gif) => ({
      id: gif.id,
      title: gif.content_description || gif.title,
      preview: gif.media_formats.nanogif?.url || gif.media_formats.tinygif?.url,
      url: gif.media_formats.mediumgif?.url || gif.media_formats.gif?.url,
      fullUrl: gif.media_formats.gif?.url,
      width: gif.media_formats.mediumgif?.dims?.[0] || gif.media_formats.gif?.dims?.[0],
      height: gif.media_formats.mediumgif?.dims?.[1] || gif.media_formats.gif?.dims?.[1],
    }))

    return NextResponse.json({
      gifs,
      next: data.next,
    })
  } catch (error) {
    console.error('GIF API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GIFs' },
      { status: 500 }
    )
  }
}
