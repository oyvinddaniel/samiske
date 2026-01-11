/**
 * Community Categories lib functions
 */

import { createClient } from '@/lib/supabase/client'
import type { CommunityCategory, CategoryFeatures } from '@/lib/types/communities'

/**
 * Hent alle aktive kategorier
 */
export async function getCategories(): Promise<CommunityCategory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('name_no')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

/**
 * Hent kategori etter ID
 */
export async function getCategoryById(id: string): Promise<CommunityCategory | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

/**
 * Hent kategori etter slug
 */
export async function getCategoryBySlug(slug: string): Promise<CommunityCategory | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

/**
 * Sjekk om en kategori har en spesifikk funksjon
 */
export function categoryHasFeature(
  category: CommunityCategory,
  feature: keyof CategoryFeatures
): boolean {
  return category.features?.[feature] ?? false
}

/**
 * Hent kategori display-navn (med språkstøtte)
 */
export function getCategoryDisplayName(
  category: CommunityCategory,
  language: 'no' | 'se' | 'sma' | 'smj' = 'no'
): string {
  switch (language) {
    case 'se':
      return category.name_se || category.name_no
    case 'sma':
      return category.name_sma || category.name_no
    case 'smj':
      return category.name_smj || category.name_no
    default:
      return category.name_no
  }
}

// ============================================
// Admin functions (krever platform_admin rolle)
// ============================================

/**
 * Opprett ny kategori (kun for platform admins)
 */
export async function createCategory(
  data: {
    slug: string
    name_no: string
    name_se?: string
    name_sma?: string
    name_smj?: string
    icon?: string
    description?: string
    features?: Partial<CategoryFeatures>
    sort_order?: number
  }
): Promise<CommunityCategory | null> {
  const supabase = createClient()

  const defaultFeatures: CategoryFeatures = {
    has_products: true,
    has_services: true,
    has_booking: false,
    has_menu: false,
    has_opening_hours: true,
    has_portfolio: false,
    has_membership: false,
    has_events: true
  }

  const { data: category, error } = await supabase
    .from('community_categories')
    .insert({
      slug: data.slug,
      name_no: data.name_no,
      name_se: data.name_se,
      name_sma: data.name_sma,
      name_smj: data.name_smj,
      icon: data.icon || 'CircleDot',
      description: data.description,
      features: { ...defaultFeatures, ...data.features },
      sort_order: data.sort_order || 50
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return null
  }

  return category
}

/**
 * Oppdater kategori (kun for platform admins)
 */
export async function updateCategory(
  id: string,
  data: Partial<Omit<CommunityCategory, 'id' | 'created_at'>>
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_categories')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating category:', error)
    return false
  }

  return true
}

/**
 * Slett kategori (soft delete - kun for platform admins)
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_categories')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return false
  }

  return true
}
