// Admin types
import type { BugReportWithUser } from '@/lib/types/bug-reports'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export interface Post {
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

export interface Stats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  totalLikes: number
  totalFeedback: number
  totalBugReports: number
}

export interface Feedback {
  id: string
  message: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    email: string
  } | null
}

export interface Report {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: {
    id: string
    full_name: string | null
    email: string
  } | null
  post: {
    id: string
    title: string
  } | null
}

export type { BugReportWithUser }
