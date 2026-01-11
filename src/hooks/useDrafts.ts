'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostVisibility } from '@/lib/types/circles'

export interface DraftMedia {
  id: string
  type: 'image' | 'video' | 'gif'
  url?: string
  thumbnailUrl?: string
  sortOrder: number
}

export interface Draft {
  id: string
  title: string | null
  content: string | null
  postType: 'standard' | 'event'
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
  media: DraftMedia[]
  selectedCircles: string[]
  lastSavedAt: string
  createdAt: string
}

interface DraftData {
  title?: string
  content?: string
  postType?: 'standard' | 'event'
  visibility?: PostVisibility
  categoryId?: string | null
  eventDate?: string | null
  eventTime?: string | null
  eventEndTime?: string | null
  eventLocation?: string | null
  languageAreaId?: string | null
  municipalityId?: string | null
  placeId?: string | null
  groupId?: string | null
  communityId?: string | null
  media?: DraftMedia[]
  selectedCircles?: string[]
}

interface UseDraftsOptions {
  autoSaveInterval?: number // ms, default 3000
  maxDrafts?: number // default 10
}

export function useDrafts(options: UseDraftsOptions = {}) {
  const { autoSaveInterval = 3000, maxDrafts = 10 } = options

  const [drafts, setDrafts] = useState<Draft[]>([])
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const supabase = createClient()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = useRef<DraftData | null>(null)

  // Load drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_user_drafts', {
          p_limit: maxDrafts,
        })

        if (error) {
          console.error('Error loading drafts:', error)
          return
        }

        const mappedDrafts: Draft[] = (data || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          title: d.title as string | null,
          content: d.content as string | null,
          postType: (d.post_type as string) as 'standard' | 'event',
          visibility: (d.visibility as string) as PostVisibility,
          categoryId: d.category_id as string | null,
          eventDate: d.event_date as string | null,
          eventTime: d.event_time as string | null,
          eventEndTime: d.event_end_time as string | null,
          eventLocation: d.event_location as string | null,
          languageAreaId: d.language_area_id as string | null,
          municipalityId: d.municipality_id as string | null,
          placeId: d.place_id as string | null,
          groupId: d.group_id as string | null,
          communityId: d.community_id as string | null,
          media: (d.media as DraftMedia[]) || [],
          selectedCircles: (d.selected_circles as string[]) || [],
          lastSavedAt: d.last_saved_at as string,
          createdAt: d.created_at as string,
        }))

        setDrafts(mappedDrafts)

        // Auto-select most recent draft if exists
        if (mappedDrafts.length > 0) {
          setCurrentDraftId(mappedDrafts[0].id)
        }
      } catch (err) {
        console.error('Error loading drafts:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDrafts()
  }, [supabase, maxDrafts])

  // Save draft to database
  const saveDraft = useCallback(
    async (data: DraftData, draftId?: string | null): Promise<string | null> => {
      setIsSaving(true)
      try {
        const { data: result, error } = await supabase.rpc('save_post_draft', {
          p_draft_id: draftId || null,
          p_title: data.title || null,
          p_content: data.content || null,
          p_post_type: data.postType || 'standard',
          p_visibility: data.visibility || 'public',
          p_category_id: data.categoryId || null,
          p_event_date: data.eventDate || null,
          p_event_time: data.eventTime || null,
          p_event_end_time: data.eventEndTime || null,
          p_event_location: data.eventLocation || null,
          p_language_area_id: data.languageAreaId || null,
          p_municipality_id: data.municipalityId || null,
          p_place_id: data.placeId || null,
          p_group_id: data.groupId || null,
          p_community_id: data.communityId || null,
          p_media: data.media || [],
          p_selected_circles: data.selectedCircles || [],
        })

        if (error) {
          console.error('Error saving draft:', error)
          return null
        }

        const savedDraftId = result as string
        setLastSaved(new Date())

        // Update local state
        if (draftId) {
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === draftId
                ? {
                    ...d,
                    ...data,
                    lastSavedAt: new Date().toISOString(),
                  }
                : d
            )
          )
        } else {
          // New draft - add to list
          const newDraft: Draft = {
            id: savedDraftId,
            title: data.title || null,
            content: data.content || null,
            postType: data.postType || 'standard',
            visibility: data.visibility || 'public',
            categoryId: data.categoryId || null,
            eventDate: data.eventDate || null,
            eventTime: data.eventTime || null,
            eventEndTime: data.eventEndTime || null,
            eventLocation: data.eventLocation || null,
            languageAreaId: data.languageAreaId || null,
            municipalityId: data.municipalityId || null,
            placeId: data.placeId || null,
            groupId: data.groupId || null,
            communityId: data.communityId || null,
            media: data.media || [],
            selectedCircles: data.selectedCircles || [],
            lastSavedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
          setDrafts((prev) => [newDraft, ...prev].slice(0, maxDrafts))
          setCurrentDraftId(savedDraftId)
        }

        return savedDraftId
      } catch (err) {
        console.error('Error saving draft:', err)
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [supabase, maxDrafts]
  )

  // Auto-save with debounce
  const autoSave = useCallback(
    (data: DraftData) => {
      pendingDataRef.current = data

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          saveDraft(pendingDataRef.current, currentDraftId)
          pendingDataRef.current = null
        }
      }, autoSaveInterval)
    },
    [saveDraft, currentDraftId, autoSaveInterval]
  )

  // Delete draft
  const deleteDraft = useCallback(
    async (draftId: string): Promise<boolean> => {
      try {
        const { error } = await supabase.from('post_drafts').delete().eq('id', draftId)

        if (error) {
          console.error('Error deleting draft:', error)
          return false
        }

        setDrafts((prev) => prev.filter((d) => d.id !== draftId))

        if (currentDraftId === draftId) {
          setCurrentDraftId(null)
        }

        return true
      } catch (err) {
        console.error('Error deleting draft:', err)
        return false
      }
    },
    [supabase, currentDraftId]
  )

  // Select a draft
  const selectDraft = useCallback((draftId: string | null) => {
    setCurrentDraftId(draftId)
  }, [])

  // Get current draft
  const currentDraft = drafts.find((d) => d.id === currentDraftId) || null

  // Create new draft
  const createNewDraft = useCallback(() => {
    setCurrentDraftId(null)
    setLastSaved(null)
  }, [])

  // Clear pending auto-save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    // State
    drafts,
    currentDraft,
    currentDraftId,
    isLoading,
    isSaving,
    lastSaved,

    // Actions
    saveDraft,
    autoSave,
    deleteDraft,
    selectDraft,
    createNewDraft,
  }
}

export type UseDraftsReturn = ReturnType<typeof useDrafts>
