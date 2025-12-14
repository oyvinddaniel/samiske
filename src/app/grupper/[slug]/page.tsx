'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, notFound } from 'next/navigation'
import { Users, Settings, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { JoinGroupButton, GroupSettingsDialog } from '@/components/groups'
import { Feed } from '@/components/feed/Feed'
import { getGroupBySlug, getGroupMembers, isGroupMember, approveMember, rejectMember } from '@/lib/groups'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, MemberStatus } from '@/lib/types/groups'
import { groupTypeLabels, memberRoleLabels } from '@/lib/types/groups'

export default function GroupPage() {
  const params = useParams()
  const slug = params.slug as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [pendingMembers, setPendingMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [membership, setMembership] = useState<{
    isMember: boolean
    role: string | null
    status: MemberStatus | null
  }>({ isMember: false, role: null, status: null })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchData = useCallback(async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch group
      const groupData = await getGroupBySlug(slug)
      if (!groupData) {
        setLoading(false)
        return
      }
      setGroup(groupData)

      // Check membership
      if (user) {
        const membershipData = await isGroupMember(groupData.id)
        setMembership(membershipData)

        // If admin/moderator, fetch pending members
        if (membershipData.role === 'admin' || membershipData.role === 'moderator') {
          const pending = await getGroupMembers(groupData.id, 'pending')
          setPendingMembers(pending)
        }
      }

      // Fetch approved members
      const approvedMembers = await getGroupMembers(groupData.id, 'approved')
      setMembers(approvedMembers)

      setLoading(false)
    } catch (error) {
      console.error('Error fetching group data:', error)
      setLoading(false)
    }
  }, [slug, supabase])

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      await fetchData()
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [fetchData])

  const handleApprove = async (userId: string) => {
    if (!group) return
    const success = await approveMember(group.id, userId)
    if (success) {
      fetchData()
    }
  }

  const handleReject = async (userId: string) => {
    if (!group) return
    const success = await rejectMember(group.id, userId)
    if (success) {
      setPendingMembers(prev => prev.filter(m => m.user_id !== userId))
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!group) {
    notFound()
  }

  const isAdmin = membership.role === 'admin'
  const isModerator = membership.role === 'moderator'
  const canModerate = isAdmin || isModerator
  const canViewContent = group.group_type === 'open' || membership.isMember

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Group avatar */}
          <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={group.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Users className="w-8 h-8 text-blue-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <Badge variant="secondary">
                {groupTypeLabels[group.group_type]}
              </Badge>
            </div>

            {group.description && (
              <p className="text-gray-600 mb-3">{group.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {group.member_count} medlemmer
              </span>
              <span>{group.post_count} innlegg</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {currentUserId && (
              <JoinGroupButton
                groupId={group.id}
                groupType={group.group_type}
                isMember={membership.isMember}
                memberStatus={membership.status}
                userRole={membership.role}
                onStatusChange={fetchData}
              />
            )}

            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {canViewContent ? (
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="posts">Innlegg</TabsTrigger>
            <TabsTrigger value="members">
              Medlemmer ({group.member_count})
            </TabsTrigger>
            {canModerate && pendingMembers.length > 0 && (
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="w-3 h-3" />
                Ventende ({pendingMembers.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts">
            {canViewContent ? (
              <Feed groupId={group.id} />
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
                <p>Bli medlem for å se og opprette innlegg</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="bg-white rounded-lg divide-y">
              {members.map(member => (
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
            </div>
          </TabsContent>

          {canModerate && (
            <TabsContent value="pending">
              <div className="bg-white rounded-lg divide-y">
                {pendingMembers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Ingen ventende forespørsler
                  </div>
                ) : (
                  pendingMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-4">
                      <Avatar>
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
                        >
                          Godkjenn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(member.user_id)}
                        >
                          Avslå
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="bg-white rounded-lg p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold mb-2">Lukket gruppe</h2>
          <p className="text-gray-500 mb-4">
            Du må være medlem for å se innholdet i denne gruppen.
          </p>
          {currentUserId && (
            <JoinGroupButton
              groupId={group.id}
              groupType={group.group_type}
              isMember={false}
              memberStatus={null}
              userRole={null}
              onStatusChange={fetchData}
            />
          )}
        </div>
      )}

      {/* Settings Dialog */}
      {isAdmin && group && (
        <GroupSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          group={group}
          pendingMembers={pendingMembers}
          onMembershipChange={fetchData}
        />
      )}
    </div>
  )
}
