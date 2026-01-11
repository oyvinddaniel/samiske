/**
 * Diagnostic function to check profile data
 * Run in browser console: window.checkProfileData()
 */
import { createClient } from '@/lib/supabase/client'

export async function diagnosticProfileData() {
  const supabase = createClient()

  console.log('🔍 === PROFILE DIAGNOSTIC START ===')

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('❌ Not logged in')
    return
  }

  console.log('✅ Logged in as:', user.id)

  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('❌ Error fetching profile:', error)
    return
  }

  console.log('📋 Full profile data:', profile)
  console.log('\n--- NEW FIELDS ---')
  console.log('username:', profile.username)
  console.log('tagline:', profile.tagline)
  console.log('cover_image_url:', profile.cover_image_url)
  console.log('avatar_status_color:', profile.avatar_status_color)
  console.log('social_links:', profile.social_links)
  console.log('interests:', profile.interests)

  console.log('\n--- IMAGE CHECK ---')
  if (profile.cover_image_url) {
    console.log('✅ Cover image exists!')
    console.log('URL:', profile.cover_image_url)

    // Test if image is accessible
    try {
      const response = await fetch(profile.cover_image_url, { method: 'HEAD' })
      if (response.ok) {
        console.log('✅ Cover image is accessible (HTTP', response.status, ')')
      } else {
        console.error('❌ Cover image returned HTTP', response.status)
      }
    } catch (e) {
      console.error('❌ Error fetching cover image:', e)
    }
  } else {
    console.warn('⚠️  No cover_image_url set')
  }

  console.log('\n🔍 === PROFILE DIAGNOSTIC END ===')
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).checkProfileData = diagnosticProfileData
}
