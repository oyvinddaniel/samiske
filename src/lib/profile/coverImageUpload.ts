import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageCompression'
import { toast } from 'sonner'

export interface CoverImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload cover image for user profile
 * - Compresses to max 2MB, 1200px width
 * - Deletes old cover image before uploading new one
 * - Stores in profile-covers bucket
 */
export async function uploadCoverImage(
  file: File,
  userId: string
): Promise<CoverImageUploadResult> {
  const supabase = createClient()

  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Filen må være et bilde' }
    }

    // Validate file size (max 10MB uncompressed)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'Bildet må være mindre enn 10MB' }
    }

    // Compress image to max 2MB, 1200px width
    const compressedFile = await compressImage(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1200,
      quality: 0.9,
    })

    // Generate filename
    const fileExt = compressedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/cover-${Date.now()}.${fileExt}`

    // Get current cover URL to delete later
    const { data: profile } = await supabase
      .from('profiles')
      .select('cover_image_url')
      .eq('id', userId)
      .single()

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-covers')
      .upload(fileName, compressedFile, {
        contentType: compressedFile.type,
        upsert: true,
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: 'Opplasting feilet' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-covers')
      .getPublicUrl(fileName)

    // Update profile with new cover URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cover_image_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to delete the uploaded file since profile update failed
      await supabase.storage.from('profile-covers').remove([fileName])
      return { success: false, error: 'Kunne ikke oppdatere profil' }
    }

    // Delete old cover image after successful update
    if (profile?.cover_image_url) {
      try {
        const oldPath = extractPathFromUrl(profile.cover_image_url, 'profile-covers')
        if (oldPath) {
          await supabase.storage.from('profile-covers').remove([oldPath])
        }
      } catch (error) {
        // Ignore errors when deleting old cover
        console.warn('Could not delete old cover:', error)
      }
    }

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Cover upload error:', error)
    return { success: false, error: 'En uventet feil oppstod' }
  }
}

/**
 * Delete cover image for user profile
 */
export async function deleteCoverImage(userId: string): Promise<CoverImageUploadResult> {
  const supabase = createClient()

  try {
    // Get current cover URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('cover_image_url')
      .eq('id', userId)
      .single()

    if (!profile?.cover_image_url) {
      return { success: true } // Already no cover
    }

    // Remove from profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ cover_image_url: null })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { success: false, error: 'Kunne ikke oppdatere profil' }
    }

    // Delete from storage
    const oldPath = extractPathFromUrl(profile.cover_image_url, 'profile-covers')
    if (oldPath) {
      await supabase.storage.from('profile-covers').remove([oldPath])
    }

    return { success: true }
  } catch (error) {
    console.error('Cover delete error:', error)
    return { success: false, error: 'Kunne ikke slette cover-bilde' }
  }
}

/**
 * Extract storage path from public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/profile-covers/user-id/cover-123.jpg
 * Returns: user-id/cover-123.jpg
 */
function extractPathFromUrl(url: string, bucketName: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.indexOf(bucketName)
    if (bucketIndex === -1) return null

    // Everything after bucket name is the file path
    const filePath = pathParts.slice(bucketIndex + 1).join('/')
    return filePath || null
  } catch {
    return null
  }
}
