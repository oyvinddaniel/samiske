import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageCompression'

/**
 * Uploads an image to Supabase storage with compression
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 * @returns The public URL of the uploaded image, or null if failed
 */
export async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    // Compress the image first
    const compressedFile = await compressImage(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1600,
      quality: 0.8,
    })

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${path}_${Date.now()}.${ext}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, compressedFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Image upload failed:', error)
    return null
  }
}

/**
 * Uploads a profile image with optimized settings
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    const compressedFile = await compressImage(file, {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 400,
      quality: 0.8,
    })

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/avatar_${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, compressedFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Profile image upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Profile image upload failed:', error)
    return null
  }
}

/**
 * Uploads a post image with optimized settings
 */
export async function uploadPostImage(
  file: File,
  postId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    const compressedFile = await compressImage(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 1200,
      quality: 0.75,
    })

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${postId}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('posts')
      .upload(filename, compressedFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Post image upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Post image upload failed:', error)
    return null
  }
}

/**
 * Deletes an image from Supabase storage
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Image deletion failed:', error)
    return false
  }
}
