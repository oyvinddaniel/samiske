// Sidebar configuration
// Endre denne filen for å tilpasse sidebar-oppførsel og design

import { Building2, MapPin, Globe, type LucideIcon } from 'lucide-react'

// URL-bygger for geografiske steder
export const geographyUrls = {
  sapmi: '/sapmi',
  country: (countryCode: string) => `/sapmi/${countryCode.toLowerCase()}`,
  languageArea: (code: string) => `/sapmi/sprak/${code}`,
  municipality: (countryCode: string, municipalitySlug: string) =>
    `/sapmi/${countryCode.toLowerCase()}/${municipalitySlug}`,
  place: (countryCode: string, municipalitySlug: string, placeSlug: string) =>
    `/sapmi/${countryCode.toLowerCase()}/${municipalitySlug}/${placeSlug}`,
}

// Ikoner for ulike lokasjonstyper
export const locationIcons: Record<string, LucideIcon> = {
  region: Globe,
  country: Globe,
  language_area: Globe,
  municipality: Building2,
  place: MapPin,
}

// Sidebar-innstillinger
export const sidebarConfig = {
  // Standard antall synlige steder i "Mine steder"
  defaultMaxVisibleLocations: 5,

  // LocalStorage-nokkel for brukerpreferanser
  storageKeys: {
    maxLocations: 'sidebar_max_locations',
  },

  // Tekster (lett a endre til andre sprak)
  labels: {
    exploreRegion: 'Utforsk Sapmi',
    myPlaces: 'Mine steder',
    addPlace: 'Legg til sted',
    seeAll: 'Se alle',
  },
}

// Hjelpefunksjon for a bygge URL basert pa lokasjon
export function buildLocationUrl(
  locationType: 'municipality' | 'place',
  countryCode: string,
  municipalitySlug: string,
  placeSlug?: string
): string {
  if (locationType === 'place' && placeSlug) {
    return geographyUrls.place(countryCode, municipalitySlug, placeSlug)
  }
  return geographyUrls.municipality(countryCode, municipalitySlug)
}
