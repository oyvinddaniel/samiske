/**
 * Media Storage Integration Tests
 * Tester faktiske storage-operasjoner mot Supabase Storage
 *
 * VIKTIG: Disse testene krever en kjørende Supabase-instans
 * Kjør: npx supabase start (hvis lokal database)
 * Eller sett SUPABASE_TEST_URL og SUPABASE_TEST_ANON_KEY
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const MEDIA_BUCKET = 'media'
const shouldRunTests = SUPABASE_URL && SUPABASE_ANON_KEY

describe.skipIf(!shouldRunTests)('Media Storage Integration', () => {
  let supabase: ReturnType<typeof createClient>
  let testFilePaths: string[] = []

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Skipping storage integration tests - no test database configured')
      return
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Verify bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const mediaBucket = buckets?.find(b => b.name === MEDIA_BUCKET)

    if (!mediaBucket) {
      console.warn(`Media bucket "${MEDIA_BUCKET}" does not exist - some tests may fail`)
    }
  })

  afterEach(async () => {
    if (!supabase || testFilePaths.length === 0) return

    // Cleanup test files
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(testFilePaths)

    if (error) {
      console.warn('Failed to cleanup test files:', error.message)
    }

    testFilePaths = []
  })

  describe('file upload operations', () => {
    it('should upload a file to storage', async () => {
      const testPath = `test/integration/${Date.now()}-upload.jpg`
      testFilePaths.push(testPath)

      const fileContent = new Blob(['test image content'], { type: 'image/jpeg' })

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      expect(error).toBeNull()
    })

    it('should fail to upload duplicate file without upsert', async () => {
      const testPath = `test/integration/${Date.now()}-duplicate.jpg`
      testFilePaths.push(testPath)

      const fileContent = new Blob(['test content'], { type: 'image/jpeg' })

      // First upload
      const { error: error1 } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent)

      expect(error1).toBeNull()

      // Second upload without upsert should fail
      const { error: error2 } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent, { upsert: false })

      expect(error2).toBeTruthy()
      expect(error2?.message).toContain('already exists')
    })

    it('should upload with upsert enabled', async () => {
      const testPath = `test/integration/${Date.now()}-upsert.jpg`
      testFilePaths.push(testPath)

      const fileContent1 = new Blob(['version 1'], { type: 'image/jpeg' })
      const fileContent2 = new Blob(['version 2'], { type: 'image/jpeg' })

      // First upload
      const { error: error1 } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent1)

      expect(error1).toBeNull()

      // Second upload with upsert
      const { error: error2 } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent2, { upsert: true })

      expect(error2).toBeNull()
    })

    it('should set correct content type', async () => {
      const testPath = `test/integration/${Date.now()}-content-type.jpg`
      testFilePaths.push(testPath)

      const fileContent = new Blob(['test'], { type: 'image/jpeg' })

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, fileContent, {
          contentType: 'image/jpeg',
        })

      expect(error).toBeNull()

      // Verify by getting public URL (which should work for images)
      const { data } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(testPath)

      expect(data.publicUrl).toContain(testPath)
    })
  })

  describe('file retrieval operations', () => {
    it('should generate public URL', async () => {
      const testPath = `test/integration/${Date.now()}-public-url.jpg`
      testFilePaths.push(testPath)

      // Upload file first
      await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob(['test'], { type: 'image/jpeg' }))

      // Get public URL
      const { data } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(testPath)

      expect(data.publicUrl).toBeTruthy()
      expect(data.publicUrl).toContain(MEDIA_BUCKET)
      expect(data.publicUrl).toContain(testPath)
    })

    it('should list files in directory', async () => {
      const testDir = `test/integration/list-${Date.now()}`
      const testPaths = [
        `${testDir}/file1.jpg`,
        `${testDir}/file2.jpg`,
        `${testDir}/file3.jpg`,
      ]
      testFilePaths.push(...testPaths)

      // Upload test files
      for (const path of testPaths) {
        await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, new Blob(['test'], { type: 'image/jpeg' }))
      }

      // List files
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(testDir)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.length).toBeGreaterThanOrEqual(3)
    })

    it('should download file', async () => {
      const testPath = `test/integration/${Date.now()}-download.jpg`
      testFilePaths.push(testPath)

      const originalContent = 'test download content'

      // Upload
      await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob([originalContent], { type: 'image/jpeg' }))

      // Download
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .download(testPath)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data).toBeInstanceOf(Blob)

      // Verify content
      const text = await data!.text()
      expect(text).toBe(originalContent)
    })
  })

  describe('file deletion operations', () => {
    it('should delete single file', async () => {
      const testPath = `test/integration/${Date.now()}-delete-single.jpg`

      // Upload first
      await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob(['test'], { type: 'image/jpeg' }))

      // Delete
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove([testPath])

      expect(error).toBeNull()

      // Verify deleted (download should fail)
      const { error: downloadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .download(testPath)

      expect(downloadError).toBeTruthy()
    })

    it('should delete multiple files', async () => {
      const testPaths = [
        `test/integration/${Date.now()}-delete1.jpg`,
        `test/integration/${Date.now()}-delete2.jpg`,
        `test/integration/${Date.now()}-delete3.jpg`,
      ]

      // Upload files
      for (const path of testPaths) {
        await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, new Blob(['test'], { type: 'image/jpeg' }))
      }

      // Delete all
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(testPaths)

      expect(error).toBeNull()

      // Verify all deleted
      for (const path of testPaths) {
        const { error: downloadError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .download(path)

        expect(downloadError).toBeTruthy()
      }
    })

    it('should handle deletion of non-existent file gracefully', async () => {
      const nonExistentPath = `test/integration/does-not-exist-${Date.now()}.jpg`

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .remove([nonExistentPath])

      // Supabase doesn't error on non-existent files
      expect(error).toBeNull()
    })
  })

  describe('storage path patterns', () => {
    it('should support user-scoped paths', async () => {
      const userId = 'test-user-123'
      const testPath = `users/${userId}/posts/test-post/image-${Date.now()}.jpg`
      testFilePaths.push(testPath)

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob(['test'], { type: 'image/jpeg' }))

      expect(error).toBeNull()
    })

    it('should support community paths', async () => {
      const testPath = `community/geography/municipality/test-muni/image-${Date.now()}.jpg`
      testFilePaths.push(testPath)

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob(['test'], { type: 'image/jpeg' }))

      expect(error).toBeNull()
    })

    it('should support system paths', async () => {
      const testPath = `system/bug-reports/test-report/screenshot-${Date.now()}.jpg`
      testFilePaths.push(testPath)

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, new Blob(['test'], { type: 'image/jpeg' }))

      expect(error).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should error on invalid bucket', async () => {
      const { error } = await supabase.storage
        .from('non-existent-bucket')
        .upload('test.jpg', new Blob(['test']))

      expect(error).toBeTruthy()
    })

    it('should error on empty file path', async () => {
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload('', new Blob(['test']))

      expect(error).toBeTruthy()
    })

    it('should handle large file uploads', async () => {
      const testPath = `test/integration/${Date.now()}-large.jpg`
      testFilePaths.push(testPath)

      // Create 5MB file
      const largeContent = new Uint8Array(5 * 1024 * 1024)
      const largeFile = new Blob([largeContent], { type: 'image/jpeg' })

      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(testPath, largeFile)

      expect(error).toBeNull()
    })
  })
})

// If tests are skipped, show why
if (!shouldRunTests) {
  console.log('\n⏭️  Skipping storage integration tests')
  console.log('To run these tests, set up a test database and configure:')
  console.log('  - SUPABASE_TEST_URL')
  console.log('  - SUPABASE_TEST_ANON_KEY')
  console.log('Or use local Supabase: npx supabase start\n')
}
