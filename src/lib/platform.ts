// Platform admin helper functions

import { createClient } from '@/lib/supabase/client'
import type { PlatformAdmin, PlatformAdminWithUser } from '@/lib/types/platform'

/**
 * Check if user is a platform admin
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error checking platform admin:', error)
    return false
  }

  return !!data
}

/**
 * Check if user is platform owner
 */
export async function isPlatformOwner(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error checking platform owner:', error)
    return false
  }

  return !!data
}

/**
 * Get platform admin record for user
 */
export async function getPlatformAdminByUserId(userId: string): Promise<PlatformAdmin | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching platform admin:', error)
    return null
  }

  return data
}

/**
 * Get all platform admins
 */
export async function getPlatformAdmins(): Promise<PlatformAdminWithUser[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_admins')
    .select(`
      *,
      user:profiles(
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching platform admins:', error)
    return []
  }

  return data || []
}

/**
 * Add platform admin (owner only)
 */
export async function addPlatformAdmin(
  userId: string,
  createdBy: string
): Promise<{ success: boolean; admin?: PlatformAdmin; error?: string }> {
  const supabase = createClient()

  // Check if creator is owner
  const isOwner = await isPlatformOwner(createdBy)
  if (!isOwner) {
    return { success: false, error: 'Only platform owner can add admins' }
  }

  // Check if user is already an admin
  const existingAdmin = await getPlatformAdminByUserId(userId)
  if (existingAdmin) {
    return { success: false, error: 'User is already a platform admin' }
  }

  const { data, error } = await supabase
    .from('platform_admins')
    .insert({
      user_id: userId,
      role: 'admin',
      created_by: createdBy,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding platform admin:', error)
    return { success: false, error: error.message }
  }

  return { success: true, admin: data }
}

/**
 * Remove platform admin (owner only, cannot remove owner)
 */
export async function removePlatformAdmin(
  adminId: string,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Check if remover is owner
  const isOwner = await isPlatformOwner(removedBy)
  if (!isOwner) {
    return { success: false, error: 'Only platform owner can remove admins' }
  }

  // Check if trying to remove owner (should be prevented by trigger, but double-check)
  const { data: adminToRemove } = await supabase
    .from('platform_admins')
    .select('role')
    .eq('id', adminId)
    .single()

  if (adminToRemove?.role === 'owner') {
    return { success: false, error: 'Cannot remove platform owner' }
  }

  const { error } = await supabase
    .from('platform_admins')
    .delete()
    .eq('id', adminId)

  if (error) {
    console.error('Error removing platform admin:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Deactivate platform admin (soft delete)
 */
export async function deactivatePlatformAdmin(
  adminId: string,
  deactivatedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Check if deactivator is owner
  const isOwner = await isPlatformOwner(deactivatedBy)
  if (!isOwner) {
    return { success: false, error: 'Only platform owner can deactivate admins' }
  }

  // Check if trying to deactivate owner
  const { data: adminToDeactivate } = await supabase
    .from('platform_admins')
    .select('role')
    .eq('id', adminId)
    .single()

  if (adminToDeactivate?.role === 'owner') {
    return { success: false, error: 'Cannot deactivate platform owner' }
  }

  const { error } = await supabase
    .from('platform_admins')
    .update({ is_active: false })
    .eq('id', adminId)

  if (error) {
    console.error('Error deactivating platform admin:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Reactivate platform admin
 */
export async function reactivatePlatformAdmin(
  adminId: string,
  reactivatedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Check if reactivator is owner
  const isOwner = await isPlatformOwner(reactivatedBy)
  if (!isOwner) {
    return { success: false, error: 'Only platform owner can reactivate admins' }
  }

  const { error } = await supabase
    .from('platform_admins')
    .update({ is_active: true })
    .eq('id', adminId)

  if (error) {
    console.error('Error reactivating platform admin:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get platform owner
 */
export async function getPlatformOwner(): Promise<PlatformAdminWithUser | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('platform_admins')
    .select(`
      *,
      user:profiles(
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq('role', 'owner')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching platform owner:', error)
    return null
  }

  return data
}
