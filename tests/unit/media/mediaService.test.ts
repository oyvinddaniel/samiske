/**
 * MediaService Unit Tests
 * Tester all hovedfunksjonalitet i MediaService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MediaService } from '@/lib/media/mediaService'
import { createClient } from '@/lib/supabase/client'
import * as mediaCompression from '@/lib/media/mediaCompression'
import * as mediaValidation from '@/lib/media/mediaValidation'

// Mock Supabase client
vi.mock('@/lib/supabase/client')

describe('MediaService', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup default mock behavior
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
          remove: vi.fn().mockResolvedValue({ error: null }),
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        rpc: vi.fn(),
      })),
      rpc: vi.fn(),
    }

    ;(createClient as any).mockReturnValue(mockSupabase)

    // Mock compression to return same file
    vi.spyOn(mediaCompression, 'compressForEntity').mockResolvedValue(
      new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    )
    vi.spyOn(mediaCompression, 'getImageDimensions').mockResolvedValue({
      width: 800,
      height: 600,
    })
  })

  describe('upload()', () => {
    it('should successfully upload a file', async () => {
      const mockMediaRecord = {
        id: 'media-123',
        storage_path: 'users/test-user-id/posts/post-123/1234567890.jpg',
        original_filename: 'test.jpg',
        mime_type: 'image/jpeg',
        file_size: 1024,
        width: 800,
        height: 600,
        uploaded_by: 'test-user-id',
        original_uploader_id: 'test-user-id',
        entity_type: 'post',
        entity_id: 'post-123',
        caption: null,
        alt_text: null,
        sort_order: 0,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'media') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockMediaRecord, error: null }),
          }
        }
        if (table === 'media_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return mockSupabase.from()
      })

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const result = await MediaService.upload(file, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.success).toBe(true)
      expect(result.media).toEqual(mockMediaRecord)
      expect(result.error).toBeUndefined()
    })

    it('should fail if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await MediaService.upload(file, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Du må være innlogget for å laste opp')
    })

    it('should handle storage upload errors', async () => {
      const storageError = { message: 'Storage quota exceeded' }
      mockSupabase.storage.from = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: storageError }),
      }))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await MediaService.upload(file, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage quota exceeded')
    })

    it('should cleanup storage on database error', async () => {
      const removeMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.storage.from = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: removeMock,
      }))

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'media') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }
        }
        return mockSupabase.from()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = await MediaService.upload(file, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
      expect(removeMock).toHaveBeenCalled()
    })

    it('should include caption and altText when provided', async () => {
      const insertMock = vi.fn().mockReturnThis()
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'media') {
          return {
            insert: insertMock,
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }
        }
        if (table === 'media_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return mockSupabase.from()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await MediaService.upload(file, {
        entityType: 'post',
        entityId: 'post-123',
        caption: 'Test caption',
        altText: 'Test alt text',
        sortOrder: 5,
      })

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: 'Test caption',
          alt_text: 'Test alt text',
          sort_order: 5,
        })
      )
    })
  })

  describe('uploadMultiple()', () => {
    beforeEach(() => {
      vi.spyOn(mediaValidation, 'validateFiles').mockResolvedValue({
        valid: [
          new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
          new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
        ],
        invalid: [],
        canUpload: true,
      })
    })

    it('should upload multiple valid files', async () => {
      const mockMedia1 = { id: '1', original_filename: 'test1.jpg' } as any
      const mockMedia2 = { id: '2', original_filename: 'test2.jpg' } as any

      let uploadCount = 0
      vi.spyOn(MediaService, 'upload').mockImplementation(async () => {
        uploadCount++
        return {
          success: true,
          media: uploadCount === 1 ? mockMedia1 : mockMedia2,
        }
      })

      const files = [
        new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      const result = await MediaService.uploadMultiple(files, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.successful.length).toBe(2)
      expect(result.totalUploaded).toBe(2)
      expect(result.totalFailed).toBe(0)
      expect(result.failed.length).toBe(0)
    })

    it('should handle validation errors', async () => {
      const invalidFile = new File(['bad'], 'bad.txt', { type: 'text/plain' })
      vi.spyOn(mediaValidation, 'validateFiles').mockResolvedValue({
        valid: [],
        invalid: [
          {
            file: invalidFile,
            errors: [
              {
                field: 'type',
                message: 'Ugyldig filtype',
                code: 'invalid_type',
              },
            ],
          },
        ],
        canUpload: false,
      })

      const result = await MediaService.uploadMultiple([invalidFile], {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.totalUploaded).toBe(0)
      expect(result.totalFailed).toBe(1)
      expect(result.failed[0].error).toBe('Ugyldig filtype')
    })

    it('should call progress callback', async () => {
      vi.spyOn(MediaService, 'upload').mockResolvedValue({
        success: true,
        media: {} as any,
      })

      const progressMock = vi.fn()
      const files = [
        new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      await MediaService.uploadMultiple(
        files,
        { entityType: 'post', entityId: 'post-123' },
        progressMock
      )

      expect(progressMock).toHaveBeenCalledWith(1, 2)
      expect(progressMock).toHaveBeenCalledWith(2, 2)
    })

    it('should handle partial failures', async () => {
      let uploadCount = 0
      vi.spyOn(MediaService, 'upload').mockImplementation(async (file) => {
        uploadCount++
        if (uploadCount === 2) {
          return { success: false, error: 'Upload failed' }
        }
        return { success: true, media: { id: String(uploadCount) } as any }
      })

      const files = [
        new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      const result = await MediaService.uploadMultiple(files, {
        entityType: 'post',
        entityId: 'post-123',
      })

      expect(result.totalUploaded).toBe(1)
      expect(result.totalFailed).toBe(1)
      expect(result.successful.length).toBe(1)
      expect(result.failed.length).toBe(1)
    })
  })

  describe('getForEntity()', () => {
    it('should return sorted media for entity', async () => {
      const mockMedia = [
        { id: '1', sort_order: 0, created_at: '2024-01-01' },
        { id: '2', sort_order: 1, created_at: '2024-01-02' },
      ]

      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }

      // Setup order to return mockMedia on second call
      chainMock.order
        .mockReturnValueOnce(chainMock)
        .mockResolvedValueOnce({ data: mockMedia, error: null })

      mockSupabase.from = vi.fn(() => chainMock)

      const result = await MediaService.getForEntity('post', 'post-123')

      expect(result).toEqual(mockMedia)
      expect(chainMock.eq).toHaveBeenCalledWith('entity_type', 'post')
      expect(chainMock.eq).toHaveBeenCalledWith('entity_id', 'post-123')
      expect(chainMock.is).toHaveBeenCalledWith('deleted_at', null)
    })

    it('should return empty array on error', async () => {
      const chainMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      }

      chainMock.order
        .mockReturnValueOnce(chainMock)
        .mockResolvedValueOnce({ data: null, error: { message: 'Database error' } })

      mockSupabase.from = vi.fn(() => chainMock)

      const result = await MediaService.getForEntity('post', 'post-123')

      expect(result).toEqual([])
    })
  })

  describe('getById()', () => {
    it('should return media by ID', async () => {
      const mockMedia = { id: 'media-123', original_filename: 'test.jpg' }

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMedia, error: null }),
      }))

      const result = await MediaService.getById('media-123')

      expect(result).toEqual(mockMedia)
    })

    it('should return null on error', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }))

      const result = await MediaService.getById('media-123')

      expect(result).toBeNull()
    })
  })

  describe('delete()', () => {
    it('should soft delete media', async () => {
      const updateMock = vi.fn().mockReturnThis()
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'media') {
          return {
            update: updateMock,
            eq: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'media_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return mockSupabase.from()
      })

      const result = await MediaService.delete('media-123', 'User requested')

      expect(result.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_by: 'test-user-id',
          deletion_reason: 'User requested',
        })
      )
    })

    it('should fail if user is not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await MediaService.delete('media-123', 'Test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Du må være innlogget')
    })

    it('should handle delete errors', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }))

      const result = await MediaService.delete('media-123', 'Test')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('update()', () => {
    it('should update media metadata', async () => {
      const updateMock = vi.fn().mockReturnThis()
      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
        eq: vi.fn().mockResolvedValue({ error: null }),
      }))

      const result = await MediaService.update('media-123', {
        caption: 'New caption',
        altText: 'New alt',
        sortOrder: 10,
      })

      expect(result.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith({
        caption: 'New caption',
        alt_text: 'New alt',
        sort_order: 10,
      })
    })

    it('should handle update errors', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }))

      const result = await MediaService.update('media-123', { caption: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('updateSettings()', () => {
    it('should update media settings', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null })
      mockSupabase.from = vi.fn(() => ({
        upsert: upsertMock,
      }))

      vi.spyOn(mediaValidation, 'clearMediaSettingsCache')

      const result = await MediaService.updateSettings({
        maxFileSizeMb: 15,
        maxImagesPerPost: 20,
      })

      expect(result.success).toBe(true)
      expect(upsertMock).toHaveBeenCalledTimes(2)
      expect(mediaValidation.clearMediaSettingsCache).toHaveBeenCalled()
    })

    it('should handle settings update errors', async () => {
      mockSupabase.from = vi.fn(() => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }))

      const result = await MediaService.updateSettings({ maxFileSizeMb: 15 })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('exportUserMedia()', () => {
    it('should export user media for GDPR', async () => {
      const mockExportData = [
        {
          media_id: 'media-1',
          storage_path: 'users/user-123/posts/post-1/image.jpg',
          original_filename: 'image.jpg',
          file_size: 1024,
          entity_type: 'post',
          caption: 'Test caption',
          created_at: '2024-01-01',
        },
      ]

      mockSupabase.rpc.mockResolvedValue({ data: mockExportData, error: null })
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }))

      const result = await MediaService.exportUserMedia('user-123')

      expect(result.userId).toBe('user-123')
      expect(result.totalFiles).toBe(1)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].id).toBe('media-1')
    })

    it('should throw error on export failure', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Export failed' },
      })

      await expect(MediaService.exportUserMedia('user-123')).rejects.toThrow(
        'Kunne ikke eksportere brukerdata'
      )
    })
  })

  describe('deleteUserMedia()', () => {
    it('should delete all user media for GDPR', async () => {
      const mockMedia = [
        { id: 'media-1', storage_path: 'path1' },
        { id: 'media-2', storage_path: 'path2' },
      ]

      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'media') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockResolvedValue({ data: mockMedia, error: null }),
            update: updateMock,
            eq: eqMock,
          }
        }
        if (table === 'media_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return mockSupabase.from()
      })

      const result = await MediaService.deleteUserMedia('user-123')

      expect(result.deletedCount).toBe(2)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deletion_reason: 'GDPR sletteanmodning',
          uploaded_by: null,
        })
      )
    })

    it('should return 0 if user has no media', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))

      const result = await MediaService.deleteUserMedia('user-123')

      expect(result.deletedCount).toBe(0)
    })
  })

  describe('cleanupOrphaned()', () => {
    it('should delete orphaned files', async () => {
      const storageFiles = [
        { name: 'orphan1.jpg' },
        { name: 'valid.jpg' },
      ]

      const removeMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.storage.from = vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: storageFiles, error: null }),
        remove: removeMock,
      }))

      let singleCallCount = 0
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          singleCallCount++
          if (singleCallCount === 1) {
            // orphan1.jpg - no record found
            return Promise.resolve({ data: null, error: null })
          } else {
            // valid.jpg - record found
            return Promise.resolve({ data: { id: '1' }, error: null })
          }
        }),
      }))

      const result = await MediaService.cleanupOrphaned()

      expect(result.deletedCount).toBe(1)
      expect(removeMock).toHaveBeenCalledWith(['orphan1.jpg'])
    })

    it('should handle storage list errors', async () => {
      mockSupabase.storage.from = vi.fn(() => ({
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'List failed' },
        }),
      }))

      const result = await MediaService.cleanupOrphaned()

      expect(result.deletedCount).toBe(0)
      expect(result.errors).toContain('Kunne ikke liste filer: List failed')
    })
  })

  describe('cleanupAuditLog()', () => {
    it('should cleanup old audit logs', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 50, error: null })

      const result = await MediaService.cleanupAuditLog()

      expect(result).toBe(50)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('cleanup_media_audit_logs')
    })

    it('should return 0 on error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Cleanup failed' },
      })

      const result = await MediaService.cleanupAuditLog()

      expect(result).toBe(0)
    })
  })
})
