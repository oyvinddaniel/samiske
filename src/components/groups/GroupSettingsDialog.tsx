'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, Check, X, Clock, Loader2, MapPin, Settings, Users, BarChart3, Bell, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { GeographySelector } from '@/components/geography/GeographySelector'
import { MembersManagementTab } from './MembersManagementTab'
import { EditGroupDialog } from './EditGroupDialog'
import { DeleteGroupDialog } from './DeleteGroupDialog'
import { TransferOwnershipDialog } from './TransferOwnershipDialog'
import { GroupStatsTab } from './GroupStatsTab'
import { GroupNotificationSettings } from './GroupNotificationSettings'
import { createClient } from '@/lib/supabase/client'
import { approveMember, rejectMember, getGroupMembers } from '@/lib/groups'
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
  const [currentGeography, setCurrentGeography] = useState<{ type: 'municipality' | 'place' | 'language_area' | 'sapmi', id: string | null, name: string } | null>(null)
  const [savingGeography, setSavingGeography] = useState(false)
  const [languageAreas, setLanguageAreas] = useState<{ id: string, name: string }[]>([])
  const [allMembers, setAllMembers] = useState<GroupMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Sub-dialogs
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)

  const supabase = createClient()

  // Fetch current user and data
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', group.id)

      setExistingMemberIds((members || []).map(m => m.user_id))

      // Get current user's role
      if (user) {
        const userMember = members?.find(m => m.user_id === user.id)
        setCurrentUserRole(userMember?.role || null)
      }

      // Fetch all approved members for management
      const approvedMembers = await getGroupMembers(group.id, 'approved')
      setAllMembers(approvedMembers)

      // Fetch language areas for selection
      const { data: areas } = await supabase
        .from('language_areas')
        .select('id, name')
        .order('name')
      setLanguageAreas(areas || [])

      // Fetch current geography association
      const { data: groupPlace } = await supabase
        .from('group_places')
        .select('place_id, municipality_id, language_area_id, is_sapmi, place:places(name), municipality:municipalities(name), language_area:language_areas(name)')
        .eq('group_id', group.id)
        .single()

      if (groupPlace) {
        const placeData = groupPlace.place as { name: string } | { name: string }[] | null
        const municipalityData = groupPlace.municipality as { name: string } | { name: string }[] | null
        const languageAreaData = groupPlace.language_area as { name: string } | { name: string }[] | null

        if (groupPlace.is_sapmi) {
          setCurrentGeography({
            type: 'sapmi',
            id: null,
            name: 'Hele Sápmi'
          })
        } else if (groupPlace.language_area_id) {
          const area = Array.isArray(languageAreaData) ? languageAreaData[0] : languageAreaData
          setCurrentGeography({
            type: 'language_area',
            id: groupPlace.language_area_id,
            name: area?.name || 'Ukjent språkområde'
          })
        } else if (groupPlace.place_id) {
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
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(10)

        if (error) {
          console.error('Error searching users:', error)
          setSearchResults([])
        } else {
          const filtered = (data || []).filter(user => !existingMemberIds.includes(user.id))
          setSearchResults(filtered)
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

  const handleInvite = async (userId: string) => {
    setInviting(userId)

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'member',
          status: 'approved',
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

  const handleSaveGeography = async (geography: { type: 'municipality' | 'place' | 'language_area' | 'sapmi', id: string | null, name: string } | null) => {
    setSavingGeography(true)

    try {
      await supabase
        .from('group_places')
        .delete()
        .eq('group_id', group.id)

      if (geography) {
        const { error } = await supabase
          .from('group_places')
          .insert({
            group_id: group.id,
            place_id: geography.type === 'place' ? geography.id : null,
            municipality_id: geography.type === 'municipality' ? geography.id : null,
            language_area_id: geography.type === 'language_area' ? geography.id : null,
            is_sapmi: geography.type === 'sapmi',
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

  const isAdmin = currentUserRole === 'admin'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Gruppeinnstillinger</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="flex-1">
            <div className="border-b px-3 py-2">
              <TabsList className="grid grid-cols-4 gap-1.5 h-auto w-full">
                <TabsTrigger value="general" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span>Generelt</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Medlemmer</span>
                </TabsTrigger>
                <TabsTrigger value="invite" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <UserPlus className="w-4 h-4" />
                  <span>Inviter</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-2 py-2 text-xs flex flex-col items-center gap-1 relative">
                  <div className="relative">
                    <Clock className="w-4 h-4" />
                    {pendingMembers.length > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">
                        {pendingMembers.length}
                      </span>
                    )}
                  </div>
                  <span>Ventende</span>
                </TabsTrigger>
                <TabsTrigger value="geography" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>Geografi</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistikk</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="px-2 py-2 text-xs flex flex-col items-center gap-1">
                  <Bell className="w-4 h-4" />
                  <span>Varsler</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="danger" className="px-2 py-2 text-xs flex flex-col items-center gap-1 text-red-600 data-[state=active]:text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Faresone</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="p-4">
                {/* General tab */}
                <TabsContent value="general" className="mt-0">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium mb-2">{group.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {group.description || 'Ingen beskrivelse'}
                      </p>
                      {isAdmin && (
                        <Button onClick={() => setShowEditDialog(true)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Rediger gruppe
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Members tab */}
                <TabsContent value="members" className="mt-0">
                  <MembersManagementTab
                    group={group}
                    members={allMembers}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                    onMembershipChange={() => {
                      onMembershipChange()
                      // Refresh members
                      getGroupMembers(group.id, 'approved').then(setAllMembers)
                    }}
                  />
                </TabsContent>

                {/* Invite tab */}
                <TabsContent value="invite" className="mt-0">
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
                          <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.full_name?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user.full_name || 'Ukjent'}</p>
                            </div>
                            <Button size="sm" onClick={() => handleInvite(user.id)} disabled={inviting === user.id}>
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
                <TabsContent value="pending" className="mt-0">
                  {pendingMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Ingen ventende forespørsler</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.user?.avatar_url || undefined} />
                            <AvatarFallback>{member.user?.full_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{member.user?.full_name || 'Ukjent'}</p>
                            <p className="text-sm text-gray-500">Venter på godkjenning</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(member.user_id)} disabled={processing === member.user_id}>
                              {processing === member.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(member.user_id)} disabled={processing === member.user_id}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Geography tab */}
                <TabsContent value="geography" className="mt-0">
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium mb-1">Hvorfor koble til et sted?</p>
                      <p>Når gruppen kobles til et område, vil gruppens innlegg vises i det områdets feed.</p>
                    </div>

                    {currentGeography ? (
                      <div className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Koblet til</p>
                            <p className="font-medium">{currentGeography.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {currentGeography.type === 'sapmi' ? 'Hele Sápmi' :
                               currentGeography.type === 'language_area' ? 'Språkområde' :
                               currentGeography.type === 'place' ? 'Sted' : 'Kommune'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleSaveGeography(null)} disabled={savingGeography}>
                            Fjern
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center bg-gray-50">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-600">Gruppen er ikke koblet til et geografisk område</p>
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-4">
                      <p className="text-sm font-medium">
                        {currentGeography ? 'Endre geografisk tilknytning' : 'Velg geografisk område'}
                      </p>

                      {/* Sápmi button */}
                      <button
                        onClick={() => handleSaveGeography({ type: 'sapmi', id: null, name: 'Hele Sápmi' })}
                        disabled={savingGeography || currentGeography?.type === 'sapmi'}
                        className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                          <span className="text-white text-lg">🌍</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Hele Sápmi</p>
                          <p className="text-xs text-gray-500">Synlig i hele det samiske området</p>
                        </div>
                      </button>

                      {/* Language areas */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Språkområder</p>
                        <div className="grid grid-cols-2 gap-2">
                          {languageAreas.map(area => (
                            <button
                              key={area.id}
                              onClick={() => handleSaveGeography({ type: 'language_area', id: area.id, name: area.name })}
                              disabled={savingGeography || (currentGeography?.type === 'language_area' && currentGeography?.id === area.id)}
                              className="flex items-center gap-2 p-2 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{area.name.replace(' område', '')}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Municipality/Place selector */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Kommune eller sted</p>
                        <GeographySelector
                          value={{
                            municipalityId: currentGeography?.type === 'municipality' ? currentGeography.id : null,
                            placeId: currentGeography?.type === 'place' ? currentGeography.id : null
                          }}
                          onChange={async (value) => {
                            if (value.placeId) {
                              const { data: place } = await supabase.from('places').select('name').eq('id', value.placeId).single()
                              if (place) handleSaveGeography({ type: 'place', id: value.placeId, name: place.name })
                            } else if (value.municipalityId) {
                              const { data: municipality } = await supabase.from('municipalities').select('name').eq('id', value.municipalityId).single()
                              if (municipality) handleSaveGeography({ type: 'municipality', id: value.municipalityId, name: municipality.name })
                            }
                          }}
                          placeholder="Søk etter kommune eller sted..."
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Stats tab */}
                <TabsContent value="stats" className="mt-0">
                  <GroupStatsTab group={group} />
                </TabsContent>

                {/* Notifications tab */}
                <TabsContent value="notifications" className="mt-0">
                  <GroupNotificationSettings group={group} />
                </TabsContent>

                {/* Danger zone tab */}
                {isAdmin && (
                  <TabsContent value="danger" className="mt-0">
                    <div className="space-y-4">
                      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-medium text-yellow-800">Overfør eierskap</h4>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          Gjør en annen bruker til administrator. Du vil miste administratorrettighetene dine.
                        </p>
                        <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
                          Overfør eierskap
                        </Button>
                      </div>

                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Trash2 className="w-5 h-5 text-red-600" />
                          <h4 className="font-medium text-red-800">Slett gruppe</h4>
                        </div>
                        <p className="text-sm text-red-700 mb-3">
                          Denne handlingen kan ikke angres. Alle innlegg og medlemskap vil bli slettet.
                        </p>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                          Slett gruppe
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <EditGroupDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        group={group}
        onGroupUpdated={onMembershipChange}
      />

      <DeleteGroupDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        group={group}
      />

      <TransferOwnershipDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        group={group}
        members={allMembers}
        currentUserId={currentUserId}
        onOwnershipTransferred={onMembershipChange}
      />
    </>
  )
}
