'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Globe, MapPin, Users } from 'lucide-react'
import { Feed, type StarredLocations } from '@/components/feed/Feed'
import { createClient } from '@/lib/supabase/client'

interface HomeFeedTabsProps {
  categorySlug?: string
}

export function HomeFeedTabs({ categorySlug = '' }: HomeFeedTabsProps) {
  const [activeTab, setActiveTab] = useState<'sapmi' | 'mine-steder' | 'venner'>('sapmi')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [starredLocationIds, setStarredLocationIds] = useState<StarredLocations>({
    languageAreaIds: [],
    municipalityIds: [],
    placeIds: []
  })

  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch starred locations
  useEffect(() => {
    const fetchStarredLocations = async () => {
      if (!currentUserId) return

      // Fetch starred language areas
      const { data: languageAreas } = await supabase
        .from('user_starred_language_areas')
        .select('language_area_id')
        .eq('user_id', currentUserId)

      // Fetch starred municipalities
      const { data: municipalities } = await supabase
        .from('user_starred_municipalities')
        .select('municipality_id')
        .eq('user_id', currentUserId)

      // Fetch starred places
      const { data: places } = await supabase
        .from('user_starred_places')
        .select('place_id')
        .eq('user_id', currentUserId)

      setStarredLocationIds({
        languageAreaIds: languageAreas?.map(la => la.language_area_id) || [],
        municipalityIds: municipalities?.map(m => m.municipality_id) || [],
        placeIds: places?.map(p => p.place_id) || []
      })
    }

    fetchStarredLocations()
  }, [currentUserId, supabase])

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <TabsList className="flex-wrap mb-3">
          <TabsTrigger value="venner">
            <Users className="w-4 h-4" />
            Venner
          </TabsTrigger>
          <TabsTrigger value="mine-steder">
            <MapPin className="w-4 h-4" />
            Mine steder
          </TabsTrigger>
          <TabsTrigger value="sapmi">
            <Globe className="w-4 h-4" />
            Innlegg fra hele Sápmi
          </TabsTrigger>
        </TabsList>
        <p className="text-sm text-gray-600 text-center max-w-md">
          Her vil du se innlegg fra dine favorittsteder, venner og hele Sápmi
        </p>
      </div>

      {/* Venner - posts from friends */}
      <TabsContent value="venner" className="mt-0">
        <Feed
          categorySlug={categorySlug}
          showFilters={true}
          friendsOnly={true}
        />
      </TabsContent>

      {/* Mine steder - posts from starred locations */}
      <TabsContent value="mine-steder" className="mt-0">
        <Feed
          categorySlug={categorySlug}
          showFilters={true}
          starredLocations={starredLocationIds}
        />
      </TabsContent>

      {/* Sápmi - all posts */}
      <TabsContent value="sapmi" className="mt-0">
        <Feed categorySlug={categorySlug} showFilters={true} />
      </TabsContent>
    </Tabs>
  )
}
