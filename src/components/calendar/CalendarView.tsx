'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, X, ExternalLink, Video, Globe, Filter, Share2, Users, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarFilters, type CalendarFilter } from './CalendarFilters'

interface Event {
  id: string
  title: string
  content: string
  image_url: string | null
  event_date: string
  event_time: string | null
  event_end_time: string | null
  event_location: string | null
  is_digital?: boolean
  meeting_url?: string | null
  meeting_platform?: string | null
  max_participants?: number | null
  posted_from_name?: string | null
  posted_from_type?: string | null
  source_type?: string | null // 'primary', 'bubbled', 'shared'
  user: {
    full_name: string | null
  }
}

type GeographyType = 'sapmi' | 'country' | 'language_area' | 'municipality' | 'place' | 'user_locations'

interface GeographyOption {
  type: GeographyType
  id: string | null
  name: string
}

interface EventPopupProps {
  event: Event
  anchorRect: DOMRect | null
  onClose: () => void
}

function EventPopup({ event, anchorRect, onClose }: EventPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
     
    setMounted(true)
  }, [])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const formatTime = (time: string | null, endTime: string | null) => {
    if (!time) return null
    let formatted = time.slice(0, 5)
    if (endTime) {
      formatted += ` - ${endTime.slice(0, 5)}`
    }
    return formatted
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!mounted) return null

  // Calculate position - on desktop, below the anchor; on mobile, centered
  const isMobile = window.innerWidth < 768
  const style: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        width: '400px'
      }
    : anchorRect
    ? {
        position: 'absolute',
        top: anchorRect.bottom + window.scrollY + 8,
        left: Math.max(16, Math.min(anchorRect.left, window.innerWidth - 420)),
        width: '400px',
        maxWidth: 'calc(100vw - 32px)'
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px'
      }

  return createPortal(
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={onClose}
        />
      )}
      <div
        ref={popupRef}
        style={style}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Event image */}
        {event.image_url && (
          <div className="w-full h-40 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event details */}
        <div className="p-4">
          <div className="flex items-start gap-2 pr-8">
            <h3 className="font-bold text-lg text-gray-900">
              {event.title}
            </h3>
            {event.is_digital && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 flex-shrink-0">
                <Video className="w-3 h-3" />
                Digital
              </span>
            )}
            {event.source_type === 'shared' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                <Share2 className="w-3 h-3" />
                Delt
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-red-500" />
              {formatDate(event.event_date)}
            </div>

            {event.event_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-blue-500" />
                {formatTime(event.event_time, event.event_end_time)}
              </div>
            )}

            {event.is_digital ? (
              <>
                {event.meeting_platform && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Video className="w-4 h-4" />
                    {event.meeting_platform}
                  </div>
                )}
                {event.meeting_url && (
                  <a
                    href={event.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 underline"
                  >
                    <Globe className="w-4 h-4" />
                    Bli med på møtet
                  </a>
                )}
              </>
            ) : event.event_location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-green-500" />
                {event.event_location}
              </div>
            )}

            {event.max_participants && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-orange-500" />
                Maks {event.max_participants} deltakere
              </div>
            )}
          </div>

          {event.content && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
              {event.content}
            </p>
          )}

          {(event.user?.full_name || event.posted_from_name) && (
            <p className="mt-2 text-xs text-gray-400">
              Arrangert av {event.posted_from_name || event.user?.full_name}
            </p>
          )}

          <Link href={`/innlegg/${event.id}`}>
            <Button className="w-full mt-4" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Se fullstendig arrangement
            </Button>
          </Link>
        </div>
      </div>
    </>,
    document.body
  )
}

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const MONTHS = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'
]

interface CalendarViewProps {
  communityIds?: string[]
  // Geografisk filtrering
  geographyType?: GeographyType
  geographyId?: string | null
  showFilter?: boolean
  onCreateEvent?: () => void
  hideBackButton?: boolean
}

