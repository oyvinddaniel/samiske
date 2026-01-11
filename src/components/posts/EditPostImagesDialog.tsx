'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Trash2, GripVertical, Upload } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PostImage {
  id: string
  url: string
  thumbnail_url?: string | null
  sort_order: number
}

interface EditPostImagesDialogProps {
  postId: string
  images: PostImage[]
  open: boolean
  onClose: () => void
  onImagesUpdated: () => void
}

function SortableImage({ image, onDelete }: { image: PostImage; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>

      <img
        src={image.thumbnail_url || image.url}
        alt=""
        className="w-16 h-16 object-cover rounded"
      />

      <div className="flex-1 text-sm text-gray-600">
        Bilde {image.sort_order + 1}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(image.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function EditPostImagesDialog({
  postId,
  images: initialImages,
  open,
  onClose,
  onImagesUpdated
}: EditPostImagesDialogProps) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        sort_order: idx
      }))

      setImages(newImages)

      // Save to database
      const imageOrder = newImages.map(img => img.id)
      const { error } = await supabase.rpc('reorder_post_images', {
        p_post_id: postId,
        p_image_order: imageOrder
      })

      if (error) {
        toast.error('Kunne ikke oppdatere rekkefølge')
      } else {
        toast.success('Rekkefølge oppdatert')
        onImagesUpdated()
      }
    }
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('Slett dette bildet?')) return

    const { error } = await supabase.rpc('delete_post_image', {
      p_image_id: imageId
    })

    if (error) {
      toast.error('Kunne ikke slette bilde')
    } else {
      setImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('Bilde slettet')
      onImagesUpdated()
    }
  }

  const handleAddImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // TODO: Implement image upload using MediaService
      // Similar to CreatePostSheet.tsx upload logic
      toast.info('Bildeopplasting kommer snart')
    } catch (error) {
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger bilder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Dra og slipp for å endre rekkefølge
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map(img => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {images.map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {images.length < 50 && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAddImage}
                className="hidden"
                id="add-image"
                disabled={uploading}
              />
              <label htmlFor="add-image">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Legg til bilde ({images.length}/50)
                  </span>
                </Button>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
