'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'

interface PromoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  item: Product | Service
  itemType: 'product' | 'service'
  onPromoted?: () => void
}

export function PromoteModal({
  open,
  onOpenChange,
  communityId,
  item,
  itemType,
  onPromoted
}: PromoteModalProps) {
  const [loading, setLoading] = useState(false)
  const [additionalText, setAdditionalText] = useState('')

  const supabase = createClient()

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være logget inn')
        return
      }

      // Create post with product or service reference
      const postData: any = {
        author_id: user.id,
        community_id: communityId,
        content: additionalText.trim() || null,
      }

      if (itemType === 'product') {
        postData.product_id = item.id
      } else {
        postData.service_id = item.id
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData)

      if (error) {
        console.error('Error creating post:', error)
        toast.error('Kunne ikke opprette innlegg')
        return
      }

      toast.success(`${itemType === 'product' ? 'Produkt' : 'Tjeneste'} promotert`)
      setAdditionalText('')
      onOpenChange(false)
      onPromoted?.()
    } catch (error) {
      console.error('Error promoting item:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const itemName = 'name' in item ? item.name : ''
  const itemPrice = item.price
  const itemCurrency = item.currency || 'NOK'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handlePromote}>
          <DialogHeader>
            <DialogTitle>
              Promover {itemType === 'product' ? 'produkt' : 'tjeneste'}
            </DialogTitle>
            <DialogDescription>
              Opprett et innlegg som promoterer dette på sidens feed
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Item preview */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex gap-3">
                {/* Image */}
                {((itemType === 'product' && 'primary_image' in item && item.primary_image) ||
                  (itemType === 'service' && 'images' in item && Array.isArray(item.images) && item.images[0])) && (
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={
                        itemType === 'product' && 'primary_image' in item
                          ? item.primary_image || ''
                          : itemType === 'service' && 'images' in item && Array.isArray(item.images)
                          ? item.images[0]
                          : ''
                      }
                      alt={itemName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{itemName}</p>
                  {itemPrice && (
                    <p className="text-sm text-gray-600 mt-1">
                      {itemPrice.toLocaleString('nb-NO')} {itemCurrency}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional text */}
            <div className="space-y-2">
              <Label htmlFor="additional-text">
                Tilleggstekst (valgfritt)
              </Label>
              <Textarea
                id="additional-text"
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                placeholder="Skriv noe om dette produktet/tjenesten..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {additionalText.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publiserer...
                </>
              ) : (
                'Publiser innlegg'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
