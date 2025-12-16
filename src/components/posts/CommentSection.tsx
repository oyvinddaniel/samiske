'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface CommentSectionProps {
  postId: string
  currentUserId?: string
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user:profiles!comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const formattedComments = data.map((comment) => {
        const userData = Array.isArray(comment.user) ? comment.user[0] : comment.user
        return {
          ...comment,
          user: userData as Comment['user'],
        }
      })
      setComments(formattedComments)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !newComment.trim()) return

    setSubmitting(true)

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      fetchComments()
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string, commentUserId: string) => {
    if (!currentUserId) return
    if (!confirm('Er du sikker på at du vil slette denne kommentaren?')) return

    // Verifiser eierskap før sletting
    if (commentUserId !== currentUserId) {
      alert('Du kan ikke slette denne kommentaren')
      return
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      alert('Kunne ikke slette kommentar')
      return
    }

    fetchComments()
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
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: nb,
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Kommentarer ({comments.length})
      </h3>

      {/* Comment form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Skriv en kommentar..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? 'Sender...' : 'Kommenter'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Du må være innlogget for å kommentere.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Ingen kommentarer ennå. Vær den første!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.user.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {getInitials(comment.user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {comment.user.full_name || 'Ukjent'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
                {currentUserId === comment.user.id && (
                  <button
                    onClick={() => handleDelete(comment.id, comment.user.id)}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >
                    Slett
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
