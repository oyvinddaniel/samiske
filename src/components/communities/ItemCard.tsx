'use client'

import { useState } from 'react'
import {
  Package,
  Briefcase,
  ExternalLink,
  Mail,
  Phone,
  ShoppingCart,
  Calendar,
  Globe,
  Megaphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PromoteModal } from './PromoteModal'
import { formatPrice } from '@/lib/utils/format'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'
import { priceTypeLabels } from '@/lib/types/products'
import { servicePriceTypeLabels } from '@/lib/types/services'

type ItemType = 'product' | 'service'

interface ItemCardProps {
  /** The item to display - either a Product or Service */
  item: Product | Service
  /** The type of item */
  type: ItemType
  /** Community slug for detail links */
  communitySlug?: string
  /** Whether the current user is an admin */
  isAdmin?: boolean
  /** Community ID for promote functionality */
  communityId?: string
  /** Callback when item is promoted */
  onPromoted?: () => void
  /** Layout variant */
  variant?: 'default' | 'compact' | 'horizontal'
}

/**
 * Generic card component for displaying products and services
 * Replaces the separate ProductCard and ServiceCard components
 */
export function ItemCard({
  item,
  type,
  communitySlug,
  isAdmin = false,
  communityId,
  onPromoted,
  variant = 'default'
}: ItemCardProps) {
  const [showPromoteModal, setShowPromoteModal] = useState(false)

  const isProduct = type === 'product'
  const product = isProduct ? (item as Product) : null
  const service = !isProduct ? (item as Service) : null

  // Get primary image
  const primaryImage = isProduct
    ? (product?.primary_image || (product?.images && product.images[0]))
    : (service?.images && service.images[0])

  // Get price display
  const getPriceDisplay = () => {
    const price = item.price
    const currency = item.currency
    const priceType = item.price_type

    if (!price) {
      const label = isProduct
        ? priceTypeLabels[priceType as keyof typeof priceTypeLabels]
        : servicePriceTypeLabels[priceType as keyof typeof servicePriceTypeLabels]
      return <span className="text-sm text-gray-500">{label}</span>
    }

    return (
      <span className="text-xl font-bold text-gray-900">
        {formatPrice(price, currency, priceType)}
      </span>
    )
  }

  // Get CTA (call to action) based on type
  const getCta = () => {
    if (isProduct && product?.purchase_url) {
      return {
        href: product.purchase_url,
        icon: <ShoppingCart className="w-4 h-4 mr-1" />,
        label: 'Kjøp',
        external: true
      }
    }

    if (!isProduct && service?.booking_url) {
      return {
        href: service.booking_url,
        icon: <Calendar className="w-4 h-4 mr-1" />,
        label: 'Book',
        external: true
      }
    }

    // Fallback to contact
    const email = isProduct ? product?.contact_email : service?.contact_email
    if (email) {
      return {
        href: `mailto:${email}`,
        icon: <Mail className="w-4 h-4 mr-1" />,
        label: 'Kontakt',
        external: false,
        variant: 'outline' as const
      }
    }

    return null
  }

  const cta = getCta()
  const detailPath = isProduct
    ? `/samfunn/${communitySlug}/produkter/${item.slug}`
    : `/samfunn/${communitySlug}/tjenester/${item.slug}`

  const DefaultIcon = isProduct ? Package : Briefcase

  // Compact variant - smaller, no image
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg border p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
            {primaryImage ? (
              <img src={primaryImage} alt="" className="w-full h-full object-cover rounded" />
            ) : (
              <DefaultIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.name}</h4>
            {getPriceDisplay()}
          </div>
        </div>
      </div>
    )
  }

  // Horizontal variant - side by side layout
  if (variant === 'horizontal') {
    return (
      <div className="bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden flex">
        {/* Image */}
        <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
          {primaryImage ? (
            <img src={primaryImage} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DefaultIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold line-clamp-1">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            {getPriceDisplay()}
            {cta && (
              <Button asChild size="sm" variant={cta.variant || 'default'}>
                <a
                  href={cta.href}
                  target={cta.external ? '_blank' : undefined}
                  rel={cta.external ? 'noopener noreferrer' : undefined}
                >
                  {cta.icon}
                  {cta.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant - vertical card
  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className={`bg-gray-100 relative overflow-hidden ${isProduct ? 'aspect-square' : 'aspect-video'}`}>
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DefaultIcon className="w-16 h-16 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_featured && (
            <Badge className="bg-blue-600">Fremhevet</Badge>
          )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {/* Product-specific: out of stock */}
          {isProduct && product && !product.in_stock && (
            <Badge variant="destructive">Utsolgt</Badge>
          )}

          {/* Service-specific: online badge */}
          {!isProduct && service?.is_online && (
            <Badge variant="secondary" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              Online
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{item.name}</h3>

          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Product-specific details */}
        {isProduct && product && (
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
        )}

        {/* Service-specific contact info */}
        {!isProduct && service && (
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {service.contact_email && (
              <a
                href={`mailto:${service.contact_email}`}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs truncate max-w-[150px]">{service.contact_email}</span>
              </a>
            )}

            {service.contact_phone && (
              <a
                href={`tel:${service.contact_phone}`}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">{service.contact_phone}</span>
              </a>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline justify-between">
          {getPriceDisplay()}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {cta && (
            <Button asChild className="flex-1" size="sm" variant={cta.variant || 'default'}>
              <a
                href={cta.href}
                target={cta.external ? '_blank' : undefined}
                rel={cta.external ? 'noopener noreferrer' : undefined}
              >
                {cta.icon}
                {cta.label}
                {cta.external && <ExternalLink className="w-3 h-3 ml-1" />}
              </a>
            </Button>
          )}

          {communitySlug && (
            <Button asChild variant="ghost" size="sm">
              <Link href={detailPath}>
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
          item={item}
          itemType={type}
          onPromoted={onPromoted}
        />
      )}
    </div>
  )
}
