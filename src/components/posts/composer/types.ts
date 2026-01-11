import type { MentionData } from '@/components/mentions'
import type { PostVisibility } from '@/lib/types/circles'
import type { GeographySelection } from '@/components/geography'

// Post types
export type PostType = 'standard' | 'event'

// Image edit types
export interface ImageCropData {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageFilterSettings {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
}

export interface ImageEdits {
  crop?: ImageCropData
  filters: ImageFilterSettings
  rotation: number
  flipH: boolean
  flipV: boolean
}

// Media types
export interface MediaItem {
  id: string
  type: 'image' | 'video' | 'gif'
  file?: File
  url?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  duration?: number // For video, in seconds
  uploadProgress?: number
  uploadError?: string
  isProcessing?: boolean // For video transcoding status
  sortOrder: number
  // Bunny Stream specific fields (for video)
  bunnyVideoId?: string
  bunnyLibraryId?: string
  hlsUrl?: string
  // Image editing
  edits?: ImageEdits
  editedFile?: File // File after editing (for upload)
  originalUrl?: string // Original URL before editing
  // Per-image captions
  caption?: string
  title?: string
  alt_text?: string
}

// Poll types
export interface PollOption {
  id: string
  text: string
  sortOrder: number
}

export interface PollData {
  question: string
  options: PollOption[]
  expiresAt?: Date
  allowMultiple: boolean
}

// Link preview
export interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  loading: boolean
  error?: string
}

// Draft (localStorage format)
export interface DraftData {
  id: string
  title: string
  content: string
  media: MediaItem[]
  poll?: PollData
  savedAt: Date
}

// Full draft data from database
export interface FullDraftData {
  id: string
  title: string | null
  content: string | null
  postType: PostType
  visibility: PostVisibility
  categoryId: string | null
  eventDate: string | null
  eventTime: string | null
  eventEndTime: string | null
  eventLocation: string | null
  languageAreaId: string | null
  municipalityId: string | null
  placeId: string | null
  groupId: string | null
  communityId: string | null
  media: MediaItem[]
  selectedCircles: string[]
  lastSavedAt: string
}

// Composer state
export interface ComposerState {
  // Basic fields
  title: string
  content: string
  type: PostType
  visibility: PostVisibility
  selectedCircles: string[]
  categoryId: string

  // Event fields
  eventDate: string
  eventTime: string
  eventEndTime: string
  eventLocation: string

  // Media
  media: MediaItem[]

  // Mentions & Hashtags
  mentions: MentionData[]
  hashtags: string[]

  // Geography
  geography: GeographySelection | null

  // Poll
  poll: PollData | null

  // Link preview
  linkPreview: LinkPreviewData | null

  // Scheduling
  scheduledFor: Date | null

  // Context
  groupId: string | null
  communityId: string | null

  // Meta
  isDirty: boolean
  isSubmitting: boolean
  isSavingDraft: boolean
  error: string | null
  draftId: string | null
  lastSavedAt: Date | null
}

// Composer actions
export type ComposerAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_CONTENT'; payload: { content: string; mentions: MentionData[]; hashtags: string[] } }
  | { type: 'SET_POST_TYPE'; payload: PostType }
  | { type: 'SET_VISIBILITY'; payload: { visibility: PostVisibility; circles: string[] } }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_EVENT_DETAILS'; payload: { date?: string; time?: string; endTime?: string; location?: string } }
  | { type: 'ADD_MEDIA'; payload: MediaItem }
  | { type: 'REMOVE_MEDIA'; payload: string }
  | { type: 'UPDATE_MEDIA'; payload: { id: string; updates: Partial<MediaItem> } }
  | { type: 'UPDATE_MEDIA_CAPTION'; payload: { id: string; caption: string } }
  | { type: 'REORDER_MEDIA'; payload: MediaItem[] }
  | { type: 'SET_GEOGRAPHY'; payload: GeographySelection | null }
  | { type: 'SET_POLL'; payload: PollData | null }
  | { type: 'SET_LINK_PREVIEW'; payload: LinkPreviewData | null }
  | { type: 'SET_SCHEDULED'; payload: Date | null }
  | { type: 'SET_CONTEXT'; payload: { groupId?: string | null; communityId?: string | null } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SAVING_DRAFT'; payload: boolean }
  | { type: 'SET_DRAFT_SAVED'; payload: { draftId: string; savedAt: Date } }
  | { type: 'LOAD_DRAFT'; payload: DraftData }
  | { type: 'LOAD_FULL_DRAFT'; payload: FullDraftData }
  | { type: 'RESET' }

// Composer config (from admin settings)
export interface ComposerConfig {
  maxImagesPerPost: number
  maxVideoLength: number // seconds
  maxVideoSize: number // MB
  maxHashtagsPerPost: number
  maxPollOptions: number
  maxScheduleDays: number
}

// Default config
export const DEFAULT_COMPOSER_CONFIG: ComposerConfig = {
  maxImagesPerPost: 50,
  maxVideoLength: 600, // 10 minutes
  maxVideoSize: 500, // MB
  maxHashtagsPerPost: 30,
  maxPollOptions: 10,
  maxScheduleDays: 60,
}

// Composer variant (how it's presented)
export type ComposerVariant = 'sheet' | 'inline' | 'modal' | 'fullscreen'

// Composer context for wrapper components
export interface ComposerContext {
  variant: ComposerVariant
  defaultGeography?: GeographySelection | null
  defaultGroupId?: string | null
  defaultCommunityId?: string | null
  onSuccess?: () => void
  onClose?: () => void
}

// Category type
export interface Category {
  id: string
  name: string
  slug: string
  color: string
}
