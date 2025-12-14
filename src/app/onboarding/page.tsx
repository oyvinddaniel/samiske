import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .single()

  // If already completed, redirect to home
  if (profile?.onboarding_completed) {
    redirect('/')
  }

  return (
    <OnboardingWizard
      userId={user.id}
      userName={profile?.full_name || undefined}
    />
  )
}
