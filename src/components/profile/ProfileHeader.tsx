'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Calendar, MessageSquare, Heart, FileText, Settings, Plus, Save, X } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: string
  created_at: string
}

interface UserStats {
  postCount: number
  commentCount: number
  likeCount: number
}

interface ProfileHeaderProps {
  userId: string
  showEditButton?: boolean
  showNewPostButton?: boolean
  onNewPost?: () => void
  isEditing?: boolean
  onEdit?: () => void
  onSave?: (updates: Partial<Profile>) => Promise<void>
  onCancel?: () => void
}

export function ProfileHeader({
  userId,
  showEditButton = true,
  showNewPostButton = false,
  onNewPost,
  isEditing = false,
  onEdit,
  onSave,
  onCancel
}: ProfileHeaderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats>({ postCount: 0, commentCount: 0, likeCount: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, location, role, created_at')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        // Initialize edit form with current profile data
        setEditForm({
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          location: profileData.location || ''
        })
      }

      // Fetch stats
      const [postResult, commentResult, likeResult] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ])

      setStats({
        postCount: postResult.count || 0,
        commentCount: commentResult.count || 0,
        likeCount: likeResult.count || 0,
      })

      setLoading(false)
    }

    fetchProfile()
  }, [userId, supabase])

  // Update edit form when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || ''
      })
    }
  }, [isEditing, profile])

  const handleSaveClick = async () => {
    if (onSave) {
      await onSave(editForm)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'moderator':
        return <Badge variant="secondary">Moderator</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-20 h-20 border-2 border-white shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'Profilbilde'} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              // Edit mode
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Navn</label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Ditt fulle navn"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Lokasjon</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="F.eks. Tromsø, Norge"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bio</label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Fortell litt om deg selv..."
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              // View mode
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">
                    {profile.full_name || 'Ukjent bruker'}
                  </h1>
                  {getRoleBadge(profile.role)}
                </div>

                {profile.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </p>
                )}

                {profile.bio && (
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                    {profile.bio}
                  </p>
                )}

                <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3" />
                  Medlem siden {formatDate(profile.created_at)}
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:items-end">
            {isEditing ? (
              // Edit mode buttons
              <>
                <Button onClick={handleSaveClick} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Lagre
                </Button>
                <Button onClick={onCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Avbryt
                </Button>
              </>
            ) : (
              // View mode buttons
              <>
                {showEditButton && onEdit && (
                  <Button onClick={onEdit} variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Rediger profil
                  </Button>
                )}
                {showEditButton && !onEdit && (
                  <Link href="/profil">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Innstillinger
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.postCount}</p>
            <p className="text-xs text-gray-500">Innlegg</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.commentCount}</p>
            <p className="text-xs text-gray-500">Kommentarer</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
              <Heart className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.likeCount}</p>
            <p className="text-xs text-gray-500">Likes gitt</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
