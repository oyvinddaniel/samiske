// Hook
export { usePostComposer } from './usePostComposer'
export type { UsePostComposerReturn } from './usePostComposer'

// Core component
export { PostComposerCore } from './PostComposerCore'

// Wrapper components
export { PostComposerSheet } from './PostComposerSheet'
export { PostComposerInline } from './PostComposerInline'

// Draft components
export { DraftsList } from './DraftsList'
export { DraftIndicator, DraftSavedBadge } from './DraftIndicator'

// Schedule components
export { SchedulePicker } from './SchedulePicker'

// Link preview components
export { LinkPreview, PostLinkPreview, useLinkPreview } from './LinkPreview'

// Emoji picker
export { EmojiPicker } from './EmojiPicker'

// Poll editor
export { PollEditor } from './PollEditor'

// GIF picker
export { GifPicker, GifButton } from './GifPicker'

// Image editor
export { ImageEditor, DEFAULT_FILTERS, FILTER_PRESETS, ASPECT_RATIOS } from './ImageEditor'
export type { ImageEdits, CropData, FilterSettings, FilterPreset, AspectRatioKey, AspectRatioOption } from './ImageEditor'

// Rich text editor
// export { RichTextEditor, htmlToPlainText, plainTextToHtml, hasRichFormatting } from './RichTextEditor'

// Types
export type {
  PostType,
  MediaItem,
  PollOption,
  PollData,
  LinkPreviewData,
  DraftData,
  FullDraftData,
  ComposerState,
  ComposerConfig,
  ComposerVariant,
  ComposerContext,
  Category,
  ImageCropData,
  ImageFilterSettings,
  ImageEdits as MediaImageEdits,
} from './types'
export { DEFAULT_COMPOSER_CONFIG } from './types'

// Constants
export {
  REACTIONS,
  HASHTAG_PATTERN,
  URL_PATTERN,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  EMOJI_CATEGORIES,
  COMMON_EMOJIS,
} from './constants'
export type { ReactionType } from './constants'
