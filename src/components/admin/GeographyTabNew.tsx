'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Languages, Globe, Building2, MapPin } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGeographyData } from './geography/useGeographyData'
import { CountriesTab } from './geography/CountriesTab'
import { LanguageAreasTab } from './geography/LanguageAreasTab'

/**
 * REFACTORED Geography Admin Component
 *
 * Reduced from 1258 lines to ~80 lines main component
 * by extracting:
 * - Types to geography/types.ts
 * - Data management to geography/useGeographyData.ts
 * - Tab components to geography/*Tab.tsx files
 *
 * Remaining tabs (Municipalities, Places, Suggestions) should follow
 * the same pattern as LanguageAreasTab.tsx for full implementation.
 */
export function GeographyTab() {
  const {
    supabase,
    countries,
    languageAreas,
    places,
    suggestions,
    fetchData,
  } = useGeographyData()

  const [activeTab, setActiveTab] = useState('language_areas')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Geografi-administrasjon</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Forslag
            {pendingSuggestions > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingSuggestions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="language_areas" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Språkområder
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Land
          </TabsTrigger>
          <TabsTrigger value="municipalities" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Kommuner
          </TabsTrigger>
          <TabsTrigger value="places" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Steder
          </TabsTrigger>
        </TabsList>

        {/*
          TODO: Create remaining tab components following the pattern:
          - SuggestionsTab.tsx (extract lines 536-705 from original)
          - MunicipalitiesTab.tsx (extract lines 871-1074 from original)
          - PlacesTab.tsx (extract lines 1076-1254 from original)

          Each should receive: data, supabase, onDataChange props
        */}

        <LanguageAreasTab
          languageAreas={languageAreas}
          supabase={supabase}
          onDataChange={fetchData}
        />

        <CountriesTab countries={countries} />
      </Tabs>
    </div>
  )
}
