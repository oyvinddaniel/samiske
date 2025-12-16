type ActivePanel = 'feed' | 'friends' | 'messages' | 'chat' | 'group' | 'community' | 'community-page' | 'profile' | 'geography' | 'bookmarks' | 'location' | 'post' | 'calendar' | 'groups'

export interface PanelInfo {
  type: ActivePanel
  params: Record<string, string>
}

/**
 * Maps URL pathname to panel type and parameters for SPA navigation
 *
 * Examples:
 * - /samfunn/samisk-kultur → {type: 'community-page', params: {slug: 'samisk-kultur'}}
 * - /bruker/ole → {type: 'profile', params: {username: 'ole'}}
 * - /kalender → {type: 'calendar', params: {}}
 * - /sapmi/no/kautokeino → {type: 'location', params: {level: 'municipality', countryCode: 'no', municipalitySlug: 'kautokeino'}}
 */
export function getPanelFromPathname(pathname: string): PanelInfo {
  // Normalize pathname (remove trailing slash, query params handled separately)
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/'

  // Home feed
  if (cleanPath === '/') {
    return { type: 'feed', params: {} }
  }

  // Communities
  if (cleanPath.startsWith('/samfunn')) {
    const parts = cleanPath.split('/').filter(Boolean)
    if (parts.length === 1) {
      // /samfunn (list view)
      return { type: 'community', params: {} }
    }
    // /samfunn/[slug]
    return {
      type: 'community-page',
      params: { slug: parts[1] }
    }
  }

  // User profiles
  if (cleanPath.startsWith('/bruker/')) {
    const parts = cleanPath.split('/').filter(Boolean)
    const username = parts[1]
    return {
      type: 'profile',
      params: { username }
    }
  }

  // Own profile
  if (cleanPath === '/profil' || cleanPath === '/min-profil') {
    return {
      type: 'profile',
      params: { isOwnProfile: 'true' }
    }
  }

  // Posts
  if (cleanPath.startsWith('/innlegg/')) {
    const parts = cleanPath.split('/').filter(Boolean)
    const postId = parts[1]
    return {
      type: 'post',
      params: { postId }
    }
  }

  // Calendar
  if (cleanPath === '/kalender') {
    return { type: 'calendar', params: {} }
  }

  // Bookmarks
  if (cleanPath === '/bokmerker') {
    return { type: 'bookmarks', params: {} }
  }

  // Groups
  if (cleanPath.startsWith('/grupper')) {
    const parts = cleanPath.split('/').filter(Boolean)
    if (parts.length === 1) {
      // /grupper (list view)
      return { type: 'groups', params: {} }
    }
    // /grupper/[slug]
    return {
      type: 'group',
      params: { slug: parts[1] }
    }
  }

  // Geography (Sapmi) - complex hierarchical structure
  if (cleanPath.startsWith('/sapmi')) {
    return parseGeographyPathname(cleanPath)
  }

  // Default fallback to feed
  return { type: 'feed', params: {} }
}

/**
 * Parses geography URLs with up to 4 levels of nesting
 *
 * Examples:
 * - /sapmi → region level
 * - /sapmi/no → country level
 * - /sapmi/no/kautokeino → municipality level
 * - /sapmi/no/kautokeino/masi → place level
 */
function parseGeographyPathname(pathname: string): PanelInfo {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 1) {
    // /sapmi (root)
    return {
      type: 'geography',
      params: { level: 'region' }
    }
  }

  // Check if it's a language area route: /sapmi/sprak/[code]
  if (parts[1] === 'sprak' && parts.length >= 3) {
    return {
      type: 'location',
      params: {
        level: 'language_area',
        languageCode: parts[2]
      }
    }
  }

  if (parts.length === 2) {
    // /sapmi/[countryCode]
    return {
      type: 'location',
      params: {
        level: 'country',
        countryCode: parts[1]
      }
    }
  }

  if (parts.length === 3) {
    // /sapmi/[countryCode]/[municipalitySlug]
    return {
      type: 'location',
      params: {
        level: 'municipality',
        countryCode: parts[1],
        municipalitySlug: parts[2]
      }
    }
  }

  if (parts.length === 4) {
    // /sapmi/[countryCode]/[municipalitySlug]/[placeSlug]
    return {
      type: 'location',
      params: {
        level: 'place',
        countryCode: parts[1],
        municipalitySlug: parts[2],
        placeSlug: parts[3]
      }
    }
  }

  // Fallback to geography root
  return {
    type: 'geography',
    params: { level: 'region' }
  }
}
