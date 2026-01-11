// Reactions - 10 total, 5 per row
export const REACTIONS = [
  // Row 1
  { emoji: '❤️', name: 'elsker', label: 'Elsker' },
  { emoji: '😂', name: 'haha', label: 'Haha' },
  { emoji: '😮', name: 'wow', label: 'Wow' },
  { emoji: '😢', name: 'trist', label: 'Trist' },
  { emoji: '😡', name: 'sint', label: 'Sint' },
  // Row 2
  { emoji: '👍', name: 'tommel', label: 'Tommel opp' },
  { emoji: '🔥', name: 'ild', label: 'Ild' },
  { emoji: '🎉', name: 'feiring', label: 'Feiring' },
  { emoji: '💯', name: 'hundre', label: 'Hundre' },
  { emoji: '🙏', name: 'takk', label: 'Takk' },
] as const

export type ReactionType = typeof REACTIONS[number]['name']

// Hashtag regex pattern
export const HASHTAG_PATTERN = /#[\wæøåÆØÅáàâäãåçéèêëíìîïñóòôöõúùûüýÿ]+/gi

// URL regex pattern for link preview
export const URL_PATTERN = /https?:\/\/[^\s<]+[^<.,:;"')\]\s]/gi

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]

// Supported video formats
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
]

// Max file sizes
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB before compression
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB

// Auto-save interval
export const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

// Debounce delays
export const LINK_PREVIEW_DEBOUNCE = 500 // ms
export const HASHTAG_SEARCH_DEBOUNCE = 300 // ms
export const DRAFT_SAVE_DEBOUNCE = 2000 // ms

// Local storage keys
export const DRAFT_STORAGE_KEY = 'samiske_post_draft'

// Tenor API (for GIFs)
export const TENOR_API_URL = 'https://tenor.googleapis.com/v2'

// Emoji categories
export const EMOJI_CATEGORIES = [
  { id: 'recent', name: 'Nylige', icon: '🕐' },
  { id: 'smileys', name: 'Smilefjes', icon: '😊' },
  { id: 'people', name: 'Folk', icon: '👋' },
  { id: 'nature', name: 'Natur', icon: '🌿' },
  { id: 'food', name: 'Mat', icon: '🍕' },
  { id: 'activities', name: 'Aktiviteter', icon: '⚽' },
  { id: 'travel', name: 'Reise', icon: '✈️' },
  { id: 'objects', name: 'Objekter', icon: '💡' },
  { id: 'symbols', name: 'Symboler', icon: '❤️' },
  { id: 'flags', name: 'Flagg', icon: '🏳️' },
] as const

// Common emoji for quick access
export const COMMON_EMOJIS = [
  '😊', '😂', '❤️', '👍', '🙏', '🔥', '💪', '✨', '🎉', '👏',
  '😍', '🥰', '😭', '😅', '🤔', '👀', '💯', '⭐', '🌟', '💕',
]

// Poll defaults
export const DEFAULT_POLL_EXPIRY_HOURS = 24
export const MIN_POLL_OPTIONS = 2
export const MAX_POLL_OPTIONS = 10
