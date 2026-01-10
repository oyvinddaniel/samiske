// Service (Tjeneste) types

export type ServicePriceType = 'fixed' | 'from' | 'hourly' | 'contact'

export interface Service {
  id: string
  community_id: string
  name: string
  slug: string
  description: string | null
  images: string[]  // Array of image URLs
  price: number | null
  currency: string
  price_type: ServicePriceType
  contact_email: string | null
  contact_phone: string | null
  booking_url: string | null
  search_tags: string[]  // Synonyms/search keywords (not visible to users)
  municipality_id: string | null
  place_id: string | null
  is_online: boolean
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  is_featured: boolean
}

export interface ServiceWithCommunity extends Service {
  community?: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

export interface ServiceWithGeography extends Service {
  municipality?: {
    id: string
    name: string
    name_sami: string | null
    slug: string
  }
  place?: {
    id: string
    name: string
    name_sami: string | null
    slug: string
  }
}

export interface ServiceWithIndustries extends Service {
  industries?: Array<{
    id: string
    name_no: string
    slug: string
  }>
}

// Price type labels for UI
export const servicePriceTypeLabels: Record<ServicePriceType, string> = {
  fixed: 'Fast pris',
  from: 'Fra',
  hourly: 'Per time',
  contact: 'Kontakt for pris'
}
