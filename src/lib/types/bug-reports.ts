export type BugReportCategory = 'bug' | 'improvement' | 'question' | 'other'
export type BugReportPriority = 'low' | 'medium' | 'high' | 'critical'
export type BugReportStatus = 'new' | 'in_progress' | 'resolved' | 'dismissed'

export interface BugReport {
  id: string
  user_id: string | null
  category: BugReportCategory
  title: string
  description: string
  url: string | null
  user_agent: string | null
  screen_size: string | null
  screenshot_url: string | null
  priority: BugReportPriority
  status: BugReportStatus
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
}

export interface BugReportWithUser extends BugReport {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

export interface BugReportFormData {
  category: BugReportCategory
  title: string
  description: string
  screenshot?: File
}

export interface BugReportContextData {
  url: string
  userAgent: string
  screenSize: string
}