export function CalendarView({
  communityIds,
  geographyType: initialGeographyType,
  geographyId: initialGeographyId,
  showFilter = true,
  onCreateEvent,
  hideBackButton = false
}: CalendarViewProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventAnchorRect, setEventAnchorRect] = useState<DOMRect | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Geografisk filtrering
  const [geographyType, setGeographyType] = useState<GeographyType>(initialGeographyType || 'user_locations')
  const [geographyId, setGeographyId] = useState<string | null>(initialGeographyId || null)
  const [geographyOptions, setGeographyOptions] = useState<GeographyOption[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // 🆕 Modern filters (Hvem/Lokasjon)
  const [filters, setFilters] = useState<CalendarFilter>({
    who: ['all'],
    location: null,
    locationId: null,
    locationType: null,
  })

  // Hent bruker og geografiske alternativer
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Hent språkområder og kommuner for filter
      const [langAreasRes, municipalitiesRes] = await Promise.all([
        supabase.from('language_areas').select('id, name').order('sort_order'),
        supabase.from('municipalities').select('id, name').order('name').limit(50)
      ])

      const options: GeographyOption[] = [
        { type: 'user_locations', id: null, name: 'Mine steder' },
        { type: 'sapmi', id: null, name: 'Hele Sapmi' },
      ]

      if (langAreasRes.data) {
        langAreasRes.data.forEach(la => {
          options.push({ type: 'language_area', id: la.id, name: la.name })
        })
      }

      setGeographyOptions(options)
    }

    init()
  }, [supabase])

  // 🔄 Sync modern filters with geography state (for data fetching)
  useEffect(() => {
    if (!filters.locationType) {
      // No location filter - default to sapmi if not set by props
      if (!initialGeographyType) {
        setGeographyType('sapmi')
        setGeographyId(null)
      }
      return
    }

    // Map modern filter location to geography state
    if (filters.locationType === 'user_locations') {
      setGeographyType('user_locations')
      setGeographyId(null)
    } else if (filters.locationType === 'sapmi') {
      setGeographyType('sapmi')
      setGeographyId(null)
    } else {
      // Specific location (place, municipality, language_area)
      setGeographyType(filters.locationType)
      setGeographyId(filters.locationId)
    }
  }, [filters.locationType, filters.locationId, initialGeographyType])

  // Fetch events for the current month
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()

      // Get first and last day of month
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

      // If filtering by community, use old method
      if (communityIds && communityIds.length > 0) {
        const { data: communityPosts } = await supabase
          .from('community_posts')
          .select('post_id')
          .in('community_id', communityIds)
        const postIds = communityPosts?.map(cp => cp.post_id) || []

        if (postIds.length === 0) {
          setEvents([])
          setLoading(false)
          return
        }

        const query = supabase
          .from('posts')
          .select(`
            id, title, content, image_url, event_date, event_time,
            event_end_time, event_location, is_digital, meeting_url,
            meeting_platform, max_participants,
            user:profiles!posts_user_id_fkey (full_name)
          `)
          .eq('type', 'event')
          .eq('visibility', 'public')  // 🔒 Kun offentlige arrangementer
          .in('id', postIds)
          .gte('event_date', firstDay)
          .lte('event_date', lastDay)
          .order('event_date', { ascending: true })
          .order('event_time', { ascending: true })

        const { data, error } = await query
        if (!error && data) {
          const formatted = data.map(event => ({
            ...event,
            user: Array.isArray(event.user) ? event.user[0] : event.user
          }))
          setEvents(formatted as Event[])
        }
        setLoading(false)
        return
      }

      // Use RPC functions for geographic filtering
      try {
        let data: Event[] = []

        if (geographyType === 'user_locations' && currentUserId) {
          // Fetch events for user's starred locations
          const { data: rpcData, error } = await supabase.rpc('get_events_for_user_locations', {
            p_user_id: currentUserId,
            p_date_from: firstDay,
            p_date_to: lastDay
          })
          if (error) throw error
          data = rpcData || []
        } else if (geographyType === 'sapmi') {
          // Fetch all events in Sápmi
          const { data: rpcData, error } = await supabase.rpc('get_events_for_geography', {
            p_geography_type: 'sapmi',
            p_geography_id: null,
            p_date_from: firstDay,
            p_date_to: lastDay
          })
          if (error) throw error
          data = rpcData || []
        } else if (geographyId) {
          // Fetch events for specific geography
          const { data: rpcData, error } = await supabase.rpc('get_events_for_geography', {
            p_geography_type: geographyType,
            p_geography_id: geographyId,
            p_date_from: firstDay,
            p_date_to: lastDay
          })
          if (error) throw error
          data = rpcData || []
        } else {
          // Fallback: fetch all events
          const { data: fallbackData, error } = await supabase
            .from('posts')
            .select(`
              id, title, content, image_url, event_date, event_time,
              event_end_time, event_location, is_digital, meeting_url,
              meeting_platform, max_participants,
              user:profiles!posts_user_id_fkey (full_name)
            `)
            .eq('type', 'event')
            .eq('visibility', 'public')  // 🔒 Kun offentlige arrangementer
            .is('created_for_group_id', null)  // 🔒 Ikke gruppe-arrangementer
            .gte('event_date', firstDay)
            .lte('event_date', lastDay)
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true })

          if (!error && fallbackData) {
            data = fallbackData.map(event => ({
              ...event,
              user: Array.isArray(event.user) ? event.user[0] : event.user
            })) as Event[]
          }
        }

        setEvents(data)
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      }

      setLoading(false)
    }

    fetchEvents()
  }, [currentDate, supabase, communityIds, geographyType, geographyId, currentUserId])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDay = firstDayOfMonth.getDay() - 1
    if (startDay < 0) startDay = 6

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Add days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Add days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  // 🆕 Filter events based on modern filters (Hvem/Lokasjon)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // WHO filter (Meg/Venner/Grupper/Alle)
      if (!filters.who.includes('all')) {
        // TODO: Implement friend check and group check when we have that data
        // For now, only "me" filter is implemented
        if (filters.who.includes('me')) {
          // Keep events created by current user
          // (We don't have user_id on Event interface, so this is a placeholder)
        }
      }

      // LOCATION filter (Søkbar lokasjon)
      // Filter is handled by the main geography selector (geographyType/geographyId)
      // The CalendarFilters location search overrides the geography selector
      // TODO: When locationId is set, filter events by that specific location
      // Would need event.municipality_id/place_id/language_area_id fields

      return true // Show all events for now
    })
  }, [events, filters])

  // Get events for a specific date (using filtered events)
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(event => event.event_date === dateStr)
  }

  // Get events for selected date (using filtered events)
  const selectedDateEvents = selectedDate
    ? filteredEvents.filter(event => event.event_date === selectedDate)
    : []

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const formatTime = (time: string | null, endTime: string | null) => {
    if (!time) return null
    let formatted = time.slice(0, 5)
    if (endTime) {
      formatted += ` - ${endTime.slice(0, 5)}`
    }
    return formatted
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                {onCreateEvent && (
                  <Button variant="default" size="sm" onClick={onCreateEvent} className="gap-1">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nytt arrangement</span>
                    <span className="sm:hidden">Ny</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={goToToday}>
                  I dag
                </Button>
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 🆕 Modern Filters (Hvem/Lokasjon) */}
            {showFilter && !communityIds && (
              <CalendarFilters
                currentUserId={currentUserId}
                filters={filters}
                onFiltersChange={setFilters}
                eventCount={filteredEvents.length}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dateStr = day.date.toISOString().split('T')[0]
              const dayEvents = getEventsForDate(day.date)
              const hasEvents = dayEvents.length > 0
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    relative p-2 min-h-[60px] md:min-h-[80px] rounded-lg text-left transition-colors
                    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                    ${isToday(day.date) ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}
                  `}
                >
                  <span className={`
                    text-sm font-medium
                    ${isToday(day.date) ? 'text-blue-600' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>

                  {hasEvents && (
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`
                            text-[9px] md:text-[10px] truncate px-1 py-0.5 rounded flex items-center gap-0.5
                            ${event.is_digital
                              ? 'bg-purple-100 text-purple-700'
                              : event.source_type === 'shared'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                            }
                          `}
                        >
                          {event.is_digital && <Video className="w-2 h-2 flex-shrink-0" />}
                          {event.source_type === 'shared' && <Share2 className="w-2 h-2 flex-shrink-0" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-gray-500">
                          +{dayEvents.length - 2} mer
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day details */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {formatDateHeader(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setEventAnchorRect(rect)
                      setSelectedEvent(event)
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors"
                  >
                    {event.image_url && (
                      <div className="w-full h-32 rounded-md overflow-hidden mb-2">
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {event.title}
                      </h3>
                      {event.is_digital && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700">
                          <Video className="w-2.5 h-2.5" />
                          Digital
                        </span>
                      )}
                      {event.source_type === 'shared' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700">
                          <Share2 className="w-2.5 h-2.5" />
                          Delt
                        </span>
                      )}
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.event_time, event.event_end_time)}
                      </div>
                    )}
                    {event.is_digital && event.meeting_platform ? (
                      <div className="flex items-center gap-1 text-xs text-purple-600 mt-0.5">
                        <Video className="w-3 h-3" />
                        {event.meeting_platform}
                      </div>
                    ) : event.event_location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {event.event_location}
                      </div>
                    )}
                    {event.max_participants && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Users className="w-3 h-3" />
                        Maks {event.max_participants} deltakere
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                      {event.content}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Ingen arrangementer denne dagen
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event popup */}
      {selectedEvent && (
        <EventPopup
          event={selectedEvent}
          anchorRect={eventAnchorRect}
          onClose={() => {
            setSelectedEvent(null)
            setEventAnchorRect(null)
          }}
        />
      )}

      {/* Back to feed link - hide when in group context */}
      {!hideBackButton && (
        <Link href="/">
          <Button variant="outline" className="w-full">
            Tilbake til feeden
          </Button>
        </Link>
      )}
    </div>
  )
}
