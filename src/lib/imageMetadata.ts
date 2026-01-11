/**
 * Image Metadata API
 * Functions for updating image metadata (caption, title, alt_text)
 */

import { createClient } from '@/lib/supabase/client'

export interface ImageMetadata {
  title?: string | null
  caption?: string | null
  alt_text?: string | null
}

/**
 * Update metadata for a post_image
 */
export async function updatePostImageMetadata(
  imageId: string,
  metadata: ImageMetadata
): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to update image metadata')
  }

  // Check if user owns the post this image belongs to
  const { data: imageData } = await supabase
    .from('post_images')
    .select('post_id, posts!inner(user_id)')
    .eq('id', imageId)
    .single()

  if (!imageData) {
    throw new Error('Image not found')
  }

  const post = Array.isArray(imageData.posts) ? imageData.posts[0] : imageData.posts
  if (post.user_id !== user.id) {
    throw new Error('Not authorized to update this image')
  }

  // Update metadata
  const { error } = await supabase
    .from('post_images')
    .update({
      title: metadata.title?.trim() || null,
      caption: metadata.caption?.trim() || null,
      alt_text: metadata.alt_text?.trim() || null
    })
    .eq('id', imageId)

  if (error) {
    console.error('Error updating image metadata:', error)
    throw error
  }

  return true
}

/**
 * Get metadata for a post_image
 */
export async function getPostImageMetadata(imageId: string): Promise<ImageMetadata | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('post_images')
    .select('title, caption, alt_text')
    .eq('id', imageId)
    .single()

  if (error) {
    console.error('Error fetching image metadata:', error)
    return null
  }

  return data as ImageMetadata
}
