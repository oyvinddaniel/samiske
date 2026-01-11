/**
 * Media Components Tests
 * Enkle tester for komponenter som bruker MediaService
 *
 * Mer omfattende tester gjøres i E2E-tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock MediaService
vi.mock('@/lib/media', () => ({
  MediaService: {
    getSettings: vi.fn().mockResolvedValue({
      maxFileSizeMb: 20,
      maxImagesPerPost: 30,
      maxImagesPerGeography: 100,
    }),
    upload: vi.fn().mockResolvedValue({ success: true }),
    uploadMultiple: vi.fn().mockResolvedValue({
      successful: [],
      failed: [],
      totalUploaded: 0,
      totalFailed: 0,
    }),
  },
}))

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    })),
  })),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('Media Components', () => {
  describe('Basic Component Loading', () => {
    it('should be able to import MediaService', async () => {
      const { MediaService } = await import('@/lib/media')

      expect(MediaService).toBeDefined()
      expect(MediaService.upload).toBeDefined()
      expect(MediaService.uploadMultiple).toBeDefined()
      expect(MediaService.getSettings).toBeDefined()
    })

    it('should be able to import media types', async () => {
      const types = await import('@/lib/media/mediaTypes')

      expect(types.DEFAULT_MEDIA_SETTINGS).toBeDefined()
      expect(types.DEFAULT_MEDIA_SETTINGS.maxFileSizeMb).toBe(20)
    })

    it('should be able to import media validation', async () => {
      const validation = await import('@/lib/media/mediaValidation')

      expect(validation.getMediaSettings).toBeDefined()
      expect(validation.validateFile).toBeDefined()
    })

    it('should be able to import media compression', async () => {
      const compression = await import('@/lib/media/mediaCompression')

      expect(compression.compressForEntity).toBeDefined()
      expect(compression.getImageDimensions).toBeDefined()
    })

    it('should be able to import media URLs', async () => {
      const urls = await import('@/lib/media/mediaUrls')

      expect(urls.getMediaUrl).toBeDefined()
      expect(urls.getMediaSrcSet).toBeDefined()
    })
  })

  describe('Component Integration', () => {
    it('should handle MediaService import in components', async () => {
      // Test that MediaService can be imported and used in component context
      const { MediaService } = await import('@/lib/media')

      const settings = await MediaService.getSettings()

      expect(settings).toBeDefined()
      expect(settings.maxFileSizeMb).toBe(20)
    })
  })
})
