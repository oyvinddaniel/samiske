'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, FileText, Calendar, Info, PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { GroupHeader } from './GroupHeader'
import { Feed } from '@/components/feed/Feed'
import { CalendarView } from '@/components/calendar/CalendarView'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import type { Group, MemberStatus } from '@/lib/types/groups'

interface GroupFeedViewProps {
  groupId: string
  onClose: () => void
}

export function GroupFeedView({ groupId, onClose }: GroupFeedViewProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('posts')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Fetch group data
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true)

      // Get group data
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) {
        console.error('Error fetching group:', groupError)
        setLoading(false)
        return
      }

      setGroup(groupData)

      // Check membership status
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      if (user) {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('role, status')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .single()

        if (memberData) {
          setUserRole(memberData.role)
          setMemberStatus(memberData.status as MemberStatus)
        }
      }

      setLoading(false)
    }

    fetchGroup()
  }, [groupId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gruppen ble ikke funnet</p>
      </div>
    )
  }

  const canViewContent = memberStatus === 'approved' || group.group_type === 'open'

  return (
    <div>
      {/* Group header */}
      <GroupHeader
        group={group}
        userRole={userRole}
        memberStatus={memberStatus}
        onClose={onClose}
      />

      {/* Create post button - only show for members who can view content */}
      {canViewContent && currentUserId && (
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="posts">
              <FileText className="w-4 h-4" />
              Innlegg
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4" />
              Kalender
            </TabsTrigger>
            <TabsTrigger value="about">
              <Info className="w-4 h-4" />
              Om
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-0">
          <Feed groupId={groupId} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView groupId={groupId} />
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Om {group.name}</h2>

            {group.description ? (
              <p className="text-gray-600 mb-4">{group.description}</p>
            ) : (
              <p className="text-gray-400 italic mb-4">Ingen beskrivelse</p>
            )}

            <div className="space-y-2 text-sm text-gray-500">
              <p>
                <span className="font-medium">Opprettet:</span>{' '}
                {new Date(group.created_at).toLocaleDateString('nb-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p>
                <span className="font-medium">Medlemmer:</span> {group.member_count}
              </p>
              <p>
                <span className="font-medium">Innlegg:</span> {group.post_count || 0}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Post Sheet */}
      {canViewContent && currentUserId && group && (
        <CreatePostSheet
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          userId={currentUserId}
          groupId={group.id}
          onSuccess={() => {
            setShowCreatePost(false)
            window.dispatchEvent(new CustomEvent('post-created'))
          }}
        />
      )}
    </div>
  )
}
