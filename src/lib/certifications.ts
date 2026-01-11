/**
 * Certification management functions for service providers
 */

import { createClient } from '@/lib/supabase/client'

export interface Certification {
  id: string
  community_id: string
  name: string
  issuer: string | null
  issued_date: string | null
  expires_date: string | null
  document_url: string | null
  is_verified: boolean
  created_at: string
}

/**
 * Get certifications for a community
 */
export async function getCertifications(communityId: string): Promise<Certification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_certifications')
    .select('*')
    .eq('community_id', communityId)
    .order('issued_date', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching certifications:', error)
    return []
  }

  return data || []
}

/**
 * Create a new certification
 */
export async function createCertification(
  communityId: string,
  cert: {
    name: string
    issuer?: string
    issued_date?: string
    expires_date?: string
    document_url?: string
  }
): Promise<Certification | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_certifications')
    .insert({
      community_id: communityId,
      name: cert.name,
      issuer: cert.issuer || null,
      issued_date: cert.issued_date || null,
      expires_date: cert.expires_date || null,
      document_url: cert.document_url || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating certification:', error)
    return null
  }

  return data
}

/**
 * Update a certification
 */
export async function updateCertification(
  id: string,
  updates: {
    name?: string
    issuer?: string
    issued_date?: string
    expires_date?: string
    document_url?: string
  }
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_certifications')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating certification:', error)
    return false
  }

  return true
}

/**
 * Delete a certification
 */
export async function deleteCertification(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_certifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting certification:', error)
    return false
  }

  return true
}

/**
 * Upload certification document
 */
export async function uploadCertificationDocument(
  communityId: string,
  file: File
): Promise<string | null> {
  const supabase = createClient()

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const filename = `${communityId}/${timestamp}.${extension}`

  const { data, error } = await supabase.storage
    .from('community-certifications')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading certification document:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-certifications')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Check if certification is expired
 */
export function isCertificationExpired(cert: Certification): boolean {
  if (!cert.expires_date) return false
  return new Date(cert.expires_date) < new Date()
}

/**
 * Check if certification is expiring soon (within 30 days)
 */
export function isCertificationExpiringSoon(cert: Certification): boolean {
  if (!cert.expires_date) return false
  const expiryDate = new Date(cert.expires_date)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return expiryDate < thirtyDaysFromNow && expiryDate >= new Date()
}

/**
 * Format date for display
 */
export function formatCertificationDate(dateString: string | null): string {
  if (!dateString) return 'Ikke angitt'

  const date = new Date(dateString)
  return date.toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
