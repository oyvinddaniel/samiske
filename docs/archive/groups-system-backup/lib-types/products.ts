// Product (Produkt) types

export type PriceType = 'fixed' | 'from' | 'contact'

export interface Product {
  id: string
  community_id: string
  name: string
  slug: string
  description: string | null
  size: string | null
  images: string[]  // Array of image URLs
  primary_image: string | null
  price: number | null
  currency: string
  price_type: PriceType
  in_stock: boolean
  stock_quantity: number | null
  purchase_url: string | null
  contact_email: string | null
  contact_phone: string | null
  search_tags: string[]  // Synonyms/search keywords (not visible to users)
  municipality_id: string | null
  place_id: string | null
  ships_nationally: boolean
  ships_internationally: boolean
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  is_featured: boolean
}

export interface ProductWithCommunity extends Product {
  community?: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

export interface ProductWithGeography extends Product {
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

export interface ProductWithIndustries extends Product {
  industries?: Array<{
    id: string
    name_no: string
    slug: string
  }>
}

// Price type labels for UI
export const priceTypeLabels: Record<PriceType, string> = {
  fixed: 'Fast pris',
  from: 'Fra',
  contact: 'Kontakt for pris'
}
