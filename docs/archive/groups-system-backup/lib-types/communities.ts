// Community/Samfunn types - v2

// ============================================
// ADMIN ROLES
// ============================================

export type AdminRole = 'owner' | 'admin' | 'editor' | 'analyst'

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: 'Eier',
  admin: 'Administrator',
  editor: 'Redaktør',
  analyst: 'Analytiker'
}

export const adminRoleDescriptions: Record<AdminRole, string> = {
  owner: 'Full kontroll, kan slette siden og overføre eierskap',
  admin: 'Kan redigere alt, legge til team-medlemmer',
  editor: 'Kan poste innhold og svare på meldinger',
  analyst: 'Kan kun se statistikk'
}

// ============================================
// COMMUNITY SETTINGS (JSONB)
// ============================================

export interface CommunityVisibilitySettings {
  status: 'active' | 'paused'
  who_can_see: 'everyone' | 'logged_in'
  show_in_catalog: boolean
  visible_contact_fields: Array<'email' | 'phone' | 'website' | 'address' | 'whatsapp'>
}

export interface CommunityNotificationSettings {
  new_follower: boolean
  new_message: boolean
  new_comment: boolean
}

export interface CommunityCommunicationSettings {
  allow_messages: boolean
  auto_reply: string | null
  notifications: CommunityNotificationSettings
}

export interface CommunityContentSettings {
  who_can_post: 'admins_only' | 'all_followers'
  comments: 'open' | 'moderated' | 'closed'
  blocked_words: string[]
}

export interface CommunityCtaButton {
  type: 'contact' | 'message' | 'website' | 'call' | 'book' | 'menu' | 'shop' | 'donate' | 'custom'
  label: string | null  // Custom label
  url: string | null
}

export interface CommunitySettings {
  visibility: CommunityVisibilitySettings
  communication: CommunityCommunicationSettings
  content: CommunityContentSettings
  cta_button: CommunityCtaButton
}

export const defaultCommunitySettings: CommunitySettings = {
  visibility: {
    status: 'active',
    who_can_see: 'everyone',
    show_in_catalog: true,
    visible_contact_fields: ['email', 'phone', 'website', 'address']
  },
  communication: {
    allow_messages: true,
    auto_reply: null,
    notifications: {
      new_follower: true,
      new_message: true,
      new_comment: true
    }
  },
  content: {
    who_can_post: 'admins_only',
    comments: 'open',
    blocked_words: []
  },
  cta_button: {
    type: 'contact',
    label: null,
    url: null
  }
}

// CTA button labels
export const ctaButtonLabels: Record<CommunityCtaButton['type'], string> = {
  contact: 'Kontakt oss',
  message: 'Send melding',
  website: 'Besøk nettside',
  call: 'Ring nå',
  book: 'Book time',
  menu: 'Se meny',
  shop: 'Kjøp nå',
  donate: 'Støtt oss',
  custom: 'Egendefinert'
}

// ============================================
// MAIN COMMUNITY INTERFACE
// ============================================

export interface Community {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  images: string[]
  // Contact
  website_url: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  // Category (legacy text + new reference)
  category: string  // Legacy: 'organization', 'business', etc.
  category_id: string | null
  // Tags
  tags: string[]
  // Special fields
  booking_url: string | null
  membership_info: string | null
  artist_statement: string | null
  // Settings (JSONB)
  settings: CommunitySettings
  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
  // Counters
  follower_count: number
  post_count: number
  // Status
  is_verified: boolean
  is_active: boolean
}

// ============================================
// COMMUNITY ADMIN
// ============================================

