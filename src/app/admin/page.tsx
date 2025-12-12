'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

interface Post {
  id: string
  title: string
  content: string
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
  created_at: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
  category: {
    name: string
    color: string
  } | null
}

interface Stats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalLikes: number
  totalFeedback: number
}

interface Feedback {
  id: string
  message: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    email: string
  } | null
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalLikes: 0, totalFeedback: 0 })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      // Check if user is logged in and is admin
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setCurrentUser(profile)
      setIsAdmin(true)

      // Fetch all data
      await Promise.all([
        fetchUsers(),
        fetchPosts(),
        fetchFeedback(),
        fetchStats(),
      ])

      setLoading(false)
    }

    checkAdminAndFetchData()
  }, [router, supabase])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
  }

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        type,
        visibility,
        created_at,
        user:profiles!posts_user_id_fkey (
          id,
          full_name,
          email
        ),
        category:categories (
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const formattedPosts = data.map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user
        const categoryData = Array.isArray(post.category) ? post.category[0] : post.category
        return {
          ...post,
          user: userData as Post['user'],
          category: categoryData as Post['category'],
        }
      })
      setPosts(formattedPosts)
    }
  }

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from('feedback')
      .select(`
        id,
        message,
        created_at,
        user:profiles (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (data) {
      const formattedFeedback = data.map((f) => ({
        ...f,
        user: Array.isArray(f.user) ? f.user[0] : f.user,
      }))
      setFeedback(formattedFeedback as Feedback[])
    }
  }

  const fetchStats = async () => {
    const [usersResult, postsResult, commentsResult, likesResult, feedbackResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: usersResult.count || 0,
      totalPosts: postsResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalLikes: likesResult.count || 0,
      totalFeedback: feedbackResult.count || 0,
    })
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    }
  }

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (!error) {
      setPosts(posts.filter((p) => p.id !== postId))
      setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }))
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase.from('feedback').delete().eq('id', feedbackId)

    if (!error) {
      setFeedback(feedback.filter((f) => f.id !== feedbackId))
      setStats((prev) => ({ ...prev, totalFeedback: prev.totalFeedback - 1 }))
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
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: nb,
      })
    } catch {
      return dateString
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-yellow-500">Moderator</Badge>
      default:
        return <Badge variant="outline">Medlem</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="w-48 h-8 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Tilbake til forsiden
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin-panel</h1>
          <p className="text-gray-500 mt-1">Administrer brukere og innhold</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Brukere</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-sm text-gray-500">Innlegg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
              <p className="text-sm text-gray-500">Kommentarer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.totalLikes}</p>
              <p className="text-sm text-gray-500">Likes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Brukere ({users.length})</TabsTrigger>
            <TabsTrigger value="posts">Innlegg ({posts.length})</TabsTrigger>
            <TabsTrigger value="feedback">Tilbakemeldinger ({feedback.length})</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Brukere</CardTitle>
                <CardDescription>Administrer brukerroller og tilganger</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.full_name || 'Ukjent'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Registrert {formatDate(user.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.id === currentUser?.id ? (
                          <div className="flex items-center gap-2">
                            {getRoleBadge(user.role)}
                            <span className="text-xs text-gray-400">(deg)</span>
                          </div>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Medlem</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Innlegg</CardTitle>
                <CardDescription>Moderer og administrer innlegg</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Ingen innlegg ennå</p>
                  ) : (
                    posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/innlegg/${post.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 truncate"
                            >
                              {post.title}
                            </Link>
                            {post.category && (
                              <Badge
                                style={{ backgroundColor: post.category.color, color: 'white' }}
                                className="text-xs"
                              >
                                {post.category.name}
                              </Badge>
                            )}
                            {post.visibility === 'members' && (
                              <Badge variant="outline" className="text-xs">
                                Kun medlemmer
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{post.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Av {post.user.full_name || post.user.email} • {formatDate(post.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/innlegg/${post.id}`}>
                            <Button variant="outline" size="sm">
                              Vis
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Slett
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett innlegg?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette dette innlegget? Dette kan ikke
                                  angres.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePost(post.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Slett
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Tilbakemeldinger</CardTitle>
                <CardDescription>Se hva brukerne savner og ønsker seg</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Ingen tilbakemeldinger ennå</p>
                  ) : (
                    feedback.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 whitespace-pre-wrap">{item.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {item.user ? (
                              <>Fra {item.user.full_name || item.user.email}</>
                            ) : (
                              <>Anonym</>
                            )}
                            {' • '}
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                        <div className="ml-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Slett
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slett tilbakemelding?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette denne tilbakemeldingen?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFeedback(item.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Slett
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
