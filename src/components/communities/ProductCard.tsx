'use client'

import { useState } from 'react'
import { Package, ExternalLink, Mail, ShoppingCart, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Product } from '@/lib/types/products'
import { priceTypeLabels } from '@/lib/types/products'
import { PromoteModal } from './PromoteModal'

interface ProductCardProps {
  product: Product
  communitySlug?: string
  isAdmin?: boolean
  communityId?: string
  onPromoted?: () => void
}

export function ProductCard({
  product,
  communitySlug,
  isAdmin = false,
  communityId,
  onPromoted
}: ProductCardProps) {
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const primaryImage = product.primary_image || (product.images && product.images[0])

  const formatPrice = (price: number | null, currency: string, priceType: string) => {
    if (!price) return null

    const formattedPrice = new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: currency || 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)

    if (priceType === 'from') {
      return `Fra ${formattedPrice}`
    }

    return formattedPrice
  }

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Stock badge */}
        {!product.in_stock && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">Utsolgt</Badge>
          </div>
        )}

        {product.is_featured && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-blue-600">Fremhevet</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{product.name}</h3>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {product.size && (
            <Badge variant="secondary" className="text-xs">
              {product.size}
            </Badge>
          )}

          {product.stock_quantity !== null && product.stock_quantity > 0 && (
            <span className="text-gray-500 text-xs">
              {product.stock_quantity} på lager
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          {product.price ? (
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency, product.price_type)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">{priceTypeLabels[product.price_type]}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {product.purchase_url && (
            <Button asChild className="flex-1" size="sm">
              <a href={product.purchase_url} target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Kjøp
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}

          {product.contact_email && !product.purchase_url && (
            <Button asChild variant="outline" className="flex-1" size="sm">
              <a href={`mailto:${product.contact_email}`}>
                <Mail className="w-4 h-4 mr-1" />
                Kontakt
              </a>
            </Button>
          )}

          {communitySlug && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/samfunn/${communitySlug}/produkter/${product.slug}`}>
                Detaljer
              </Link>
            </Button>
          )}
        </div>

        {/* Promote button (admin only) */}
        {isAdmin && communityId && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowPromoteModal(true)}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Promover som innlegg
            </Button>
          </div>
        )}
      </div>

      {/* Promote modal */}
      {isAdmin && communityId && (
        <PromoteModal
          open={showPromoteModal}
          onOpenChange={setShowPromoteModal}
          communityId={communityId}
          item={product}
          itemType="product"
          onPromoted={onPromoted}
        />
      )}
    </div>
  )
}
