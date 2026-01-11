'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressPostImage } from '@/lib/imageCompression'
import { setPostCircleVisibility } from '@/lib/circles'
import { MediaService } from '@/lib/media'
import type { MentionData } from '@/components/mentions'
import type { GeographySelection } from '@/components/geography'
import type { PostVisibility } from '@/lib/types/circles'
import {
  type ComposerState,
  type ComposerAction,
  type ComposerConfig,
  type MediaItem,
  type PollData,
  type LinkPreviewData,
  type Category,
  type FullDraftData,
  DEFAULT_COMPOSER_CONFIG,
} from './types'
import {
  HASHTAG_PATTERN,
  URL_PATTERN,
  DRAFT_STORAGE_KEY,
  AUTO_SAVE_INTERVAL,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
} from './constants'

// Initial state
const initialState: ComposerState = {
  title: '',
  content: '',
  type: 'standard',
  visibility: 'public',
  selectedCircles: [],
  categoryId: '',
  eventDate: '',
  eventTime: '',
  eventEndTime: '',
  eventLocation: '',
  media: [],
  mentions: [],
  hashtags: [],
  geography: null,
  poll: null,
  linkPreview: null,
  scheduledFor: null,
  groupId: null,
  communityId: null,
  isDirty: false,
  isSubmitting: false,
  isSavingDraft: false,
  error: null,
  draftId: null,
  lastSavedAt: null,
}

// Reducer
function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload, isDirty: true }

    case 'SET_CONTENT':
      return {
        ...state,
        content: action.payload.content,
        mentions: action.payload.mentions,
        hashtags: action.payload.hashtags,
        isDirty: true,
      }

    case 'SET_POST_TYPE':
      return { ...state, type: action.payload, isDirty: true }

    case 'SET_VISIBILITY':
      return {
        ...state,
        visibility: action.payload.visibility,
        selectedCircles: action.payload.circles,
        isDirty: true,
      }

    case 'SET_CATEGORY':
      return { ...state, categoryId: action.payload, isDirty: true }

    case 'SET_EVENT_DETAILS':
      return {
        ...state,
        eventDate: action.payload.date ?? state.eventDate,
        eventTime: action.payload.time ?? state.eventTime,
        eventEndTime: action.payload.endTime ?? state.eventEndTime,
        eventLocation: action.payload.location ?? state.eventLocation,
        isDirty: true,
      }

    case 'ADD_MEDIA':
      return {
        ...state,
        media: [...state.media, action.payload],
        isDirty: true,
      }

    case 'REMOVE_MEDIA':
      return {
        ...state,
        media: state.media.filter((m) => m.id !== action.payload),
        isDirty: true,
      }

    case 'UPDATE_MEDIA':
      return {
        ...state,
        media: state.media.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      }

    case 'UPDATE_MEDIA_CAPTION':
      return {
        ...state,
        media: state.media.map((m) =>
          m.id === action.payload.id ? { ...m, caption: action.payload.caption } : m
        ),
        isDirty: true,
      }

    case 'REORDER_MEDIA':
      return { ...state, media: action.payload, isDirty: true }

    case 'SET_GEOGRAPHY':
      return { ...state, geography: action.payload, isDirty: true }

    case 'SET_POLL':
      return { ...state, poll: action.payload, isDirty: true }

    case 'SET_LINK_PREVIEW':
      return { ...state, linkPreview: action.payload }

    case 'SET_SCHEDULED':
      return { ...state, scheduledFor: action.payload, isDirty: true }

    case 'SET_CONTEXT':
      return {
        ...state,
        groupId: action.payload.groupId ?? state.groupId,
        communityId: action.payload.communityId ?? state.communityId,
      }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload }

    case 'SET_SAVING_DRAFT':
      return { ...state, isSavingDraft: action.payload }

    case 'SET_DRAFT_SAVED':
      return {
        ...state,
        draftId: action.payload.draftId,
        lastSavedAt: action.payload.savedAt,
        isDirty: false,
        isSavingDraft: false,
      }

    case 'LOAD_DRAFT':
      return {
        ...state,
        title: action.payload.title,
        content: action.payload.content,
        media: action.payload.media,
        poll: action.payload.poll ?? null,
        draftId: action.payload.id,
        isDirty: false,
      }

    case 'LOAD_FULL_DRAFT':
      return {
        ...state,
        title: action.payload.title || '',
        content: action.payload.content || '',
        type: action.payload.postType,
        visibility: action.payload.visibility,
        selectedCircles: action.payload.selectedCircles,
        categoryId: action.payload.categoryId || '',
        eventDate: action.payload.eventDate || '',
        eventTime: action.payload.eventTime || '',
        eventEndTime: action.payload.eventEndTime || '',
        eventLocation: action.payload.eventLocation || '',
        media: action.payload.media,
        groupId: action.payload.groupId,
        communityId: action.payload.communityId,
        draftId: action.payload.id,
        lastSavedAt: new Date(action.payload.lastSavedAt),
        isDirty: false,
        isSavingDraft: false,
      }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

