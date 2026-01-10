'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Search, FileText, Grid, X, Settings, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GroupCard, CreateGroupModal, JoinGroupButton, GroupSettingsDialog } from '@/components/groups'
import { Feed } from '@/components/feed/Feed'
import { PostComposerSheet } from '@/components/posts/composer'
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
  const [activeTab, setActiveTab] = useState('utforsk')
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({})

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

  // Fetch pending counts for admin/moderator groups
  const fetchPendingCounts = useCallback(async (groups: UserGroup[]) => {
    const adminModGroups = groups.filter(g => g.user_role === 'admin' || g.user_role === 'moderator')
    if (adminModGroups.length === 0) return

    const counts: Record<string, number> = {}

    // Fetch pending counts for each admin/mod group
    await Promise.all(
      adminModGroups.map(async (group) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('status', 'pending')

        if (count && count > 0) {
          counts[group.id] = count
        }
      })
    )

    setPendingCounts(counts)
  }, [supabase])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      if (user) {
        const groups = await getUserGroups(user.id)
        setUserGroups(groups)
        // Fetch pending counts for admin/mod groups
        await fetchPendingCounts(groups)
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
  }, [supabase, fetchPendingCounts])

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
    // Also refresh user groups and pending counts
    if (currentUserId) {
      const groups = await getUserGroups(currentUserId)
      setUserGroups(groups)
      await fetchPendingCounts(groups)
    }
  }

  const filteredGroups = allGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const userGroupIds = userGroups.map(g => g.id)

  // Group detail view component
  const renderSelectedGroup = () => {
    if (!selectedGroup) return null

    const isAdmin = membership.role === 'admin'
    const canViewContent = selectedGroup.group_type === 'open' || membership.isMember

    return (
      <div className="space-y-4">
        {/* Group header card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            {/* Close button */}
            <button
              onClick={handleBackToGroups}
              className="p-1.5 -ml-1 -mt-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Tilbake til alle grupper"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              {selectedGroup.image_url ? (
                <img
                  src={selectedGroup.image_url}
                  alt={selectedGroup.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <Users className="w-6 h-6 text-blue-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h2 className="text-lg font-bold truncate">{selectedGroup.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {groupTypeLabels[selectedGroup.group_type]}
                </Badge>
              </div>

              {selectedGroup.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{selectedGroup.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {selectedGroup.member_count} medlemmer
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  {selectedGroup.post_count} innlegg
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
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
                  className="h-8 w-8"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pending members alert for admin/mod */}
        {(membership.role === 'admin' || membership.role === 'moderator') && pendingMembers.length > 0 && (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-orange-800">
                {pendingMembers.length} {pendingMembers.length === 1 ? 'forespørsel' : 'forespørsler'} venter
              </p>
              <p className="text-xs text-orange-600">Klikk for å behandle</p>
            </div>
            <Settings className="w-4 h-4 text-orange-500" />
          </button>
        )}

        {/* Group content tabs */}
        {canViewContent ? (
          <>
            {/* Sub-tabs for posts/members */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button
                onClick={() => setGroupTab('posts')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  groupTab === 'posts'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Innlegg
              </button>
              <button
                onClick={() => setGroupTab('members')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  groupTab === 'members'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                Medlemmer ({selectedGroup.member_count})
              </button>

              {/* Create post button - inline with tabs */}
              {membership.isMember && currentUserId && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="ml-auto px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nytt i {selectedGroup.name}</span>
                </button>
              )}
            </div>

            {/* Content */}
            {groupTab === 'posts' ? (
              membership.isMember ? (
                <Feed groupId={selectedGroup.id} hideCreateButton={true} />
              ) : (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                  <p>Bli medlem for å se og opprette innlegg</p>
                </div>
              )
            ) : (
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
            )}
          </>
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
          <PostComposerSheet
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
      </div>
    )
  }

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
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        // Clear selected group when switching tabs
        if (selectedGroup) {
          handleBackToGroups()
        }
      }}>
        <div className="flex justify-center mb-6">
          <TabsList className="h-auto">
            <TabsTrigger value="utforsk" className="gap-1">
              <Grid className="w-4 h-4 flex-shrink-0" />
              <span>Utforsk</span>
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-1">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Mine</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-1 whitespace-normal text-left leading-tight py-1.5 max-w-[120px] sm:max-w-none">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Innlegg fra grupper jeg følger</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Explore tab */}
        <TabsContent value="utforsk" className="mt-0">
          {selectedGroup ? (
            renderSelectedGroup()
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søk etter grupper..."
                  className="pl-9"
                />
              </div>

              {filteredGroups.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredGroups.map(group => {
                    const userGroup = userGroups.find(ug => ug.id === group.id)
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        userRole={userGroup?.user_role}
                        showType={true}
                        pendingCount={pendingCounts[group.id] || 0}
                        onClick={() => handleSelectGroup(group)}
                      />
                    )
                  })}
                </div>
              ) : searchQuery ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">Ingen grupper funnet for &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">Ingen grupper ennå</p>
                  {currentUserId && (
                    <Button
                      variant="link"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Opprett den første gruppen
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* My groups tab */}
        <TabsContent value="mine" className="mt-0">
          {selectedGroup ? (
            renderSelectedGroup()
          ) : !currentUserId ? (
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
                  pendingCount={pendingCounts[group.id] || 0}
                  onClick={() => handleSelectGroup(group)}
                />
              ))}
            </div>
          )}
        </TabsContent>

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
