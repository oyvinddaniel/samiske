'use client'

import { MessageSquare, Languages, Building2, MapPin, Check, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import type { Suggestion, LanguageArea, Municipality } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SuggestionsTabProps {
  suggestions: Suggestion[]
  languageAreas: LanguageArea[]
  municipalities: Municipality[]
  supabase: SupabaseClient
  onDataChange: () => void
}

export function SuggestionsTab({
  suggestions,
  languageAreas,
  municipalities,
  supabase,
  onDataChange
}: SuggestionsTabProps) {

  const handleApproveSuggestion = async (suggestion: Suggestion) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('approve_geography_suggestion', {
        p_suggestion_id: suggestion.id,
        p_reviewer_id: user.id,
      })

      if (error) throw error

      const result = data as { success: boolean; message: string; entity_id?: string }

      if (result.success) {
        toast.success(result.message || 'Forslag godkjent og endringer utført')
        onDataChange()
      } else {
        toast.error(result.message || 'Kunne ikke godkjenne forslag')
      }
    } catch (error) {
      console.error('Error approving suggestion:', error)
      toast.error('Kunne ikke godkjenne forslag')
    }
  }

  const handleRejectSuggestion = async (suggestion: Suggestion, adminNotes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('reject_geography_suggestion', {
        p_suggestion_id: suggestion.id,
        p_reviewer_id: user.id,
        p_admin_notes: adminNotes || null,
      })

      if (error) throw error

      const result = data as { success: boolean; message: string }

      if (result.success) {
        toast.success(result.message || 'Forslag avvist')
        onDataChange()
      } else {
        toast.error(result.message || 'Kunne ikke avvise forslag')
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error)
      toast.error('Kunne ikke avvise forslag')
    }
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')
  const reviewedSuggestions = suggestions.filter(s => s.status !== 'pending')

  return (
    <TabsContent value="suggestions" className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {pendingSuggestions.length} ventende forslag
        </p>
      </div>

      {pendingSuggestions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Ingen ventende forslag</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pendingSuggestions.map(suggestion => {
            const entityIcon = suggestion.entity_type === 'language_area' ? (
              <Languages className="w-5 h-5 text-blue-600" />
            ) : suggestion.entity_type === 'municipality' ? (
              <Building2 className="w-5 h-5 text-orange-600" />
            ) : (
              <MapPin className="w-5 h-5 text-purple-600" />
            )

            const suggestionTypeLabel = suggestion.suggestion_type === 'new_item' ? 'Nytt element' :
              suggestion.suggestion_type === 'edit_name' ? 'Navneendring' : 'Tilknytning'

            const entityTypeLabel = suggestion.entity_type === 'language_area' ? 'Språkområde' :
              suggestion.entity_type === 'municipality' ? 'Kommune' : 'Sted'

            return (
              <Card key={suggestion.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">{entityIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                          {suggestionTypeLabel}
                        </span>
                        <span className="text-xs text-gray-500">{entityTypeLabel}</span>
                        <Clock className="w-3 h-3 text-gray-400 ml-auto" />
                        <span className="text-xs text-gray-400">
                          {new Date(suggestion.created_at).toLocaleDateString('nb-NO')}
                        </span>
                      </div>

                      {/* Suggested data */}
                      <div className="bg-white rounded p-3 mb-2 text-sm">
                        {suggestion.suggestion_type === 'new_item' || suggestion.suggestion_type === 'edit_name' ? (
                          <div className="space-y-1">
                            <p>
                              <span className="text-gray-500">Navn:</span>{' '}
                              <strong>{sanitizeHtml(suggestion.suggested_data.name as string)}</strong>
                            </p>
                            {typeof suggestion.suggested_data.name_sami === 'string' && suggestion.suggested_data.name_sami && (
                              <p>
                                <span className="text-gray-500">Samisk:</span>{' '}
                                <strong>{sanitizeHtml(suggestion.suggested_data.name_sami)}</strong>
                              </p>
                            )}
                            {suggestion.current_data && (
                              <p className="text-gray-400 text-xs mt-1">
                                Nåværende: {sanitizeHtml(suggestion.current_data.name as string)}
                                {typeof suggestion.current_data.name_sami === 'string' && suggestion.current_data.name_sami && ` (${sanitizeHtml(suggestion.current_data.name_sami)})`}
                              </p>
                            )}
                          </div>
                        ) : suggestion.suggestion_type === 'edit_relationship' ? (
                          <div className="space-y-1">
                            {suggestion.entity_type === 'municipality' && (
                              <p>
                                <span className="text-gray-500">Språkområder:</span>{' '}
                                <strong>
                                  {(suggestion.suggested_data.language_area_ids as string[])?.map(id => {
                                    const area = languageAreas.find(la => la.id === id)
                                    return area?.name || id
                                  }).join(', ') || 'Ingen'}
                                </strong>
                              </p>
                            )}
                            {suggestion.entity_type === 'place' && (
                              <p>
                                <span className="text-gray-500">Kommune:</span>{' '}
                                <strong>
                                  {municipalities.find(m => m.id === suggestion.suggested_data.municipality_id as string)?.name || 'Ukjent'}
                                </strong>
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* User and reason */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          Fra: {sanitizeHtml(suggestion.user?.full_name || suggestion.user?.email || 'Ukjent bruker')}
                        </p>
                        {suggestion.reason && (
                          <p className="italic">&quot;{sanitizeHtml(suggestion.reason)}&quot;</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveSuggestion(suggestion)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Godkjenn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const notes = prompt('Begrunnelse for avvisning (valgfritt):')
                          handleRejectSuggestion(suggestion, notes || undefined)
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Avvis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* History of reviewed suggestions */}
      {reviewedSuggestions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Behandlede forslag</h3>
          <div className="space-y-2">
            {reviewedSuggestions.slice(0, 10).map(suggestion => (
              <Card key={suggestion.id} className={cn(
                'opacity-75',
                suggestion.status === 'approved' ? 'border-green-200' : 'border-red-200'
              )}>
                <CardContent className="py-2">
                  <div className="flex items-center gap-3 text-sm">
                    {suggestion.status === 'approved' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-gray-600">
                      {suggestion.suggestion_type === 'new_item' ? 'Nytt' :
                       suggestion.suggestion_type === 'edit_name' ? 'Navneendring' : 'Tilknytning'}
                      {': '}
                      {suggestion.suggested_data.name as string || suggestion.entity_type}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {suggestion.reviewed_at && new Date(suggestion.reviewed_at).toLocaleDateString('nb-NO')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  )
}
