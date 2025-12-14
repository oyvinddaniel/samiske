// Search query functions for all categories

import { createClient } from '@/lib/supabase/client'
import type {
  UserSearchResult,
  PostSearchResult,
  EventSearchResult,
  CommentSearchResult,
  GeographySearchResult,
  CommunitySearchResult,
  ServiceSearchResult,
  ProductSearchResult,
} from '@/components/search/searchTypes'

const supabase = createClient()

// ============================================
// 1. USERS (Brukere)
// ============================================

export async function searchUsers(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<UserSearchResult[]> {
  let queryBuilder = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, created_at')
    .order('created_at', { ascending: false })

  // If query is provided, filter by name
  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.ilike('full_name', `%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((user) => ({
      id: user.id,
      type: 'brukere' as const,
      full_name: user.full_name || '',
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    })) || []
  )
}

// ============================================
// 2. POSTS (Innlegg - standard only)
// ============================================

export async function searchPosts(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<PostSearchResult[]> {
  let queryBuilder = supabase
    .from('posts')
    .select(
      `
      id,
      title,
      content,
      image_url,
      created_at,
      pinned,
      category:categories(name, color),
      user:profiles!posts_user_id_fkey(full_name, avatar_url)
    `
    )
    .eq('type', 'standard')
    .order('pinned', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // If query is provided, search in title and content
  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,content.ilike.%${query}%`
    )
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((post) => ({
      id: post.id,
      type: 'innlegg' as const,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      category: Array.isArray(post.category) ? post.category[0] : post.category,
      user: Array.isArray(post.user) ? post.user[0] : post.user,
    })) || []
  )
}

// ============================================
// 3. EVENTS (Arrangementer)
// ============================================

export async function searchEvents(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<EventSearchResult[]> {
  const today = new Date().toISOString().split('T')[0]

  let queryBuilder = supabase
    .from('posts')
    .select(
      `
      id,
      title,
      content,
      event_date,
      event_time,
      event_location,
      image_url,
      created_at,
      category:categories(name, color)
    `
    )
    .eq('type', 'event')

  // For pre-populated (no query): show upcoming events
  if (!query || query.trim().length === 0) {
    queryBuilder = queryBuilder
      .gte('event_date', today)
      .order('event_date', { ascending: true })
  } else {
    // For search: show all events matching query
    queryBuilder = queryBuilder
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,event_location.ilike.%${query}%`
      )
      .order('event_date', { ascending: false })
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((event) => ({
      id: event.id,
      type: 'arrangementer' as const,
      title: event.title,
      content: event.content,
      event_date: event.event_date,
      event_time: event.event_time,
      event_location: event.event_location,
      image_url: event.image_url,
      created_at: event.created_at,
      category: Array.isArray(event.category)
        ? event.category[0]
        : event.category,
    })) || []
  )
}

// ============================================
// 4. COMMENTS (Kommentarer)
// ============================================

export async function searchComments(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<CommentSearchResult[]> {
  let queryBuilder = supabase
    .from('comments')
    .select(
      `
      id,
      content,
      created_at,
      user:profiles!comments_user_id_fkey(full_name, avatar_url),
      post:posts!comments_post_id_fkey(id, title)
    `
    )
    .order('created_at', { ascending: false })

  // If query is provided, search in content
  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.ilike('content', `%${query}%`)
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((comment) => ({
      id: comment.id,
      type: 'kommentarer' as const,
      content: comment.content,
      created_at: comment.created_at,
      user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
      post: Array.isArray(comment.post) ? comment.post[0] : comment.post,
    })) || []
  )
}

// ============================================
// 5. GEOGRAPHY (Geografi)
// ============================================

export async function searchGeography(
  query: string,
  limit: number = 6
): Promise<GeographySearchResult[]> {
  const results: GeographySearchResult[] = []

  // Search all three geography types in parallel
  const promises = []

  // Language areas
  let langQuery = supabase
    .from('language_areas')
    .select('id, name, name_sami, code')

  if (query && query.trim().length > 0) {
    langQuery = langQuery.or(`name.ilike.%${query}%,name_sami.ilike.%${query}%`)
  } else {
    langQuery = langQuery.order('sort_order').limit(2)
  }

  promises.push(langQuery)

  // Municipalities
  let munQuery = supabase
    .from('municipalities')
    .select(
      `
      id,
      name,
      name_sami,
      slug,
      country:countries(name, code),
      language_area:language_areas(name, code)
    `
    )

  if (query && query.trim().length > 0) {
    munQuery = munQuery.or(`name.ilike.%${query}%,name_sami.ilike.%${query}%`)
  } else {
    munQuery = munQuery.order('name').limit(4)
  }

  promises.push(munQuery)

  // Places
  let placeQuery = supabase
    .from('places')
    .select(
      `
      id,
      name,
      name_sami,
      slug,
      municipality:municipalities(name, slug, country:countries(code))
    `
    )

  if (query && query.trim().length > 0) {
    placeQuery = placeQuery.or(`name.ilike.%${query}%,name_sami.ilike.%${query}%`)
  } else {
    placeQuery = placeQuery.order('name').limit(4)
  }

  promises.push(placeQuery)

  const [langData, munData, placeData] = await Promise.all(promises)

  // Process language areas
  if (langData.data) {
    langData.data.forEach((item: any) => {
      results.push({
        id: item.id,
        type: 'geografi' as const,
        name: item.name,
        name_sami: item.name_sami,
        location_type: 'language_area',
        created_at: undefined,
      })
    })
  }

  // Process municipalities
  if (munData.data) {
    munData.data.forEach((item: any) => {
      const country = Array.isArray(item.country) ? item.country[0] : item.country
      results.push({
        id: item.id,
        type: 'geografi' as const,
        name: item.name,
        name_sami: item.name_sami,
        slug: item.slug,
        location_type: 'municipality',
        parent: country?.name,
        country_code: country?.code,
        created_at: undefined,
      })
    })
  }

  // Process places
  if (placeData.data) {
    placeData.data.forEach((item: any) => {
      const municipality = Array.isArray(item.municipality)
        ? item.municipality[0]
        : item.municipality
      results.push({
        id: item.id,
        type: 'geografi' as const,
        name: item.name,
        name_sami: item.name_sami,
        slug: item.slug,
        location_type: 'place',
        parent: municipality?.name,
        created_at: undefined,
      })
    })
  }

  // Sort by relevance if query exists
  if (query && query.trim().length > 0) {
    const searchLower = query.toLowerCase()
    results.sort((a, b) => {
      const aExact =
        a.name.toLowerCase() === searchLower ||
        a.name_sami?.toLowerCase() === searchLower
      const bExact =
        b.name.toLowerCase() === searchLower ||
        b.name_sami?.toLowerCase() === searchLower
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.name.localeCompare(b.name, 'nb')
    })
  }

  return results.slice(0, limit)
}

// ============================================
// 6. COMMUNITIES (Samfunn)
// ============================================

export async function searchCommunities(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<CommunitySearchResult[]> {
  let queryBuilder = supabase
    .from('communities')
    .select('id, name, slug, logo_url, category, follower_count, is_verified, created_at')
    .eq('is_active', true)

  // Sort by follower count for pre-populated, or relevance for search
  if (!query || query.trim().length === 0) {
    queryBuilder = queryBuilder.order('follower_count', { ascending: false })
  } else {
    queryBuilder = queryBuilder
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('follower_count', { ascending: false })
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((community) => ({
      id: community.id,
      type: 'samfunn' as const,
      name: community.name,
      slug: community.slug,
      logo_url: community.logo_url,
      category: community.category,
      follower_count: community.follower_count,
      is_verified: community.is_verified,
      created_at: community.created_at,
    })) || []
  )
}

// ============================================
// 7. SERVICES (Tjenester)
// ============================================

export async function searchServices(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<ServiceSearchResult[]> {
  let queryBuilder = supabase
    .from('services')
    .select(
      `
      id,
      name,
      slug,
      description,
      category,
      images,
      is_online,
      created_at,
      is_featured,
      community:communities(id, name, slug, logo_url)
    `
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  // If query is provided, search in name, description, and search_tags
  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,search_tags.cs.{${query}}`
    )
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((service) => ({
      id: service.id,
      type: 'tjenester' as const,
      name: service.name,
      slug: service.slug,
      description: service.description,
      category: service.category,
      images: service.images as string[],
      is_online: service.is_online,
      created_at: service.created_at,
      community: Array.isArray(service.community)
        ? service.community[0]
        : service.community,
    })) || []
  )
}