// Extract hashtags from content
function extractHashtags(content: string): string[] {
  const matches = content.match(HASHTAG_PATTERN)
  if (!matches) return []
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))]
}

// Check for URLs in content
function extractFirstUrl(content: string): string | null {
  const matches = content.match(URL_PATTERN)
  return matches ? matches[0] : null
}

// Hook options
interface UsePostComposerOptions {
  userId: string
  config?: Partial<ComposerConfig>
  defaultGeography?: GeographySelection | null
  groupId?: string | null
  communityId?: string | null
  onSuccess?: () => void
}

export function usePostComposer(options: UsePostComposerOptions) {
  const {
    userId,
    config: userConfig,
    defaultGeography,
    groupId,
    communityId,
    onSuccess,
  } = options

  const config = { ...DEFAULT_COMPOSER_CONFIG, ...userConfig }
  const [state, dispatch] = useReducer(composerReducer, {
    ...initialState,
    geography: defaultGeography ?? null,
    groupId: groupId ?? null,
    communityId: communityId ?? null,
  })

  const supabase = createClient()
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesRef = useRef<Category[]>([])

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, color')
        .order('sort_order')

      if (data) {
        categoriesRef.current = data
        // Auto-select "generelt" category
        const generelt = data.find((c) => c.slug === 'generelt')
        if (generelt && !state.categoryId) {
          dispatch({ type: 'SET_CATEGORY', payload: generelt.id })
        }
      }
    }
    loadCategories()
  }, [supabase, state.categoryId])

  // Auto-select "arrangement" category when type is event
  useEffect(() => {
    if (state.type === 'event') {
      const arrangement = categoriesRef.current.find((c) => c.slug === 'arrangement')
      if (arrangement) {
        dispatch({ type: 'SET_CATEGORY', payload: arrangement.id })
      }
    }
  }, [state.type])

  // Auto-save draft to database
  useEffect(() => {
    if (!state.isDirty || !userId) return

    // Don't auto-save if there's nothing to save
    if (!state.title && !state.content && state.media.length === 0) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVING_DRAFT', payload: true })

      try {
        const { data: draftId, error } = await supabase.rpc('save_post_draft', {
          p_draft_id: state.draftId || null,
          p_title: state.title || null,
          p_content: state.content || null,
          p_post_type: state.type,
          p_visibility: state.visibility,
          p_category_id: state.categoryId || null,
          p_event_date: state.eventDate || null,
          p_event_time: state.eventTime || null,
          p_event_end_time: state.eventEndTime || null,
          p_event_location: state.eventLocation || null,
          p_language_area_id: state.geography?.type === 'language_area' ? state.geography.id : null,
          p_municipality_id: state.geography?.type === 'municipality' ? state.geography.id : null,
          p_place_id: state.geography?.type === 'place' ? state.geography.id : null,
          p_group_id: state.groupId || null,
          p_community_id: state.communityId || null,
          p_media: state.media.filter((m) => m.url).map((m) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            sortOrder: m.sortOrder,
          })),
          p_selected_circles: state.selectedCircles,
        })

        if (error) {
          console.error('Auto-save error:', error)
          dispatch({ type: 'SET_SAVING_DRAFT', payload: false })
        } else if (draftId) {
          dispatch({
            type: 'SET_DRAFT_SAVED',
            payload: { draftId: draftId as string, savedAt: new Date() },
          })
        }
      } catch (err) {
        console.error('Auto-save error:', err)
        dispatch({ type: 'SET_SAVING_DRAFT', payload: false })
      }
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [
    state.isDirty,
    state.title,
    state.content,
    state.media,
    state.type,
    state.visibility,
    state.categoryId,
    state.eventDate,
    state.eventTime,
    state.eventEndTime,
    state.eventLocation,
    state.geography,
    state.groupId,
    state.communityId,
    state.selectedCircles,
    state.draftId,
    supabase,
    userId,
  ])

  // Setters
  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', payload: title })
  }, [])

  const setContent = useCallback((content: string, mentions: MentionData[]) => {
    const hashtags = extractHashtags(content)
    dispatch({ type: 'SET_CONTENT', payload: { content, mentions, hashtags } })
  }, [])

  const setPostType = useCallback((type: 'standard' | 'event') => {
    dispatch({ type: 'SET_POST_TYPE', payload: type })
  }, [])

  const setVisibility = useCallback((visibility: PostVisibility, circles: string[] = []) => {
    dispatch({ type: 'SET_VISIBILITY', payload: { visibility, circles } })
  }, [])

  const setCategory = useCallback((categoryId: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: categoryId })
  }, [])

  const setEventDetails = useCallback(
    (details: { date?: string; time?: string; endTime?: string; location?: string }) => {
      dispatch({ type: 'SET_EVENT_DETAILS', payload: details })
    },
    []
  )

  const setGeography = useCallback((geography: GeographySelection | null) => {
    dispatch({ type: 'SET_GEOGRAPHY', payload: geography })
  }, [])

  const setPoll = useCallback((poll: PollData | null) => {
    dispatch({ type: 'SET_POLL', payload: poll })
  }, [])

  const setScheduledFor = useCallback((date: Date | null) => {
    dispatch({ type: 'SET_SCHEDULED', payload: date })
  }, [])

  // Media handling
  const addMedia = useCallback(
    async (file: File) => {
      // Validate file type
      const isImage = SUPPORTED_IMAGE_FORMATS.includes(file.type)
      const isVideo = SUPPORTED_VIDEO_FORMATS.includes(file.type)

      if (!isImage && !isVideo) {
        dispatch({ type: 'SET_ERROR', payload: 'Filtypen støttes ikke' })
        return null
      }

      // Check limits
      if (isImage && state.media.filter((m) => m.type === 'image').length >= config.maxImagesPerPost) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Maks ${config.maxImagesPerPost} bilder per innlegg`,
        })
        return null
      }

      if (isVideo && state.media.some((m) => m.type === 'video')) {
        dispatch({ type: 'SET_ERROR', payload: 'Kun én video per innlegg' })
        return null
      }

      // Check file size - get settings from MediaService
      if (isImage) {
        try {
          const settings = await MediaService.getSettings()
          const maxSizeBytes = settings.maxFileSizeMb * 1024 * 1024

          if (file.size > maxSizeBytes) {
            dispatch({
              type: 'SET_ERROR',
              payload: `Bildet er for stort (maks ${settings.maxFileSizeMb} MB)`
            })
            return null
          }
        } catch (error) {
          console.error('Failed to get media settings:', error)
          // Fallback to default 20MB if settings fetch fails
          if (file.size > 20 * 1024 * 1024) {
            dispatch({ type: 'SET_ERROR', payload: 'Bildet er for stort (maks 20 MB)' })
            return null
          }
        }
      }

      if (isVideo && file.size > config.maxVideoSize * 1024 * 1024) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Videoen er for stor (maks ${config.maxVideoSize} MB)`,
        })
        return null
      }

      const id = crypto.randomUUID()
      const mediaItem: MediaItem = {
        id,
        type: isImage ? 'image' : 'video',
        file,
        sortOrder: state.media.length,
        // Don't set uploadProgress yet - it will be set when upload actually starts
        uploadProgress: undefined,
      }

      dispatch({ type: 'ADD_MEDIA', payload: mediaItem })

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      dispatch({
        type: 'UPDATE_MEDIA',
        payload: { id, updates: { thumbnailUrl: previewUrl } },
      })

      return id
    },
    [state.media, config.maxImagesPerPost, config.maxVideoSize]
  )

  const removeMedia = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MEDIA', payload: id })
  }, [])

  // Add GIF from Tenor
  const addGif = useCallback(
    (url: string, preview: string, width: number, height: number) => {
      const id = crypto.randomUUID()
      const gifMedia: MediaItem = {
        id,
        type: 'gif',
        url,
        thumbnailUrl: preview,
        width,
        height,
        sortOrder: state.media.length,
        uploadProgress: 100, // GIFs are already hosted
      }
      dispatch({ type: 'ADD_MEDIA', payload: gifMedia })
    },
    [state.media.length]
  )

  const reorderMedia = useCallback((media: MediaItem[]) => {
    dispatch({ type: 'REORDER_MEDIA', payload: media })
  }, [])

  const updateMedia = useCallback((id: string, updates: Partial<MediaItem>) => {
    dispatch({ type: 'UPDATE_MEDIA', payload: { id, updates } })
  }, [])

  const updateMediaCaption = useCallback((id: string, caption: string) => {
    dispatch({ type: 'UPDATE_MEDIA_CAPTION', payload: { id, caption } })
  }, [])

  // Upload media
  const uploadMedia = useCallback(
    async (mediaItem: MediaItem): Promise<string | null> => {
      // Use editedFile if available (from image editor), otherwise original file
      const fileToUpload = mediaItem.editedFile || mediaItem.file
      if (!fileToUpload) return null

      try {
        if (mediaItem.type === 'image') {
          // Set initial upload progress to 1% to show upload has started
          dispatch({
            type: 'UPDATE_MEDIA',
            payload: { id: mediaItem.id, updates: { uploadProgress: 1 } },
          })

          // Compress and upload image with progress tracking
          const compressed = await compressPostImage(fileToUpload)

          // After compression, set to 10%
          dispatch({
            type: 'UPDATE_MEDIA',
            payload: { id: mediaItem.id, updates: { uploadProgress: 10 } },
          })

          const fileName = `${userId}-${Date.now()}-${mediaItem.id}.jpg`
          const filePath = `post-images/${fileName}`

          // Use XMLHttpRequest for progress tracking
          const publicUrl = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest()

            // Track upload progress (10% - 100%)
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                // Map 0-100% upload to 10-100% overall progress (since compression was 0-10%)
                const uploadPercent = Math.round((event.loaded / event.total) * 100)
                const overallPercent = 10 + Math.round(uploadPercent * 0.9)

                dispatch({
                  type: 'UPDATE_MEDIA',
                  payload: { id: mediaItem.id, updates: { uploadProgress: overallPercent } },
                })
              }
            })

            // Handle completion
            xhr.addEventListener('load', async () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Get public URL after successful upload
                const {
                  data: { publicUrl },
                } = supabase.storage.from('images').getPublicUrl(filePath)

                dispatch({
                  type: 'UPDATE_MEDIA',
                  payload: { id: mediaItem.id, updates: { url: publicUrl, uploadProgress: 100 } },
                })

                resolve(publicUrl)
              } else {
                reject(new Error('Kunne ikke laste opp bilde'))
              }
            })

            // Handle errors
            xhr.addEventListener('error', () => {
              reject(new Error('Nettverksfeil under bildeopplasting'))
            })

            xhr.addEventListener('abort', () => {
              reject(new Error('Bildeopplasting avbrutt'))
            })

            // Get upload URL from Supabase
            supabase.storage
              .from('images')
              .createSignedUploadUrl(filePath)
              .then(({ data, error }) => {
                if (error || !data) {
                  reject(error || new Error('Kunne ikke opprette upload-URL'))
                  return
                }

                // Start upload
                xhr.open('PUT', data.signedUrl)
                xhr.setRequestHeader('Content-Type', compressed.type)
                xhr.send(compressed)
              })
              .catch(reject)
          })

          return publicUrl
        } else if (mediaItem.type === 'video') {
          // Upload to Bunny Stream
          // Step 1: Create video object
          const createResponse = await fetch('/api/video/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Video - ${Date.now()}`,
              fileSize: fileToUpload.size,
            }),
          })

          if (!createResponse.ok) {
            const error = await createResponse.json()
            throw new Error(error.error || 'Kunne ikke opprette video')
          }

          const videoData = await createResponse.json()

          // Step 2: Upload video binary with progress tracking
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest()

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                dispatch({
                  type: 'UPDATE_MEDIA',
                  payload: { id: mediaItem.id, updates: { uploadProgress: percentComplete } },
                })
              }
            })

            // Handle completion
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                dispatch({
                  type: 'UPDATE_MEDIA',
                  payload: {
                    id: mediaItem.id,
                    updates: {
                      url: videoData.playbackUrl,
                      thumbnailUrl: videoData.thumbnailUrl,
                      bunnyVideoId: videoData.videoId,
                      bunnyLibraryId: videoData.libraryId,
                      hlsUrl: videoData.hlsUrl,
                      uploadProgress: 100,
                    },
                  },
                })
                resolve()
              } else {
                reject(new Error('Kunne ikke laste opp video'))
              }
            })

            // Handle errors
            xhr.addEventListener('error', () => {
              reject(new Error('Nettverksfeil under videoopplasting'))
            })

            xhr.addEventListener('abort', () => {
              reject(new Error('Videoopplasting avbrutt'))
            })

            // Start upload
            xhr.open('PUT', `/api/video/upload?videoId=${videoData.videoId}`)
            xhr.send(fileToUpload)
          })

          // Step 3: Poll for transcoding status
          // Show "processing" status while transcoding
          dispatch({
            type: 'UPDATE_MEDIA',
            payload: {
              id: mediaItem.id,
              updates: { uploadProgress: undefined, isProcessing: true },
            },
          })

          // Poll every 5 seconds for transcoding status
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`/api/video/upload?videoId=${videoData.videoId}`)
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()

                // Status 4 = finished transcoding
                if (statusData.isReady || statusData.status === 4) {
                  clearInterval(pollInterval)
                  dispatch({
                    type: 'UPDATE_MEDIA',
                    payload: { id: mediaItem.id, updates: { isProcessing: false } },
                  })
                }
              }
            } catch (err) {
              // Ignore polling errors, video will still work eventually
              console.error('Status polling error:', err)
            }
          }, 5000)

          // Stop polling after 5 minutes (transcoding should be done by then)
          setTimeout(() => {
            clearInterval(pollInterval)
            dispatch({
              type: 'UPDATE_MEDIA',
              payload: { id: mediaItem.id, updates: { isProcessing: false } },
            })
          }, 300000)

          return videoData.playbackUrl
        }

        return null
      } catch (error) {
        console.error('Upload error:', error)
        dispatch({
          type: 'UPDATE_MEDIA',
          payload: { id: mediaItem.id, updates: { uploadError: 'Opplasting feilet' } },
        })
        return null
      }
    },
    [supabase, userId]
  )

  // Submit post
  const submit = useCallback(async () => {
    if (!userId) {
      dispatch({ type: 'SET_ERROR', payload: 'Du må være logget inn' })
      return null
    }

    if (!state.title.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Tittel er påkrevd' })
      return null
    }

    if (!state.content.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Innhold er påkrevd' })
      return null
    }

    if (state.type === 'event') {
      if (!state.eventDate || !state.eventTime || !state.eventLocation) {
        dispatch({ type: 'SET_ERROR', payload: 'Arrangement krever dato, tid og sted' })
        return null
      }
      // 🔧 Fix: Require geography for physical events (database constraint)
      if (!state.geography || (!state.geography.id)) {
        dispatch({ type: 'SET_ERROR', payload: 'Arrangement krever geografisk plassering (velg sted eller kommune)' })
        return null
      }
    }

    dispatch({ type: 'SET_SUBMITTING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Upload all media and track metadata
      const mediaUrls: string[] = []
      const uploadedMedia: Array<{
        type: 'image' | 'video' | 'gif'
        url: string
        thumbnailUrl?: string
        width?: number
        height?: number
        sortOrder: number
      }> = []

      for (const media of state.media) {
        if (media.file && !media.url) {
          const url = await uploadMedia(media)
          if (url) {
            mediaUrls.push(url)
            uploadedMedia.push({
              type: media.type,
              url,
              thumbnailUrl: media.thumbnailUrl,
              width: media.width,
              height: media.height,
              sortOrder: media.sortOrder,
            })
          }
        } else if (media.url) {
          mediaUrls.push(media.url)
          uploadedMedia.push({
            type: media.type,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            width: media.width,
            height: media.height,
            sortOrder: media.sortOrder,
          })
        }
      }

      // Process content for mentions
      let processedContent = state.content
      for (const mention of state.mentions) {
        const simplePattern = new RegExp(`@${mention.name}(?![\\w])`, 'g')
        processedContent = processedContent.replace(
          simplePattern,
          `@[${mention.name}](${mention.type}:${mention.id})`
        )
      }

      // Create post
      const postData = {
        user_id: userId,
        category_id: state.categoryId || null,
        type: state.type,
        visibility: state.visibility,
        title: state.title,
        content: processedContent,
        image_url: mediaUrls[0] || null, // Primary image for backwards compatibility
        event_date: state.type === 'event' ? state.eventDate : null,
        event_time: state.type === 'event' ? state.eventTime : null,
        event_end_time: state.type === 'event' && state.eventEndTime ? state.eventEndTime : null,
        event_location: state.type === 'event' ? state.eventLocation : null,
        is_digital: state.type === 'event' ? false : null, // 🔧 Fix: Default events to physical
        language_area_id: state.geography?.type === 'language_area' ? state.geography.id : null,
        municipality_id: state.geography?.type === 'municipality' ? state.geography.id : null,
        place_id: state.geography?.type === 'place' ? state.geography.id : null,
        created_for_community_id: state.communityId || null,
        scheduled_for: state.scheduledFor?.toISOString() || null,
      }

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert(postData)
        .select('id')
        .single()

      if (error) throw error

      // Set circle visibility if needed
      if (state.visibility === 'circles' && state.selectedCircles.length > 0 && newPost) {
        await setPostCircleVisibility(newPost.id, state.selectedCircles)
      }

      // Save mentions
      if (state.mentions.length > 0 && newPost) {
        const mentionsData = state.mentions.map((m) => ({ type: m.type, id: m.id }))
        await supabase.rpc('save_post_mentions', {
          p_post_id: newPost.id,
          p_mentions: mentionsData,
        })

        // Send notifications
        for (const mention of state.mentions) {
          if (mention.type === 'user') {
            await supabase.rpc('create_mention_notification', {
              p_actor_id: userId,
              p_mentioned_user_id: mention.id,
              p_post_id: newPost.id,
            })
          } else if (mention.type === 'community') {
            await supabase.rpc('notify_community_followers_on_mention', {
              p_actor_id: userId,
              p_community_id: mention.id,
              p_post_id: newPost.id,
            })
          }
        }
      }

      // Save hashtags to post_hashtags table
      if (state.hashtags.length > 0 && newPost) {
        const { error: hashtagError } = await supabase.rpc('save_post_hashtags', {
          p_post_id: newPost.id,
          p_hashtags: state.hashtags,
        })

        if (hashtagError) {
          console.error('Error saving hashtags:', hashtagError)
          // Don't fail the whole post, just log the error
        }
      }

      // Save poll if exists
      if (state.poll && state.poll.options.length >= 2 && newPost) {
        const { error: pollError } = await supabase.rpc('create_poll', {
          p_post_id: newPost.id,
          p_question: state.poll.question,
          p_options: state.poll.options.map((opt) => opt.text),
          p_allow_multiple: state.poll.allowMultiple || false,
          p_ends_at: state.poll.expiresAt ? state.poll.expiresAt.toISOString() : null,
        })

        if (pollError) {
          console.error('Error creating poll:', pollError)
          // Don't fail the whole post, just log the error
        }
      }

      // Save images to post_images table
      // Filter to only image types (exclude GIFs and videos)
      const imageUploads = uploadedMedia.filter(m => m.type === 'image')
      if (imageUploads.length > 0 && newPost) {
        const imageInserts = imageUploads.map((media, index) => {
          // Find original media to get caption data (match by URL)
          const originalMedia = state.media.find(m => m.url === media.url)

          return {
            post_id: newPost.id,
            url: media.url,
            thumbnail_url: media.thumbnailUrl || null,
            width: media.width || null,
            height: media.height || null,
            sort_order: index,
            caption: originalMedia?.caption || null,
            title: originalMedia?.title || null,
            alt_text: originalMedia?.alt_text || null,
          }
        })

        const { error: imageError } = await supabase
          .from('post_images')
          .insert(imageInserts)

        if (imageError) {
          console.error('Error saving post images:', imageError)
          // Don't fail the whole post, just log the error
        } else {
          console.log(`✅ Saved ${imageInserts.length} images to post_images table`)
        }
      }

      // Save video to post_videos table (Bunny Stream)
      const videoMedia = state.media.find((m) => m.type === 'video' && m.bunnyVideoId)
      if (videoMedia && newPost) {
        const videoInsert = {
          post_id: newPost.id,
          bunny_video_id: videoMedia.bunnyVideoId!,
          bunny_library_id: videoMedia.bunnyLibraryId!,
          thumbnail_url: videoMedia.thumbnailUrl || null,
          playback_url: videoMedia.url || null,
          hls_url: videoMedia.hlsUrl || null,
          duration: videoMedia.duration || null,
          width: videoMedia.width || null,
          height: videoMedia.height || null,
          file_size: videoMedia.file?.size || null,
          status: 'uploaded', // Will be updated when transcoding completes
        }

        const { error: videoError } = await supabase
          .from('post_videos')
          .insert(videoInsert)

        if (videoError) {
          console.error('Error saving post video:', videoError)
          // Don't fail the whole post, just log the error
        }
      }

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY)

      // Reset state
      dispatch({ type: 'RESET' })
      dispatch({ type: 'SET_SUBMITTING', payload: false })

      // Call success callback
      onSuccess?.()

      return newPost.id
    } catch (error) {
      console.error('Submit error:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Noe gikk galt',
      })
      dispatch({ type: 'SET_SUBMITTING', payload: false })
      return null
    }
  }, [
    userId,
    state,
    supabase,
    uploadMedia,
    onSuccess,
  ])

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    if (defaultGeography) {
      dispatch({ type: 'SET_GEOGRAPHY', payload: defaultGeography })
    }
    if (groupId) {
      dispatch({ type: 'SET_CONTEXT', payload: { groupId } })
    }
    if (communityId) {
      dispatch({ type: 'SET_CONTEXT', payload: { communityId } })
    }
  }, [defaultGeography, groupId, communityId])

  // Clear/delete draft from database
  const clearDraft = useCallback(async () => {
    if (state.draftId) {
      try {
        await supabase.from('post_drafts').delete().eq('id', state.draftId)
      } catch (err) {
        console.error('Error deleting draft:', err)
      }
    }
    reset()
  }, [reset, state.draftId, supabase])

  // Load draft from database
  const loadDraft = useCallback((draft: FullDraftData) => {
    dispatch({ type: 'LOAD_FULL_DRAFT', payload: draft })
  }, [])

  // Validation
  const isValid =
    state.title.trim().length > 0 &&
    state.content.trim().length > 0 &&
    !state.isSubmitting &&
    (state.type !== 'event' ||
      (state.eventDate && state.eventTime && state.eventLocation))

  // Allow submit if media hasn't started uploading yet (uploadProgress = 0)
  // Only block if media is currently uploading (uploadProgress > 0 and < 100)
  const canSubmit = isValid && !state.media.some((m) =>
    m.uploadProgress !== undefined &&
    m.uploadProgress > 0 &&
    m.uploadProgress < 100
  )

  return {
    // State
    state,
    config,
    categories: categoriesRef.current,

    // Computed
    isValid,
    canSubmit,
    hasDraft: !!state.draftId,
    isSavingDraft: state.isSavingDraft,
    lastSavedAt: state.lastSavedAt,

    // Setters
    setTitle,
    setContent,
    setPostType,
    setVisibility,
    setCategory,
    setEventDetails,
    setGeography,
    setPoll,
    setScheduledFor,

    // Media
    addMedia,
    addGif,
    removeMedia,
    reorderMedia,
    updateMedia,
    updateMediaCaption,

    // Actions
    submit,
    reset,
    clearDraft,
    loadDraft,
  }
}

export type UsePostComposerReturn = ReturnType<typeof usePostComposer>
