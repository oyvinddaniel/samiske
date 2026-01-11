'use client'

import { useEffect, useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import {
  getCommunityEvents,
  getCommunityEventAvailableSpots,
  isUserRegisteredForCommunityEvent,
  registerForCommunityEvent,
  cancelCommunityEventRegistration,
  type CommunityEvent
} from '@/lib/communityEvents'
import { EventCard } from './EventCard'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'

interface EventsListProps {
  communityId: string
  limit?: number
  showPastEvents?: boolean
}

export function EventsList({ communityId, limit, showPastEvents = false }: EventsListProps) {
  const { user } = useUser()
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Map<string, boolean>>(new Map())
  const [availableSpots, setAvailableSpots] = useState<Map<string, number | null>>(new Map())

  useEffect(() => {
    fetchEvents()
  }, [communityId, showPastEvents])

  const fetchEvents = async () => {
    setLoading(true)

    const options: Parameters<typeof getCommunityEvents>[1] = {
      limit
    }

    if (!showPastEvents) {
      options.startDate = new Date()
    }

    const data = await getCommunityEvents(communityId, options)
    setEvents(data)

    // Fetch registration status and available spots for each event
    if (user) {
      const regMap = new Map<string, boolean>()
      for (const event of data) {
        const isRegistered = await isUserRegisteredForCommunityEvent(event.id, user.id)
        regMap.set(event.id, isRegistered)
      }
      setRegistrations(regMap)
    }

    // Fetch available spots for events with limits
    const spotsMap = new Map<string, number | null>()
    for (const event of data) {
      if (event.attendee_limit) {
        const spots = await getCommunityEventAvailableSpots(event.id)
        spotsMap.set(event.id, spots)
      }
    }
    setAvailableSpots(spotsMap)

    setLoading(false)
  }

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast.error('Du må være innlogget for å melde deg på')
      return
    }

    const isRegistered = registrations.get(eventId)

    if (isRegistered) {
      // Cancel registration
      const success = await cancelCommunityEventRegistration(eventId, user.id)
      if (success) {
        setRegistrations(new Map(registrations.set(eventId, false)))
        // Update available spots
        const spots = await getCommunityEventAvailableSpots(eventId)
        setAvailableSpots(new Map(availableSpots.set(eventId, spots)))
        toast.success('Påmelding kansellert')
      } else {
        toast.error('Kunne ikke kansellere påmelding')
      }
    } else {
      // Register
      const registration = await registerForCommunityEvent(eventId, user.id)
      if (registration) {
        setRegistrations(new Map(registrations.set(eventId, true)))
        // Update available spots
        const spots = await getCommunityEventAvailableSpots(eventId)
        setAvailableSpots(new Map(availableSpots.set(eventId, spots)))
        toast.success('Du er nå påmeldt!')
      } else {
        toast.error('Kunne ikke melde på. Arrangementet kan være fullt.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        {showPastEvents ? 'Arrangementer' : 'Kommende arrangementer'}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onRegister={() => handleRegister(event.id)}
            isRegistered={registrations.get(event.id)}
            availableSpots={availableSpots.get(event.id)}
          />
        ))}
      </div>
    </div>
  )
}
