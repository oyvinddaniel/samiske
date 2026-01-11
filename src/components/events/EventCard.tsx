'use client'

import { Calendar, MapPin, Clock, Users, ExternalLink, Ticket } from 'lucide-react'
import {
  formatCommunityEventDate,
  isCommunityEventHappeningNow,
  isCommunityEventUpcoming,
  isCommunityEventPast,
  type CommunityEvent
} from '@/lib/communityEvents'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface EventCardProps {
  event: CommunityEvent
  onRegister?: () => void
  isRegistered?: boolean
  availableSpots?: number | null
}

export function EventCard({ event, onRegister, isRegistered, availableSpots }: EventCardProps) {
  const isHappeningNow = isCommunityEventHappeningNow(event)
  const isUpcoming = isCommunityEventUpcoming(event)
  const isPast = isCommunityEventPast(event)

  const formattedDate = formatCommunityEventDate(event.starts_at, event.ends_at, event.is_all_day)

  return (
    <div className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
      isPast ? 'opacity-60' : ''
    }`}>
      {/* Event image */}
      {event.image_url && (
        <div className="relative aspect-video">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
          {isHappeningNow && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Pågår nå
            </div>
          )}
          {isUpcoming && !isHappeningNow && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Kommer snart
            </div>
          )}
          {isPast && (
            <div className="absolute top-3 right-3 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Avsluttet
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg">{event.title}</h3>

        {/* Date and time */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{formattedDate}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Price */}
        {event.price !== null && event.price > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Ticket className="w-4 h-4" />
            <span>
              {event.price} {event.currency}
            </span>
          </div>
        )}

        {event.price === 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <Ticket className="w-4 h-4" />
            <span>Gratis</span>
          </div>
        )}

        {/* Capacity info */}
        {event.attendee_limit && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>
              {availableSpots !== null && availableSpots !== undefined ? (
                availableSpots > 0 ? (
                  `${availableSpots} ${availableSpots === 1 ? 'plass' : 'plasser'} ledig`
                ) : (
                  <span className="text-red-600 font-medium">Fullt</span>
                )
              ) : (
                `Maks ${event.attendee_limit} deltakere`
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {/* Registration button */}
          {event.registration_required && !isPast && onRegister && (
            <Button
              onClick={onRegister}
              variant={isRegistered ? 'outline' : 'default'}
              disabled={availableSpots === 0}
              className="flex-1"
            >
              {isRegistered ? 'Påmeldt' : 'Meld meg på'}
            </Button>
          )}

          {/* External registration link */}
          {event.registration_url && !isPast && (
            <Button
              asChild
              variant="outline"
              className="flex-1"
            >
              <Link href={event.registration_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Påmelding
              </Link>
            </Button>
          )}

          {/* External event link */}
          {event.external_url && (
            <Button
              asChild
              variant="outline"
              className={event.registration_required || event.registration_url ? '' : 'flex-1'}
            >
              <Link href={event.external_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Les mer
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
