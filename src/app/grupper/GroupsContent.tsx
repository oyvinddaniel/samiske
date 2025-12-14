'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, FileText, Grid, ArrowLeft, Settings, PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GroupCard, CreateGroupModal, JoinGroupButton, GroupSettingsDialog } from '@/components/groups'
import { Feed } from '@/components/feed/Feed'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { getUserGroups, getGroupBySlug, getGroupMembers, isGroupMember } from '@/lib/groups'
import { createClient } from '@/lib/supabase/client'
import type { Group, UserGroup, GroupMember, MemberStatus } from '@/lib/types/groups'
import { groupTypeLabels, memberRoleLabels } from '@/lib/types/groups'

export function GroupsContent() {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('feed')

  // Selected group state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<GroupMember[]>([])
  const [membership, setMembership] = useState<{
    isMember: boolean
    role: string | null
    status: MemberStatus | null
  }>({ isMember: false, role: null, status: null })
  const [showSettings, setShowSettings] = useState(false)
  const [groupTab, setGroupTab] = useState('posts')
  const [showCreatePost, setShowCreatePost] = useState(false)

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      if (user) {
        const groups = await getUserGroups(user.id)
        setUserGroups(groups)
      }

      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('group_type', ['open', 'closed'])
        .order('member_count', { ascending: false })

      setAllGroups(groups || [])
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  // Fetch group details when selected
  const fetchGroupDetails = useCallback(async (group: Group) => {
    if (!currentUserId) return

    const membershipData = await isGroupMember(group.id)
    setMembership(membershipData)

    if (membershipData.role === 'admin' || membershipData.role === 'moderator') {
      const pending = await getGroupMembers(group.id, 'pending')
      setPendingMembers(pending)
    }

    const approved = await getGroupMembers(group.id, 'approved')
    setGroupMembers(approved)
  }, [currentUserId])

  // Handle group selection
  const handleSelectGroup = async (group: Group) => {
    setSelectedGroup(group)
    setGroupTab('posts')
    await fetchGroupDetails(group)
  }

  // Handle back to groups list
  const handleBackToGroups = () => {
    setSelectedGroup(null)
    setGroupMembers([])
    setPendingMembers([])
    setMembership({ isMember: false, role: null, status: null })
  }

  // Refresh group data
  const refreshGroupData = async () => {
    if (selectedGroup) {
      // Refetch the group data
      const updatedGroup = await getGroupBySlug(selectedGroup.slug)
      if (updatedGroup) {
        setSelectedGroup(updatedGroup)
        await fetchGroupDetails(updatedGroup)
      }
    }
    // Also refresh user groups
    if (currentUserId) {
      const groups = await getUserGroups(currentUserId)
      setUserGroups(groups)
    }
  }

  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const userGroupIds = userGroups.map(g => g.id)
  const discoverGroups = filteredGroups.filter(g => !userGroupIds.includes(g.id))

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="space-y-4 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // If a group is selected, show group content
  if (selectedGroup) {
    const isAdmin = membership.role === 'admin'
    const isModerator = membership.role === 'moderator'
    const canModerate = isAdmin || isModerator
    const canViewContent = selectedGroup.group_type === 'open' || membership.isMember

    return (
      <>
        {/* Back button and header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToGroups}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-xl bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Grupper</h1>
          </div>
        </div>

        {/* Group header card */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              {selectedGroup.image_url ? (
                <img
                  src={selectedGroup.image_url}
                  alt={selectedGroup.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <Users className="w-8 h-8 text-blue-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
                <Badge variant="secondary">
                  {groupTypeLabels[selectedGroup.group_type]}
                </Badge>
              </div>

              {selectedGroup.description && (
                <p className="text-gray-600 mb-3">{selectedGroup.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedGroup.member_count} medlemmer
                </span>
                <span>{selectedGroup.post_count} innlegg</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {currentUserId && (
                <JoinGroupButton
                  groupId={selectedGroup.id}
                  groupType={selectedGroup.group_type}
                  isMember={membership.isMember}
                  memberStatus={membership.status}
                  userRole={membership.role}
                  onStatusChange={refreshGroupData}
                />
              )}

              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Create post button - only show for members who can view content */}
        {canViewContent && currentUserId && membership.isMember && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowCreatePost(true)}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-sm">Nytt innlegg</span>
            </button>
          </div>
        )}

        {/* Group content */}
        {canViewContent ? (
          <Tabs value={groupTab} onValueChange={setGroupTab}>
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="posts">
                  <FileText className="w-4 h-4 mr-1" />
                  Innlegg
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="w-4 h-4 mr-1" />
                  Medlemmer ({selectedGroup.member_count})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="posts" className="mt-0">
              {membership.isMember ? (
                <Feed groupId={selectedGroup.id} hideCreateButton={false} />
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                  <p>Bli medlem for å se og opprette innlegg</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <div className="bg-white rounded-lg border divide-y">
                {groupMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <Avatar>
                      <AvatarImage src={member.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.user?.full_name || 'Ukjent'}</p>
                      <p className="text-sm text-gray-500">
                        {memberRoleLabels[member.role]}
                      </p>
                    </div>
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Ingen medlemmer ennå
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center border">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Lukket gruppe</h3>
            <p className="text-gray-500 mb-4">
              Du må være medlem for å se innholdet i denne gruppen.
            </p>
            {currentUserId && (
              <JoinGroupButton
                groupId={selectedGroup.id}
                groupType={selectedGroup.group_type}
                isMember={false}
                memberStatus={null}
                userRole={null}
                onStatusChange={refreshGroupData}
              />
            )}
          </div>
        )}

        {/* Settings dialog */}
        {isAdmin && (
          <GroupSettingsDialog
            open={showSettings}
            onOpenChange={setShowSettings}
            group={selectedGroup}
            pendingMembers={pendingMembers}
            onMembershipChange={refreshGroupData}
          />
        )}

        {/* Create Post Sheet */}
        {membership.isMember && currentUserId && (
          <CreatePostSheet
            open={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            userId={currentUserId}
            groupId={selectedGroup.id}
            onSuccess={() => {
              setShowCreatePost(false)
              window.dispatchEvent(new CustomEvent('post-created'))
            }}
          />
        )}
      </>
    )
  }

  // Groups list view
  return (
    <>
      {/* Header section - compact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Grupper</h1>
        </div>

        {currentUserId && (
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Opprett</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="feed">
              <FileText className="w-4 h-4" />
              Innlegg fra mine grupper
            </TabsTrigger>
            <TabsTrigger value="mine">
              <Users className="w-4 h-4" />
              Mine grupper
            </TabsTrigger>
            <TabsTrigger value="utforsk">
              <Grid className="w-4 h-4" />
              Utforsk
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Feed tab */}
        <TabsContent value="feed" className="mt-0">
          {!currentUserId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">Logg inn for å se aktivitet fra gruppene dine</p>
              <p className="text-sm text-gray-500">
                Bli med i grupper for å se innlegg og arrangementer her.
              </p>
            </div>
          ) : userGroupIds.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">Du er ikke medlem av noen grupper ennå</p>
              <p className="text-sm text-gray-500 mb-4">
                Utforsk grupper og bli med for å se aktivitet her.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab('utforsk')}
              >
                Utforsk grupper
              </Button>
            </div>
          ) : (
            <Feed
              groupIds={userGroupIds}
              hideCreateButton={true}
            />
          )}
        </TabsContent>

        {/* My groups tab */}
        <TabsContent value="mine" className="mt-0">
          {!currentUserId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Logg inn for å se gruppene dine</p>
            </div>
          ) : userGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">Du er ikke medlem av noen grupper ennå</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('utforsk')}
                >
                  Utforsk grupper
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett gruppe
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  userRole={group.user_role}
                  showType={true}
                  onClick={() => handleSelectGroup(group)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Explore tab */}
        <TabsContent value="utforsk" className="mt-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter grupper..."
              className="pl-9"
            />
          </div>

          {discoverGroups.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {discoverGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => handleSelectGroup(group)}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Ingen grupper funnet for &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-2">Ingen flere grupper å utforske</p>
              {currentUserId && (
                <Button
                  variant="link"
                  onClick={() => setShowCreateModal(true)}
                >
                  Opprett en ny gruppe
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create group modal */}
      {currentUserId && (
        <CreateGroupModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      )}
    </>
  )
}
