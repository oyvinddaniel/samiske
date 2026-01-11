'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MediaService } from '@/lib/media'
import { Plus, X, MoveUp, MoveDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface FeaturedImage {
  id: string
  media_id: string
  caption: string | null
  sort_order: number
  media: {
    storage_path: string
    width: number
    height: number
  }
}

interface ProfileFeaturedImagesProps {
  userId: string
  isEditable?: boolean
}

export function ProfileFeaturedImages({
  userId,
  isEditable = false,
}: ProfileFeaturedImagesProps) {
  const [images, setImages] = useState<FeaturedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchImages()
  }, [userId])

  const fetchImages = async () => {
    const { data } = await supabase
      .from('user_featured_images')
      .select(`
        id,
        media_id,
        caption,
        sort_order,
        media:media!inner(storage_path, width, height)
      `)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .limit(6)

    if (data) {
      setImages(data as unknown as FeaturedImage[])
    }
    setLoading(false)
  }

  const handleUpload = async (file: File) => {
    if (images.length >= 6) {
      toast.error('Du kan maks ha 6 bilder i galleriet')
      return
    }

    setUploading(true)

    // Upload via MediaService
    const result = await MediaService.upload(file, {
      entityType: 'profile_featured',
      entityId: userId,
    })

    if (!result.success || !result.media) {
      toast.error('Opplasting feilet')
      setUploading(false)
      return
    }

    // Add to featured images
    const { error } = await supabase
      .from('user_featured_images')
      .insert({
        user_id: userId,
        media_id: result.media.id,
        sort_order: images.length,
      })

    if (error) {
      console.error('Error adding featured image:', error)
      toast.error('Kunne ikke legge til bilde')
      setUploading(false)
      return
    }

    toast.success('Bilde lagt til!')
    setUploading(false)
    fetchImages()
  }

  const handleRemove = async (imageId: string) => {
    if (!window.confirm('Er du sikker på at du vil fjerne dette bildet fra galleriet?')) {
      return
    }

    const { error } = await supabase
      .from('user_featured_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      console.error('Error removing featured image:', error)
      toast.error('Kunne ikke fjerne bilde')
      return
    }

    toast.success('Bilde fjernet')
    fetchImages()
  }

  const handleReorder = async (imageId: string, direction: 'up' | 'down') => {
    const current = images.find((img) => img.id === imageId)
    if (!current) return

    const currentIndex = current.sort_order
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    const target = images.find((img) => img.sort_order === targetIndex)
    if (!target) return

    // Swap sort_order values
    await supabase
      .from('user_featured_images')
      .update({ sort_order: targetIndex })
      .eq('id', current.id)

    await supabase
      .from('user_featured_images')
      .update({ sort_order: currentIndex })
      .eq('id', target.id)

    fetchImages()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Profilgalleri</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div key={img.id} className="relative group aspect-square">
            <Image
              src={MediaService.getUrl(img.media.storage_path, 'medium')}
              alt={img.caption || ''}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 50vw, 33vw"
            />

            {isEditable && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleReorder(img.id, 'up')}
                  disabled={index === 0}
                >
                  <MoveUp className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleRemove(img.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleReorder(img.id, 'down')}
                  disabled={index === images.length - 1}
                >
                  <MoveDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add button (if editable and less than 6 images) */}
        {isEditable && images.length < 6 && (
          <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto text-gray-400" />
                <span className="text-sm text-gray-500 mt-2 block">Legg til bilde</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
          </label>
        )}
      </div>

      {images.length === 0 && !isEditable && (
        <p className="text-center text-gray-500 py-8">Ingen bilder i galleriet</p>
      )}
    </div>
  )
}
