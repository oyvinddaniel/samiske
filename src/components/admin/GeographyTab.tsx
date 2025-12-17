'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Languages, Globe, Building2, MapPin } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGeographyData } from './geography/useGeographyData'
import { CountriesTab } from './geography/CountriesTab'
import { LanguageAreasTab } from './geography/LanguageAreasTab'
import { SuggestionsTab } from './geography/SuggestionsTab'
import { MunicipalitiesTab } from './geography/MunicipalitiesTab'
import { PlacesTab } from './geography/PlacesTab'

/**
 * REFACTORED Geography Admin Component
 *
 * Reduced from 1175 lines to ~90 lines main component
 * by extracting:
 * - Types to geography/types.ts
 * - Data management to geography/useGeographyData.ts
 * - Tab components to geography/*Tab.tsx files
 */
export function GeographyTab() {
  const {
    supabase,
    countries,
    languageAreas,
    municipalities,
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

        <SuggestionsTab
          suggestions={suggestions}
          languageAreas={languageAreas}
          municipalities={municipalities}
          supabase={supabase}
          onDataChange={fetchData}
        />

        <LanguageAreasTab
          languageAreas={languageAreas}
          supabase={supabase}
          onDataChange={fetchData}
        />

        <CountriesTab
          countries={countries}
          supabase={supabase}
          onDataChange={fetchData}
        />

        <MunicipalitiesTab
          municipalities={municipalities}
          countries={countries}
          languageAreas={languageAreas}
          supabase={supabase}
          onDataChange={fetchData}
        />

        <PlacesTab
          places={places}
          municipalities={municipalities}
          supabase={supabase}
          onDataChange={fetchData}
        />
      </Tabs>
    </div>
  )
}
