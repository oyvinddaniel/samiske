import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileTabs } from '@/components/profile/ProfileTabs'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Find profile by username (we'll use email as username for now)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', username)
    .single()

  if (!profile) {
    notFound()
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader
          userId={profile.id}
          showEditButton={isOwnProfile}
          showNewPostButton={isOwnProfile}
        />

        {/* Profile Tabs */}
        <ProfileTabs
          profileId={profile.id}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  )
}