export interface CommunityAdmin {
  id: string
  community_id: string
  user_id: string
  role: AdminRole
  created_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

// ============================================
// COMMUNITY FOLLOWER
// ============================================

export interface CommunityFollower {
  id: string
  community_id: string
  user_id: string
  created_at: string
  notify_posts: boolean
  notify_events: boolean
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

// ============================================
// EXTENDED TYPES
// ============================================

export interface CommunityWithAdmin extends Community {
  admin_role?: AdminRole
}

export interface CommunityWithCategory extends Community {
  category_data?: {
    id: string
    slug: string
    name_no: string
    name_se: string | null
    icon: string
    features: CategoryFeatures
  }
}

export interface CommunityFull extends CommunityWithCategory {
  attributes?: Attribute[]
  opening_hours?: OpeningHours[]
  faqs?: FAQ[]
  upcoming_events?: CommunityEvent[]
}

// ============================================
// CATEGORY
// ============================================

export interface CategoryFeatures {
  has_products: boolean
  has_services: boolean
  has_booking: boolean
  has_menu: boolean
  has_opening_hours: boolean
  has_portfolio: boolean
  has_membership: boolean
  has_events: boolean
}

export interface CommunityCategory {
  id: string
  slug: string
  name_no: string
  name_se: string | null
  name_sma: string | null
  name_smj: string | null
  icon: string
  description: string | null
  features: CategoryFeatures
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// ATTRIBUTES
// ============================================

export type AttributeCategory =
  | 'accessibility'
  | 'ownership'
  | 'sustainability'
  | 'language'
  | 'certification'
  | 'other'

export const attributeCategoryLabels: Record<AttributeCategory, string> = {
  accessibility: 'Tilgjengelighet',
  ownership: 'Eierskap',
  sustainability: 'Bærekraft',
  language: 'Språk',
  certification: 'Sertifisering',
  other: 'Annet'
}

export interface Attribute {
  id: string
  slug: string
  name_no: string
  name_se: string | null
  name_sma: string | null
  name_smj: string | null
  icon: string | null
  category: AttributeCategory
  description: string | null
  is_active: boolean
  is_approved: boolean
  suggested_by: string | null
  approved_by: string | null
  created_at: string
}

export interface CommunityAttribute {
  community_id: string
  attribute_id: string
  created_at: string
}

// ============================================
// OPENING HOURS
// ============================================

export interface OpeningHours {
  id: string
  community_id: string
  day_of_week: number  // 0=Søndag, 1=Mandag, etc.
  opens_at: string | null  // TIME format: "09:00"
  closes_at: string | null
  is_closed: boolean
  note: string | null
}

export const dayOfWeekLabels: Record<number, string> = {
  0: 'Søndag',
  1: 'Mandag',
  2: 'Tirsdag',
  3: 'Onsdag',
  4: 'Torsdag',
  5: 'Fredag',
  6: 'Lørdag'
}

export const dayOfWeekLabelsShort: Record<number, string> = {
  0: 'Søn',
  1: 'Man',
  2: 'Tir',
  3: 'Ons',
  4: 'Tor',
  5: 'Fre',
  6: 'Lør'
}

// ============================================
// FAQ
// ============================================

export interface FAQ {
  id: string
  community_id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// EVENTS
// ============================================

export type EventRegistrationStatus = 'registered' | 'cancelled' | 'attended' | 'waitlist'

export interface CommunityEvent {
  id: string
  community_id: string
  title: string
  slug: string
  description: string | null
  location: string | null
  location_url: string | null
  starts_at: string
  ends_at: string | null
  is_all_day: boolean
  timezone: string
  // Recurrence
  recurrence_rule: string | null
  recurrence_end: string | null
  parent_event_id: string | null
  // Registration
  attendee_limit: number | null
  registration_required: boolean
  registration_url: string | null
  // Price
  price: number | null
  currency: string
  // Media
  image_url: string | null
  external_url: string | null
  // Metadata
  created_by: string | null
  created_at: string
  updated_at: string
  is_active: boolean
  is_featured: boolean
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  status: EventRegistrationStatus
  notes: string | null
  registered_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CommunityEventWithRegistrations extends CommunityEvent {
  registrations?: EventRegistration[]
  registration_count?: number
  user_registration?: EventRegistration | null
}

// ============================================
// PORTFOLIO
// ============================================

export type PortfolioMediaType = 'image' | 'video' | 'audio' | 'link' | 'embed'

export interface PortfolioItem {
  id: string
  community_id: string
  title: string
  description: string | null
  media_type: PortfolioMediaType
  media_url: string
  thumbnail_url: string | null
  external_link: string | null
  embed_code: string | null
  sort_order: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// CERTIFICATIONS
// ============================================

export interface Certification {
  id: string
  community_id: string
  name: string
  issuer: string | null
  description: string | null
  issued_date: string | null
  expires_date: string | null
  document_url: string | null
  verification_url: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// GOOGLE INTEGRATION
// ============================================

export interface GoogleIntegration {
  id: string
  community_id: string
  google_place_id: string | null
  google_account_id: string | null
  google_location_id: string | null
  last_synced_at: string | null
  sync_enabled: boolean
  sync_fields: string[]
  sync_errors: Array<{ date: string; error: string }>
  manual_link: string | null
  created_at: string
  updated_at: string
}

// ============================================
// REVIEWS (Latent)
// ============================================

export interface CommunityReview {
  id: string
  community_id: string
  user_id: string
  rating: number  // 1-5
  title: string | null
  content: string | null
  // Response
  response: string | null
  response_by: string | null
  response_at: string | null
  // Moderation
  is_approved: boolean
  is_reported: boolean
  report_reason: string | null
  // Metadata
  is_active: boolean
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

// ============================================
// ANALYTICS (Latent)
// ============================================

export interface CommunityAnalytics {
  id: string
  community_id: string
  date: string
  page_views: number
  unique_visitors: number
  cta_clicks: number
  message_requests: number
  new_followers: number
  profile_visits: number
  product_views: number
  service_views: number
  event_views: number
  visitor_locations: Record<string, number>
  referrer_sources: Record<string, number>
}

// ============================================
// ADMIN ACTIVITY LOG
// ============================================

export type AdminActivityAction =
  | 'update_settings'
  | 'update_profile'
  | 'add_admin'
  | 'remove_admin'
  | 'change_admin_role'
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'create_service'
  | 'update_service'
  | 'delete_service'
  | 'create_faq'
  | 'update_faq'
  | 'delete_faq'
  | 'update_opening_hours'
  | 'add_portfolio_item'
  | 'remove_portfolio_item'
  | 'add_certification'
  | 'remove_certification'
  | 'respond_to_review'

export interface AdminActivityLog {
  id: string
  community_id: string
  user_id: string
  action: AdminActivityAction
  details: Record<string, unknown>
  created_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

// ============================================
// LEGACY SUPPORT
// ============================================

// Keep for backward compatibility during migration
export type CommunityCategory_Legacy =
  | 'organization'
  | 'business'
  | 'institution'
  | 'association'
  | 'cultural'
  | 'educational'
  | 'government'
  | 'artist'
  | 'craftsperson'
  | 'restaurant'
  | 'service_provider'
  | 'other'

// Legacy category labels (for existing code)
export const categoryLabels: Record<string, string> = {
  organization: 'Organisasjon',
  business: 'Bedrift',
  institution: 'Institusjon',
  association: 'Forening',
  cultural: 'Kulturinstitusjon',
  educational: 'Utdanning',
  government: 'Offentlig',
  artist: 'Kunstner',
  craftsperson: 'Håndverker',
  restaurant: 'Restaurant/Kafé',
  service_provider: 'Tjenesteyter',
  other: 'Annet'
}

// Legacy category icons
export const categoryIcons: Record<string, string> = {
  organization: 'Building2',
  business: 'Briefcase',
  institution: 'Landmark',
  association: 'Users',
  cultural: 'Palette',
  educational: 'GraduationCap',
  government: 'Building',
  artist: 'Brush',
  craftsperson: 'Hammer',
  restaurant: 'UtensilsCrossed',
  service_provider: 'Wrench',
  other: 'CircleDot'
}
