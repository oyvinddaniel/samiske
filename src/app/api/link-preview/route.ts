import { NextRequest, NextResponse } from 'next/server'

interface OpenGraphData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  type?: string
  favicon?: string
}

// Simple HTML parser for OG tags
function extractMetaTags(html: string, url: string): OpenGraphData {
  const data: OpenGraphData = { url }

  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
  if (ogTitleMatch) data.title = decodeHtml(ogTitleMatch[1])

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)
  if (ogDescMatch) data.description = decodeHtml(ogDescMatch[1])

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (ogImageMatch) data.image = resolveUrl(ogImageMatch[1], url)

  const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i)
  if (ogSiteNameMatch) data.siteName = decodeHtml(ogSiteNameMatch[1])

  const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:type["']/i)
  if (ogTypeMatch) data.type = ogTypeMatch[1]

  // Fallback to regular meta tags
  if (!data.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) data.title = decodeHtml(titleMatch[1])
  }

  if (!data.description) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    if (descMatch) data.description = decodeHtml(descMatch[1])
  }

  // Twitter card fallbacks
  if (!data.image) {
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (twitterImageMatch) data.image = resolveUrl(twitterImageMatch[1], url)
  }

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
  if (faviconMatch) {
    data.favicon = resolveUrl(faviconMatch[1], url)
  } else {
    // Default favicon path
    try {
      const urlObj = new URL(url)
      data.favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    } catch {
      // Ignore
    }
  }

  return data
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim()
}

function resolveUrl(path: string, base: string): string {
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }
    if (path.startsWith('//')) {
      return 'https:' + path
    }
    const baseUrl = new URL(base)
    if (path.startsWith('/')) {
      return `${baseUrl.protocol}//${baseUrl.host}${path}`
    }
    return new URL(path, base).href
  } catch {
    return path
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    // Fetch the URL with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Samiske/1.0; +https://samiske.no)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nb-NO,nb,en',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL', status: response.status },
        { status: 422 }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json(
        { error: 'URL does not return HTML content' },
        { status: 422 }
      )
    }

    // Read only first 100KB to avoid memory issues
    const reader = response.body?.getReader()
    if (!reader) {
      return NextResponse.json({ error: 'Could not read response' }, { status: 500 })
    }

    let html = ''
    const decoder = new TextDecoder()
    const maxSize = 100 * 1024 // 100KB

    while (html.length < maxSize) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })

      // Check if we have the closing head tag - that's usually enough
      if (html.includes('</head>')) break
    }

    reader.cancel()

    const ogData = extractMetaTags(html, url)

    // Cache for 1 hour
    return NextResponse.json(ogData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
    }

    console.error('Link preview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch link preview' },
      { status: 500 }
    )
  }
}
