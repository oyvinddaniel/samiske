/**
 * Media Database Integration Tests
 * Tester faktiske database-operasjoner mot Supabase
 *
 * VIKTIG: Disse testene krever en kjørende Supabase-instans med test-data
 * Kjør: npx supabase start (hvis lokal database)
 * Eller sett SUPABASE_TEST_URL og SUPABASE_TEST_ANON_KEY
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const shouldRunTests = SUPABASE_URL && SUPABASE_ANON_KEY

describe.skipIf(!shouldRunTests)('Media Database Integration', () => {
  let supabase: ReturnType<typeof createClient>
  let testUserId: string
  let testMediaIds: string[] = []

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Skipping database integration tests - no test database configured')
      return
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Create test user if needed or get existing test user
    // For integration tests, we assume a test user exists
    testUserId = 'test-user-integration-id'
  })

  afterEach(async () => {
    if (!supabase) return

    // Cleanup test data
    if (testMediaIds.length > 0) {
      await supabase
        .from('media')
        .delete()
        .in('id', testMediaIds)

      testMediaIds = []
    }
  })

  describe('media table operations', () => {
    it('should insert media record', async () => {
      const { data, error } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/integration/test.jpg',
          original_filename: 'test.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          width: 800,
          height: 600,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-post-1',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.storage_path).toBe('test/integration/test.jpg')

      if (data) testMediaIds.push(data.id)
    })

    it('should enforce required fields', async () => {
      const { error } = await supabase
        .from('media')
        .insert({
          // Missing required fields
          storage_path: 'test/incomplete.jpg',
        } as any)

      expect(error).toBeTruthy()
      expect(error?.message).toContain('violates not-null constraint')
    })

    it('should select media by entity', async () => {
      // Insert test records
      const { data: inserted } = await supabase
        .from('media')
        .insert([
          {
            storage_path: 'test/post1-img1.jpg',
            original_filename: 'img1.jpg',
            mime_type: 'image/jpeg',
            file_size: 1024,
            uploaded_by: testUserId,
            original_uploader_id: testUserId,
            entity_type: 'post',
            entity_id: 'test-post-select',
            sort_order: 0,
          },
          {
            storage_path: 'test/post1-img2.jpg',
            original_filename: 'img2.jpg',
            mime_type: 'image/jpeg',
            file_size: 2048,
            uploaded_by: testUserId,
            original_uploader_id: testUserId,
            entity_type: 'post',
            entity_id: 'test-post-select',
            sort_order: 1,
          },
        ])
        .select()

      if (inserted) testMediaIds.push(...inserted.map(m => m.id))

      // Query by entity
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('entity_type', 'post')
        .eq('entity_id', 'test-post-select')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data?.[0].sort_order).toBe(0)
      expect(data?.[1].sort_order).toBe(1)
    })

    it('should soft delete media', async () => {
      // Insert test record
      const { data: inserted } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/to-delete.jpg',
          original_filename: 'delete-me.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-delete-post',
        })
        .select()
        .single()

      if (inserted) testMediaIds.push(inserted.id)

      // Soft delete
      const { error: deleteError } = await supabase
        .from('media')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: testUserId,
          deletion_reason: 'Integration test cleanup',
        })
        .eq('id', inserted!.id)

      expect(deleteError).toBeNull()

      // Verify it's soft deleted
      const { data: deleted } = await supabase
        .from('media')
        .select('*')
        .eq('id', inserted!.id)
        .single()

      expect(deleted?.deleted_at).toBeTruthy()
      expect(deleted?.deleted_by).toBe(testUserId)

      // Verify it doesn't appear in non-deleted queries
      const { data: active } = await supabase
        .from('media')
        .select('*')
        .eq('id', inserted!.id)
        .is('deleted_at', null)

      expect(active).toBeNull()
    })

    it('should update media metadata', async () => {
      // Insert test record
      const { data: inserted } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/to-update.jpg',
          original_filename: 'update-me.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-update-post',
          caption: null,
          alt_text: null,
        })
        .select()
        .single()

      if (inserted) testMediaIds.push(inserted.id)

      // Update metadata
      const { error: updateError } = await supabase
        .from('media')
        .update({
          caption: 'Updated caption',
          alt_text: 'Updated alt text',
          sort_order: 5,
        })
        .eq('id', inserted!.id)

      expect(updateError).toBeNull()

      // Verify update
      const { data: updated } = await supabase
        .from('media')
        .select('*')
        .eq('id', inserted!.id)
        .single()

      expect(updated?.caption).toBe('Updated caption')
      expect(updated?.alt_text).toBe('Updated alt text')
      expect(updated?.sort_order).toBe(5)
    })

    it('should count media for entity', async () => {
      const entityId = 'test-count-post'

      // Insert multiple records
      const { data: inserted } = await supabase
        .from('media')
        .insert([
          {
            storage_path: 'test/count1.jpg',
            original_filename: 'count1.jpg',
            mime_type: 'image/jpeg',
            file_size: 1024,
            uploaded_by: testUserId,
            original_uploader_id: testUserId,
            entity_type: 'post',
            entity_id: entityId,
          },
          {
            storage_path: 'test/count2.jpg',
            original_filename: 'count2.jpg',
            mime_type: 'image/jpeg',
            file_size: 1024,
            uploaded_by: testUserId,
            original_uploader_id: testUserId,
            entity_type: 'post',
            entity_id: entityId,
          },
          {
            storage_path: 'test/count3.jpg',
            original_filename: 'count3.jpg',
            mime_type: 'image/jpeg',
            file_size: 1024,
            uploaded_by: testUserId,
            original_uploader_id: testUserId,
            entity_type: 'post',
            entity_id: entityId,
          },
        ])
        .select()

      if (inserted) testMediaIds.push(...inserted.map(m => m.id))

      // Count
      const { count, error } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', 'post')
        .eq('entity_id', entityId)
        .is('deleted_at', null)

      expect(error).toBeNull()
      expect(count).toBe(3)
    })
  })

  describe('media_audit_log operations', () => {
    it('should insert audit log entry', async () => {
      // First create a media record
      const { data: media } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/audit.jpg',
          original_filename: 'audit.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-audit-post',
        })
        .select()
        .single()

      if (media) testMediaIds.push(media.id)

      // Insert audit log
      const { data: audit, error } = await supabase
        .from('media_audit_log')
        .insert({
          media_id: media!.id,
          action: 'uploaded',
          actor_id: testUserId,
          details: {
            filename: 'audit.jpg',
            originalSize: 2048,
            compressedSize: 1024,
          },
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(audit).toBeTruthy()
      expect(audit?.media_id).toBe(media!.id)
      expect(audit?.action).toBe('uploaded')
    })

    it('should query audit log by media_id', async () => {
      // Create media with audit logs
      const { data: media } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/multi-audit.jpg',
          original_filename: 'multi-audit.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-multi-audit',
        })
        .select()
        .single()

      if (media) testMediaIds.push(media.id)

      // Insert multiple audit entries
      await supabase
        .from('media_audit_log')
        .insert([
          {
            media_id: media!.id,
            action: 'uploaded',
            actor_id: testUserId,
            details: {},
          },
          {
            media_id: media!.id,
            action: 'updated',
            actor_id: testUserId,
            details: { field: 'caption' },
          },
          {
            media_id: media!.id,
            action: 'deleted',
            actor_id: testUserId,
            details: { reason: 'test' },
          },
        ])

      // Query audit log
      const { data: logs, error } = await supabase
        .from('media_audit_log')
        .select('*')
        .eq('media_id', media!.id)
        .order('created_at', { ascending: true })

      expect(error).toBeNull()
      expect(logs).toHaveLength(3)
      expect(logs?.[0].action).toBe('uploaded')
      expect(logs?.[1].action).toBe('updated')
      expect(logs?.[2].action).toBe('deleted')
    })
  })

  describe('GDPR functions', () => {
    it.skip('should export user media via RPC', async () => {
      // This test requires the export_user_media RPC function to exist
      // Skip if not available in test database

      const { data, error } = await supabase
        .rpc('export_user_media', { user_id: testUserId })

      if (error?.code === '42883') {
        // Function doesn't exist
        return
      }

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should anonymize uploaded_by on GDPR delete', async () => {
      // Insert test record
      const { data: inserted } = await supabase
        .from('media')
        .insert({
          storage_path: 'test/gdpr-delete.jpg',
          original_filename: 'gdpr.jpg',
          mime_type: 'image/jpeg',
          file_size: 1024,
          uploaded_by: testUserId,
          original_uploader_id: testUserId,
          entity_type: 'post',
          entity_id: 'test-gdpr-post',
        })
        .select()
        .single()

      if (inserted) testMediaIds.push(inserted.id)

      // GDPR delete (anonymize)
      const { error: updateError } = await supabase
        .from('media')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: null,
          deletion_reason: 'GDPR sletteanmodning',
          uploaded_by: null, // Anonymize
        })
        .eq('id', inserted!.id)

      expect(updateError).toBeNull()

      // Verify anonymization
      const { data: anonymized } = await supabase
        .from('media')
        .select('*')
        .eq('id', inserted!.id)
        .single()

      expect(anonymized?.uploaded_by).toBeNull()
      expect(anonymized?.original_uploader_id).toBe(testUserId) // Should remain for copyright
      expect(anonymized?.deleted_at).toBeTruthy()
    })
  })
})

// If tests are skipped, show why
if (!shouldRunTests) {
  console.log('\n⏭️  Skipping database integration tests')
  console.log('To run these tests, set up a test database and configure:')
  console.log('  - SUPABASE_TEST_URL')
  console.log('  - SUPABASE_TEST_ANON_KEY')
  console.log('Or use local Supabase: npx supabase start\n')
}
