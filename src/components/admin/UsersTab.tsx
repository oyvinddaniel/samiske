'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from './types'
import { getInitials, formatDate } from './utils'

interface UsersTabProps {
  users: User[]
  currentUserId?: string
  onRoleChange: (userId: string, newRole: string) => void
}

export function UsersTab({ users, currentUserId, onRoleChange }: UsersTabProps) {
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

  return (
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
                {user.id === currentUserId ? (
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <span className="text-xs text-gray-400">(deg)</span>
                  </div>
                ) : (
                  <Select
                    value={user.role}
                    onValueChange={(value) => onRoleChange(user.id, value)}
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
  )
}