// ============================================
// 8. PRODUCTS (Produkter)
// ============================================

export async function searchProducts(
  query: string,
  limit: number = 6,
  offset: number = 0
): Promise<ProductSearchResult[]> {
  let queryBuilder = supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      category,
      primary_image,
      price,
      currency,
      in_stock,
      created_at,
      is_featured,
      community:communities(id, name, slug, logo_url)
    `
    )
    .eq('is_active', true)

  // For pre-populated: only show in-stock products
  if (!query || query.trim().length === 0) {
    queryBuilder = queryBuilder.eq('in_stock', true)
  }

  queryBuilder = queryBuilder
    .order('is_featured', { ascending: false })
    .order('in_stock', { ascending: false })
    .order('created_at', { ascending: false })

  // If query is provided, search in name, description, and search_tags
  if (query && query.trim().length > 0) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,search_tags.cs.{${query}}`
    )
  }

  const { data, error } = await queryBuilder.range(offset, offset + limit - 1)

  if (error) throw error

  return (
    data?.map((product) => ({
      id: product.id,
      type: 'produkter' as const,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      primary_image: product.primary_image,
      price: product.price,
      currency: product.currency,
      in_stock: product.in_stock,
      created_at: product.created_at,
      community: Array.isArray(product.community)
        ? product.community[0]
        : product.community,
    })) || []
  )
}

// ============================================
// SEARCH ALL CATEGORIES
// ============================================

export async function searchAll(query: string, limit: number = 6) {
  // Run all searches in parallel
  const [
    users,
    posts,
    events,
    comments,
    geography,
    communities,
    services,
    products,
  ] = await Promise.allSettled([
    searchUsers(query, limit),
    searchPosts(query, limit),
    searchEvents(query, limit),
    searchComments(query, limit),
    searchGeography(query, limit),
    searchCommunities(query, limit),
    searchServices(query, limit),
    searchProducts(query, limit),
  ])

  return {
    brukere: users.status === 'fulfilled' ? users.value : [],
    innlegg: posts.status === 'fulfilled' ? posts.value : [],
    arrangementer: events.status === 'fulfilled' ? events.value : [],
    kommentarer: comments.status === 'fulfilled' ? comments.value : [],
    geografi: geography.status === 'fulfilled' ? geography.value : [],
    samfunn: communities.status === 'fulfilled' ? communities.value : [],
    tjenester: services.status === 'fulfilled' ? services.value : [],
    produkter: products.status === 'fulfilled' ? products.value : [],
  }
}
