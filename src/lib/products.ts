// Product (Produkt) helper functions

import { createClient } from '@/lib/supabase/client'
import type { Product, ProductWithCommunity } from '@/lib/types/products'

/**
 * Get all active products
 */
export async function getProducts(): Promise<ProductWithCommunity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 12): Promise<ProductWithCommunity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
}

/**
 * Get products for a specific community
 */
export async function getProductsByCommunity(communityId: string): Promise<Product[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching community products:', error)
    return []
  }

  return data || []
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<ProductWithCommunity | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

/**
 * Get product by slug
 */
export async function getProductBySlug(
  communitySlug: string,
  productSlug: string
): Promise<ProductWithCommunity | null> {
  const supabase = createClient()

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', communitySlug)
    .single()

  if (communityError || !community) {
    console.error('Error fetching community:', communityError)
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('community_id', community.id)
    .eq('slug', productSlug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

/**
 * Create product
 */
export async function createProduct(
  communityId: string,
  userId: string,
  product: {
    name: string
    description?: string
    size?: string
    images?: string[]
    primary_image?: string
    price?: number
    currency?: string
    price_type?: 'fixed' | 'from' | 'contact'
    in_stock?: boolean
    stock_quantity?: number
    purchase_url?: string
    contact_email?: string
    contact_phone?: string
    search_tags?: string[]
  }
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const supabase = createClient()

  // Generate slug from name
  const slug = product.name
    .toLowerCase()
    .replace(/[æÆ]/g, 'ae')
    .replace(/[øØ]/g, 'o')
    .replace(/[åÅ]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('products')
    .insert({
      community_id: communityId,
      created_by: userId,
      slug,
      name: product.name,
      description: product.description || null,
      size: product.size || null,
      images: product.images || [],
      primary_image: product.primary_image || null,
      price: product.price || null,
      currency: product.currency || 'NOK',
      price_type: product.price_type || 'fixed',
      in_stock: product.in_stock !== undefined ? product.in_stock : true,
      stock_quantity: product.stock_quantity || null,
      purchase_url: product.purchase_url || null,
      contact_email: product.contact_email || null,
      contact_phone: product.contact_phone || null,
      search_tags: product.search_tags || [],
      is_active: true,
      is_featured: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return { success: false, error: error.message }
  }

  return { success: true, product: data }
}

/**
 * Update product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<{
    name: string
    description: string | null
    size: string | null
    images: string[]
    primary_image: string | null
    price: number | null
    currency: string
    price_type: 'fixed' | 'from' | 'contact'
    in_stock: boolean
    stock_quantity: number | null
    purchase_url: string | null
    contact_email: string | null
    contact_phone: string | null
    search_tags: string[]
    is_active: boolean
    is_featured: boolean
  }>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const supabase = createClient()

  // If name is being updated, regenerate slug
  if (updates.name) {
    const slug = updates.name
      .toLowerCase()
      .replace(/[æÆ]/g, 'ae')
      .replace(/[øØ]/g, 'o')
      .replace(/[åÅ]/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, slug })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return { success: false, error: error.message }
    }

    return { success: true, product: data }
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return { success: false, error: error.message }
  }

  return { success: true, product: data }
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Toggle product featured status
 */
export async function toggleProductFeatured(
  productId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_featured: featured })
    .eq('id', productId)

  if (error) {
    console.error('Error toggling product featured:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
