'use client'

import { useState } from 'react'
import { Briefcase, Mail, Phone, ExternalLink, Globe, Calendar, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Service } from '@/lib/types/services'
import { servicePriceTypeLabels } from '@/lib/types/services'
import { PromoteModal } from './PromoteModal'

interface ServiceCardProps {
  service: Service
  communitySlug?: string
  isAdmin?: boolean
  communityId?: string
  onPromoted?: () => void
}

export function ServiceCard({
  service,
  communitySlug,
  isAdmin = false,
  communityId,
  onPromoted
}: ServiceCardProps) {
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const primaryImage = service.images && service.images[0]

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
    } else if (priceType === 'hourly') {
      return `${formattedPrice}/time`
    }

    return formattedPrice
  }

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow overflow-hidden">
      {/* Image (optional) */}
      {primaryImage && (
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          <img
            src={primaryImage}
            alt={service.name}
            className="w-full h-full object-cover"
          />

          {service.is_featured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-blue-600">Fremhevet</Badge>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg line-clamp-2">{service.name}</h3>
            {service.is_online && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Globe className="w-3 h-3 mr-1" />
                Online
              </Badge>
            )}
          </div>

          {service.description && (
            <p className="text-sm text-gray-600 line-clamp-3">{service.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          {service.price ? (
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(service.price, service.currency, service.price_type)}
            </p>
          ) : (
            <p className="text-sm text-gray-500">{servicePriceTypeLabels[service.price_type]}</p>
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {service.contact_email && (
            <a
              href={`mailto:${service.contact_email}`}
              className="flex items-center gap-1 hover:text-gray-900"
            >
              <Mail className="w-4 h-4" />
              <span className="text-xs">{service.contact_email}</span>
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

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {service.booking_url && (
            <Button asChild className="flex-1" size="sm">
              <a href={service.booking_url} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4 mr-1" />
                Book
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          )}

          {service.contact_email && !service.booking_url && (
            <Button asChild variant="outline" className="flex-1" size="sm">
              <a href={`mailto:${service.contact_email}`}>
                <Mail className="w-4 h-4 mr-1" />
                Kontakt
              </a>
            </Button>
          )}

          {communitySlug && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/samfunn/${communitySlug}/tjenester/${service.slug}`}>
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
          item={service}
          itemType="service"
          onPromoted={onPromoted}
        />
      )}
    </div>
  )
}
