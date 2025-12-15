// Geography admin types

export interface Country {
  id: string
  name: string
  name_sami: string | null
  code: string
  sort_order: number
}

export interface LanguageArea {
  id: string
  name: string
  name_sami: string | null
  code: string
  description: string | null
  sort_order: number
}

export interface Municipality {
  id: string
  name: string
  name_sami: string | null
  slug: string
  country_id: string
  language_area_id: string | null
  country?: Country
  language_area?: LanguageArea | null
}

export interface Place {
  id: string
  name: string
  name_sami: string | null
  slug: string
  municipality_id: string
  municipality?: Municipality
}

export interface Suggestion {
  id: string
  user_id: string
  suggestion_type: 'new_item' | 'edit_name' | 'edit_relationship'
  entity_type: 'language_area' | 'municipality' | 'place'
  entity_id: string | null
  suggested_data: Record<string, unknown>
  current_data: Record<string, unknown> | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  user?: {
    id: string
    full_name: string | null
    email: string
  }
}

export type EditableItem = LanguageArea | Country | Municipality | Place
