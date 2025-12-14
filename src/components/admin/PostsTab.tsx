'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { Post } from './types'
import { formatDate } from './utils'

interface PostsTabProps {
  posts: Post[]
  onDeletePost: (postId: string) => void
}

export function PostsTab({ posts, onDeletePost }: PostsTabProps) {
  return (
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
                          onClick={() => onDeletePost(post.id)}
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
  )
}
