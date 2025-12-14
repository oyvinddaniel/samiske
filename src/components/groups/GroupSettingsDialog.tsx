'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, Check, X, Clock, Loader2, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeographySelector } from '@/components/geography/GeographySelector'
import { createClient } from '@/lib/supabase/client'
import { approveMember, rejectMember } from '@/lib/groups'
import { toast } from 'sonner'
import type { Group, GroupMember } from '@/lib/types/groups'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  pendingMembers: GroupMember[]
  onMembershipChange: () => void
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  group,
  pendingMembers,
  onMembershipChange,
}: GroupSettingsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [existingMemberIds, setExistingMemberIds] = useState<string[]>([])
  const [currentGeography, setCurrentGeography] = useState<{ type: 'municipality' | 'place', id: string, name: string } | null>(null)
  const [savingGeography, setSavingGeography] = useState(false)

  const supabase = createClient()

  // Fetch existing member IDs and geography
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return

      // Fetch members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)

      setExistingMemberIds((members || []).map(m => m.user_id))

      // Fetch current geography association
      const { data: groupPlace } = await supabase
        .from('group_places')
        .select('place_id, municipality_id, place:places(name), municipality:municipalities(name)')
        .eq('group_id', group.id)
        .single()

      if (groupPlace) {
        const placeData = groupPlace.place as { name: string } | { name: string }[] | null
        const municipalityData = groupPlace.municipality as { name: string } | { name: string }[] | null

        if (groupPlace.place_id) {
          const place = Array.isArray(placeData) ? placeData[0] : placeData
          setCurrentGeography({
            type: 'place',
            id: groupPlace.place_id,
            name: place?.name || 'Ukjent sted'
          })
        } else if (groupPlace.municipality_id) {
          const municipality = Array.isArray(municipalityData) ? municipalityData[0] : municipalityData
          setCurrentGeography({
            type: 'municipality',
            id: groupPlace.municipality_id,
            name: municipality?.name || 'Ukjent kommune'
          })
        }
      }
    }

    fetchData()
  }, [open, group.id, supabase])

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)

      try {
        // Query profiles that are NOT already members of the group
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${searchQuery}%`)
          .not('id', 'in', `(${existingMemberIds.length > 0 ? existingMemberIds.join(',') : 'null'})`)
          .limit(10)

        if (error) {
          console.error('Error searching users:', error)
          setSearchResults([])
        } else {
          setSearchResults(data || [])
        }
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, existingMemberIds, supabase])

  // Invite user to group
  const handleInvite = async (userId: string) => {
    setInviting(userId)

    try {
      // For open groups, add directly as member
      // For closed groups, add as pending (or send invite)
      const status = group.group_type === 'open' ? 'approved' : 'approved' // Admin invites = auto-approved

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member',
          status: status,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('Brukeren er allerede medlem')
        } else {
          throw error
        }
      } else {
        toast.success('Bruker lagt til i gruppen')
        setExistingMemberIds(prev => [...prev, userId])
        setSearchResults(prev => prev.filter(p => p.id !== userId))
        onMembershipChange()
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Kunne ikke legge til bruker')
    } finally {
      setInviting(null)
    }
  }

  // Approve pending member
  const handleApprove = async (userId: string) => {
    setProcessing(userId)

    try {
      const success = await approveMember(group.id, userId)
      if (success) {
        toast.success('Medlem godkjent')
        onMembershipChange()
      } else {
        toast.error('Kunne ikke godkjenne medlem')
      }
    } catch (error) {
      console.error('Error approving member:', error)
      toast.error('Kunne ikke godkjenne medlem')
    } finally {
      setProcessing(null)
    }
  }

  // Reject pending member
  const handleReject = async (userId: string) => {
    setProcessing(userId)

    try {
      const success = await rejectMember(group.id, userId)
      if (success) {
        toast.success('Forespørsel avslått')
        onMembershipChange()
      } else {
        toast.error('Kunne ikke avslå forespørsel')
      }
    } catch (error) {
      console.error('Error rejecting member:', error)
      toast.error('Kunne ikke avslå forespørsel')
    } finally {
      setProcessing(null)
    }
  }

  // Save geography association
  const handleSaveGeography = async (geography: { type: 'municipality' | 'place', id: string, name: string } | null) => {
    setSavingGeography(true)

    try {
      // First, delete any existing association
      await supabase
        .from('group_places')
        .delete()
        .eq('group_id', group.id)

      // If a geography is selected, create new association
      if (geography) {
        const { error } = await supabase
          .from('group_places')
          .insert({
            group_id: group.id,
            place_id: geography.type === 'place' ? geography.id : null,
            municipality_id: geography.type === 'municipality' ? geography.id : null,
          })

        if (error) throw error

        toast.success(`Gruppen er nå koblet til ${geography.name}`)
        setCurrentGeography(geography)
      } else {
        toast.success('Geografisk tilknytning fjernet')
        setCurrentGeography(null)
      }
    } catch (error) {
      console.error('Error saving geography:', error)
      toast.error('Kunne ikke lagre geografisk tilknytning')
    } finally {
      setSavingGeography(false)
    }
  }

  // Remove geography association
  const handleRemoveGeography = async () => {
    await handleSaveGeography(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gruppeinnstillinger</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="invite" className="mt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="invite">
              <UserPlus className="w-4 h-4 mr-2" />
              Inviter
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Ventende ({pendingMembers.length})
            </TabsTrigger>
            <TabsTrigger value="geography">
              <MapPin className="w-4 h-4 mr-2" />
              Geografi
            </TabsTrigger>
          </TabsList>

          {/* Invite tab */}
          <TabsContent value="invite" className="mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søk etter brukere..."
                  className="pl-9"
                />
              </div>

              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.full_name || 'Ukjent'}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(user.id)}
                        disabled={inviting === user.id}
                      >
                        {inviting === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Legg til
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Ingen brukere funnet</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Søk etter brukere for å invitere dem</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pending tab */}
          <TabsContent value="pending" className="mt-4">
            {pendingMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Ingen ventende forespørsler</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.user?.full_name || 'Ukjent'}</p>
                      <p className="text-sm text-gray-500">Venter på godkjenning</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(member.user_id)}
                        disabled={processing === member.user_id}
                      >
                        {processing === member.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(member.user_id)}
                        disabled={processing === member.user_id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Geography tab */}
          <TabsContent value="geography" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-medium mb-1">Hvorfor koble til et sted?</p>
                <p>
                  Når gruppen kobles til en kommune eller et sted, vil gruppens innlegg vises i
                  stedets feed. Dette gjør det lettere for folk i området å finne gruppen.
                </p>
              </div>

              {currentGeography ? (
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Koblet til</p>
                      <p className="font-medium">{currentGeography.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentGeography.type === 'place' ? 'Sted' : 'Kommune'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveGeography}
                      disabled={savingGeography}
                    >
                      Fjern
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Gruppens innlegg vises nå i feeden for {currentGeography.name}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600 mb-4">
                    Gruppen er ikke koblet til et geografisk område
                  </p>
                  <p className="text-sm text-gray-500">
                    Gruppens innlegg vises kun inne i gruppen og i medlemmers personlige feed
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">
                  {currentGeography ? 'Endre geografisk tilknytning' : 'Velg geografisk område'}
                </p>
                <GeographySelector
                  value={{
                    municipalityId: currentGeography?.type === 'municipality' ? currentGeography.id : null,
                    placeId: currentGeography?.type === 'place' ? currentGeography.id : null
                  }}
                  onChange={async (value) => {
                    if (value.placeId) {
                      // Fetch place name
                      const { data: place } = await supabase
                        .from('places')
                        .select('name')
                        .eq('id', value.placeId)
                        .single()

                      if (place) {
                        handleSaveGeography({
                          type: 'place',
                          id: value.placeId,
                          name: place.name
                        })
                      }
                    } else if (value.municipalityId) {
                      // Fetch municipality name
                      const { data: municipality } = await supabase
                        .from('municipalities')
                        .select('name')
                        .eq('id', value.municipalityId)
                        .single()

                      if (municipality) {
                        handleSaveGeography({
                          type: 'municipality',
                          id: value.municipalityId,
                          name: municipality.name
                        })
                      }
                    } else {
                      // Both null - remove association
                      handleSaveGeography(null)
                    }
                  }}
                  placeholder="Søk etter kommune eller sted..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
