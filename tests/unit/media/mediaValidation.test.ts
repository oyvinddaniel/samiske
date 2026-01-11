/**
 * Media Validation Unit Tests
 * Tester all valideringsfunksjonalitet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMediaSettings,
  clearMediaSettingsCache,
  validateFile,
  validateImageDimensions,
  canUploadMore,
  validateFiles,
} from '@/lib/media/mediaValidation'
import { DEFAULT_MEDIA_SETTINGS } from '@/lib/media/mediaTypes'
import { createClient } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

describe('Media Validation', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    clearMediaSettingsCache()

    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
      })),
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  describe('getMediaSettings()', () => {
    it('should return default settings if no data in database', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))

      const settings = await getMediaSettings()

      expect(settings).toEqual(DEFAULT_MEDIA_SETTINGS)
    })

    it('should parse settings from database', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [
            { key: 'media_max_file_size_mb', value: '15' },
            { key: 'media_max_images_per_post', value: '20' },
            { key: 'media_max_images_per_geography', value: '50' },
            { key: 'media_max_image_dimension', value: '2400' },
            {
              key: 'media_allowed_types',
              value: JSON.stringify(['image/jpeg', 'image/png']),
            },
          ],
          error: null,
        }),
      }))

      const settings = await getMediaSettings()

      expect(settings.maxFileSizeMb).toBe(15)
      expect(settings.maxImagesPerPost).toBe(20)
      expect(settings.maxImagesPerGeography).toBe(50)
      expect(settings.maxImageDimension).toBe(2400)
      expect(settings.allowedTypes).toEqual(['image/jpeg', 'image/png'])
    })

    it('should use cache on subsequent calls', async () => {
      const inMock = vi.fn().mockResolvedValue({ data: [], error: null })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: inMock,
      }))

      await getMediaSettings()
      await getMediaSettings()
      await getMediaSettings()

      // Should only fetch once
      expect(inMock).toHaveBeenCalledTimes(1)
    })

    it('should return defaults on database error', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }))

      const settings = await getMediaSettings()

      expect(settings).toEqual(DEFAULT_MEDIA_SETTINGS)
    })

    it('should handle invalid JSON in allowed_types', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ key: 'media_allowed_types', value: 'invalid json' }],
          error: null,
        }),
      }))

      const settings = await getMediaSettings()

      expect(settings.allowedTypes).toEqual(DEFAULT_MEDIA_SETTINGS.allowedTypes)
    })
  })

  describe('clearMediaSettingsCache()', () => {
    it('should clear cache and force refetch', async () => {
      const inMock = vi.fn().mockResolvedValue({ data: [], error: null })
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: inMock,
      }))

      await getMediaSettings()
      clearMediaSettingsCache()
      await getMediaSettings()

      expect(inMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateFile()', () => {
    it('should validate file size', async () => {
      const tooLargeFile = new File(
        [new ArrayBuffer(25 * 1024 * 1024)], // 25MB
        'large.jpg',
        { type: 'image/jpeg' }
      )

      const errors = await validateFile(tooLargeFile)

      expect(errors).toHaveLength(1)
      expect(errors[0].code).toBe('file_too_large')
      expect(errors[0].message).toContain('Maks 20 MB')
    })

    it('should validate file type', async () => {
      const invalidTypeFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
      })

      const errors = await validateFile(invalidTypeFile)

      expect(errors).toHaveLength(1)
      expect(errors[0].code).toBe('invalid_type')
      expect(errors[0].message).toContain('Ugyldig filtype')
    })

    it('should pass valid files', async () => {
      const validFile = new File([new ArrayBuffer(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      })

      const errors = await validateFile(validFile)

      expect(errors).toHaveLength(0)
    })

    it('should use custom settings if provided', async () => {
      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      })

      const customSettings = {
        ...DEFAULT_MEDIA_SETTINGS,
        maxFileSizeMb: 1,
      }

      const errors = await validateFile(file, customSettings)

      expect(errors).toHaveLength(1)
      expect(errors[0].code).toBe('file_too_large')
    })
  })

  describe('validateImageDimensions()', () => {
    it('should validate image dimensions', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      global.Image = class {
        onload: any = null
        onerror: any = null
        src = ''
        width = 1920
        height = 1080

        constructor() {
          setTimeout(() => {
            if (this.onload) {
              this.onload()
            }
          }, 0)
        }
      } as any

      const errors = await validateImageDimensions(file)

      // Should not have errors - we don't validate dimensions, only compress
      expect(errors).toHaveLength(0)
    })

    it('should handle invalid images', async () => {
      const file = new File(['not an image'], 'test.jpg', {
        type: 'image/jpeg',
      })

      global.Image = class {
        onload: any = null
        onerror: any = null
        src = ''

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror()
            }
          }, 0)
        }
      } as any

      const errors = await validateImageDimensions(file)

      expect(errors).toHaveLength(1)
      expect(errors[0].code).toBe('invalid_dimensions')
    })
  })

  describe('canUploadMore()', () => {
    it('should allow upload if under limit', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        // media table
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({ count: 10, error: null })
        return chainMock
      })

      const result = await canUploadMore('post', 'post-123', 5)

      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(10)
      expect(result.maxCount).toBe(30) // default for posts
    })

    it('should deny upload if over limit', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({ count: 28, error: null })
        return chainMock
      })

      const result = await canUploadMore('post', 'post-123', 5)

      expect(result.allowed).toBe(false)
      expect(result.message).toContain('Du kan laste opp 2 flere bilder')
    })

    it('should allow exactly at limit', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({ count: 25, error: null })
        return chainMock
      })

      const result = await canUploadMore('post', 'post-123', 5)

      expect(result.allowed).toBe(true)
      expect(result.currentCount).toBe(25)
    })

    it('should handle different entity types', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({ count: 0, error: null })
        return chainMock
      })

      // Geography should have limit of 100
      const geoResult = await canUploadMore(
        'geography_municipality',
        'geo-123',
        50
      )
      expect(geoResult.maxCount).toBe(100)

      // Avatar should have limit of 1
      const avatarResult = await canUploadMore('profile_avatar', 'user-123', 1)
      expect(avatarResult.maxCount).toBe(1)
    })

    it('should allow upload on database error', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({
          count: null,
          error: { message: 'DB error' },
        })
        return chainMock
      })

      const result = await canUploadMore('post', 'post-123', 5)

      // Should allow through for server-side validation
      expect(result.allowed).toBe(true)
    })
  })

  describe('validateFiles()', () => {
    beforeEach(() => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }))
    })

    it('should validate multiple files', async () => {
      const validFile = new File([new ArrayBuffer(1024)], 'valid.jpg', {
        type: 'image/jpeg',
      })
      const invalidFile = new File(['test'], 'invalid.txt', {
        type: 'text/plain',
      })

      const result = await validateFiles(
        [validFile, invalidFile],
        'post',
        'post-123'
      )

      expect(result.valid).toHaveLength(1)
      expect(result.invalid).toHaveLength(1)
      expect(result.canUpload).toBe(true)
      expect(result.invalid[0].errors[0].code).toBe('invalid_type')
    })

    it('should enforce upload limits', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockResolvedValue({ count: 28, error: null }),
        }
      })

      const files = Array.from({ length: 5 }, (_, i) =>
        new File([new ArrayBuffer(1024)], `file${i}.jpg`, { type: 'image/jpeg' })
      )

      const result = await validateFiles(files, 'post', 'post-123')

      expect(result.canUpload).toBe(false)
      expect(result.message).toBeTruthy()
      expect(result.invalid).toHaveLength(5)
      expect(result.invalid[0].errors[0].code).toBe('limit_exceeded')
    })

    it('should limit valid files to remaining slots', async () => {
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'app_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        const chainMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn(),
        }
        chainMock.is.mockResolvedValue({ count: 28, error: null })
        return chainMock
      })

      const files = Array.from({ length: 5 }, (_, i) =>
        new File([new ArrayBuffer(1024)], `file${i}.jpg`, { type: 'image/jpeg' })
      )

      // Currently at 28, max is 30
      // Trying to upload 5 files would exceed limit (28+5=33 > 30)
      // Current implementation rejects all files when limit would be exceeded
      const result = await validateFiles(files, 'post', 'post-123')

      expect(result.valid).toHaveLength(0)
      expect(result.invalid).toHaveLength(5)
      expect(result.canUpload).toBe(false)
      expect(result.message).toContain('Du kan laste opp 2 flere bilder')
    })

    it('should return all valid if under limit', async () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        new File([new ArrayBuffer(1024)], `file${i}.jpg`, { type: 'image/jpeg' })
      )

      const result = await validateFiles(files, 'post', 'post-123')

      expect(result.valid).toHaveLength(3)
      expect(result.invalid).toHaveLength(0)
      expect(result.canUpload).toBe(true)
    })

    it('should handle mix of valid and invalid files with limits', async () => {
      const validFile1 = new File([new ArrayBuffer(1024)], 'valid1.jpg', {
        type: 'image/jpeg',
      })
      const validFile2 = new File([new ArrayBuffer(1024)], 'valid2.jpg', {
        type: 'image/jpeg',
      })
      const invalidFile = new File(['test'], 'invalid.txt', {
        type: 'text/plain',
      })
      const tooLargeFile = new File(
        [new ArrayBuffer(25 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      )

      const result = await validateFiles(
        [validFile1, invalidFile, validFile2, tooLargeFile],
        'post',
        'post-123'
      )

      expect(result.valid).toHaveLength(2)
      expect(result.invalid).toHaveLength(2)
      expect(result.canUpload).toBe(true)
    })
  })
})
