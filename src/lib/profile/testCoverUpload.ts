/**
 * Test function to diagnose cover upload issues
 * Open browser console and run: testCoverUpload()
 */
import { createClient } from '@/lib/supabase/client'

export async function testCoverUpload() {
  const supabase = createClient()

  console.log('🔍 Testing cover upload setup...')

  // 1. Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('❌ User not authenticated:', authError)
    return
  }
  console.log('✅ User authenticated:', user.id)

  // 2. Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    console.error('❌ Could not list buckets:', bucketsError)
    return
  }

  const profileCoversBucket = buckets?.find(b => b.id === 'profile-covers')
  if (!profileCoversBucket) {
    console.error('❌ profile-covers bucket not found')
    console.log('Available buckets:', buckets?.map(b => b.id))
    return
  }
  console.log('✅ profile-covers bucket exists:', profileCoversBucket)

  // 3. Try to list files in bucket
  const { data: files, error: listError } = await supabase.storage
    .from('profile-covers')
    .list(user.id)

  if (listError) {
    console.error('❌ Could not list files:', listError)
  } else {
    console.log('✅ Can list files:', files?.length || 0, 'files')
  }

  // 4. Check profile table access
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, cover_image_url')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('❌ Could not read profile:', profileError)
    return
  }
  console.log('✅ Can read profile:', profile)

  // 5. Try a test upload (1x1 transparent PNG)
  console.log('🧪 Testing upload with dummy file...')
  const testFile = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], // PNG header
    'test.png',
    { type: 'image/png' }
  )

  const testPath = `${user.id}/test-${Date.now()}.png`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('profile-covers')
    .upload(testPath, testFile, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadError) {
    console.error('❌ Upload test failed:', uploadError)
    console.log('Error details:', {
      message: uploadError.message,
      statusCode: (uploadError as any).statusCode,
    })
  } else {
    console.log('✅ Upload test successful:', uploadData)

    // Clean up test file
    await supabase.storage.from('profile-covers').remove([testPath])
    console.log('🧹 Cleaned up test file')
  }

  console.log('🎉 Diagnostics complete!')
}

// Make it available globally for testing in console
if (typeof window !== 'undefined') {
  (window as any).testCoverUpload = testCoverUpload
}
