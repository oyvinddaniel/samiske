'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Feed } from '@/components/feed/Feed'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, FileText, Calendar, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LocationFeedPanelProps {
  locationType: 'language_area' | 'municipality' | 'place'
  locationId: string
  locationName: string
  onClose: () => void
}

export function LocationFeedPanel({ locationType, locationId, locationName, onClose }: LocationFeedPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('feed')
  const [loading, setLoading] = useState(true)
  const [locationDetails, setLocationDetails] = useState<{
    name: string
    name_sami: string | null
    parentName?: string
  } | null>(null)
  const [isStarred, setIsStarred] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch location details and starred status
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true)

      try {
        if (locationType === 'language_area') {
          const { data } = await supabase
            .from('language_areas')
            .select('name, name_sami')
            .eq('id', locationId)
            .single()
          if (data) setLocationDetails(data)

          // Check if starred
          if (currentUserId) {
            const { data: starred } = await supabase
              .from('user_starred_language_areas')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('language_area_id', locationId)
              .single()
            setIsStarred(!!starred)
          }
        } else if (locationType === 'municipality') {
          const { data } = await supabase
            .from('municipalities')
            .select(`
              name,
              name_sami,
              language_area:language_areas(name)
            `)
            .eq('id', locationId)
            .single()
          if (data) {
            const la = data.language_area as { name: string } | { name: string }[] | null
            setLocationDetails({
              name: data.name,
              name_sami: data.name_sami,
              parentName: Array.isArray(la) ? la[0]?.name : la?.name
            })
          }

          // Check if starred
          if (currentUserId) {
            const { data: starred } = await supabase
              .from('user_starred_municipalities')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('municipality_id', locationId)
              .single()
            setIsStarred(!!starred)
          }
        } else if (locationType === 'place') {
          const { data } = await supabase
            .from('places')
            .select(`
              name,
              name_sami,
              municipality:municipalities(name)
            `)
            .eq('id', locationId)
            .single()
          if (data) {
            const muni = data.municipality as { name: string } | { name: string }[] | null
            setLocationDetails({
              name: data.name,
              name_sami: data.name_sami,
              parentName: Array.isArray(muni) ? muni[0]?.name : muni?.name
            })
          }

          // Check if starred
          if (currentUserId) {
            const { data: starred } = await supabase
              .from('user_starred_places')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('place_id', locationId)
              .single()
            setIsStarred(!!starred)
          }
        }
      } catch (error) {
        console.error('Error fetching location details:', error)
      }

      setLoading(false)
    }

    fetchDetails()
  }, [supabase, locationType, locationId, currentUserId])

  // Toggle star
  const toggleStar = async () => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å stjerne steder')
      return
    }

    try {
      if (isStarred) {
        // Remove star
        const table = locationType === 'language_area'
          ? 'user_starred_language_areas'
          : locationType === 'municipality'
            ? 'user_starred_municipalities'
            : 'user_starred_places'

        const idColumn = locationType === 'language_area'
          ? 'language_area_id'
          : locationType === 'municipality'
            ? 'municipality_id'
            : 'place_id'

        await supabase
          .from(table)
          .delete()
          .eq('user_id', currentUserId)
          .eq(idColumn, locationId)

        setIsStarred(false)
        toast.success('Fjernet fra mine steder')
        // Dispatch event for real-time sidebar update
        window.dispatchEvent(new CustomEvent('starred-locations-changed'))
      } else {
        // Add star
        const table = locationType === 'language_area'
          ? 'user_starred_language_areas'
          : locationType === 'municipality'
            ? 'user_starred_municipalities'
            : 'user_starred_places'

        const idColumn = locationType === 'language_area'
          ? 'language_area_id'
          : locationType === 'municipality'
            ? 'municipality_id'
            : 'place_id'

        await supabase
          .from(table)
          .insert({ user_id: currentUserId, [idColumn]: locationId })

        setIsStarred(true)
        toast.success('Lagt til i mine steder')
        // Dispatch event for real-time sidebar update
        window.dispatchEvent(new CustomEvent('starred-locations-changed'))
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      toast.error('Noe gikk galt')
    }
  }

  // Standard green color for all location types
  const colorClass = 'bg-green-100 text-green-600'

  // Build geography filter for Feed
  const geographyFilter = useMemo(() => {
    return {
      type: locationType,
      id: locationId
    }
  }, [locationType, locationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', colorClass)}>
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {locationDetails?.name || locationName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {locationDetails?.name_sami && (
                <span className="italic">{locationDetails.name_sami}</span>
              )}
              {locationDetails?.parentName && (
                <>
                  {locationDetails.name_sami && <span>·</span>}
                  <span>{locationDetails.parentName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Star button */}
        {currentUserId && (
          <button
            onClick={toggleStar}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isStarred
                ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'
            )}
            title={isStarred ? 'Fjern fra mine steder' : 'Legg til i mine steder'}
          >
            <Star className={cn('w-6 h-6', isStarred && 'fill-current')} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="feed">
              <FileText className="w-4 h-4" />
              Innlegg
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4" />
              Kalender
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feed" className="mt-0">
          <Feed
            geography={geographyFilter}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView
            geographyType={geographyFilter.type as 'municipality' | 'place' | 'language_area'}
            geographyId={geographyFilter.id}
            showFilter={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
