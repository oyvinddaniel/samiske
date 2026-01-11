/**
 * Media Compression Unit Tests
 * Tester bildekomprimering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  compressForEntity,
  compressMedia,
  compressMultiple,
  getImageDimensions,
  calculateResizedDimensions,
} from '@/lib/media/mediaCompression'
import imageCompression from 'browser-image-compression'

vi.mock('browser-image-compression')

describe('Media Compression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('compressForEntity()', () => {
    it('should compress for profile_avatar with correct settings', async () => {
      const mockCompressed = new File(['compressed'], 'avatar.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'avatar.jpg', {
        type: 'image/jpeg',
      })

      const result = await compressForEntity(file, 'profile_avatar')

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.1,
          maxWidthOrHeight: 400,
          initialQuality: 0.8,
        })
      )
      expect(result).toBe(mockCompressed)
    })

    it('should compress for post with correct settings', async () => {
      const mockCompressed = new File(['compressed'], 'post.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'post.jpg', {
        type: 'image/jpeg',
      })

      await compressForEntity(file, 'post')

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1200,
          initialQuality: 0.75,
        })
      )
    })

    it('should compress for geography with higher quality', async () => {
      const mockCompressed = new File(['compressed'], 'geo.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'geo.jpg', {
        type: 'image/jpeg',
      })

      await compressForEntity(file, 'geography_municipality')

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1600,
          initialQuality: 0.8,
        })
      )
    })

    it('should compress for bug_report with high quality', async () => {
      const mockCompressed = new File(['compressed'], 'bug.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'bug.jpg', {
        type: 'image/jpeg',
      })

      await compressForEntity(file, 'bug_report')

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          initialQuality: 0.85,
        })
      )
    })
  })

  describe('compressMedia()', () => {
    it('should skip compression if file is small enough', async () => {
      const smallFile = new File([new ArrayBuffer(100 * 1024)], 'small.jpg', {
        type: 'image/jpeg',
      })

      const result = await compressMedia(smallFile, { maxSizeMB: 0.3 })

      expect(imageCompression).not.toHaveBeenCalled()
      expect(result).toBe(smallFile)
    })

    it('should skip compression for non-image files', async () => {
      const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })

      const result = await compressMedia(textFile)

      expect(imageCompression).not.toHaveBeenCalled()
      expect(result).toBe(textFile)
    })

    it('should skip compression for GIFs to preserve animation', async () => {
      const gifFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'anim.gif', {
        type: 'image/gif',
      })

      const result = await compressMedia(gifFile)

      expect(imageCompression).not.toHaveBeenCalled()
      expect(result).toBe(gifFile)
    })

    it('should compress large images', async () => {
      const mockCompressed = new File(['compressed'], 'large.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const largeFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })

      const result = await compressMedia(largeFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      })

      expect(imageCompression).toHaveBeenCalledWith(
        largeFile,
        expect.objectContaining({
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
          preserveExif: false,
          fileType: 'image/jpeg',
        })
      )
      expect(result).toBe(mockCompressed)
    })

    it('should return original file if compression fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(imageCompression as any).mockRejectedValue(new Error('Compression failed'))

      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      })

      const result = await compressMedia(file)

      expect(result).toBe(file)
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    it('should use default options if not provided', async () => {
      const mockCompressed = new File(['compressed'], 'test.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      })

      await compressMedia(file)

      expect(imageCompression).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1920,
          initialQuality: 0.8,
        })
      )
    })
  })

  describe('compressMultiple()', () => {
    it('should compress multiple files', async () => {
      const mockCompressed1 = new File(['comp1'], 'file1.jpg', {
        type: 'image/jpeg',
      })
      const mockCompressed2 = new File(['comp2'], 'file2.jpg', {
        type: 'image/jpeg',
      })

      ;(imageCompression as any)
        .mockResolvedValueOnce(mockCompressed1)
        .mockResolvedValueOnce(mockCompressed2)

      const files = [
        new File([new ArrayBuffer(2 * 1024 * 1024)], 'file1.jpg', {
          type: 'image/jpeg',
        }),
        new File([new ArrayBuffer(3 * 1024 * 1024)], 'file2.jpg', {
          type: 'image/jpeg',
        }),
      ]

      const results = await compressMultiple(files, 'post')

      expect(results).toHaveLength(2)
      expect(results[0]).toBe(mockCompressed1)
      expect(results[1]).toBe(mockCompressed2)
      expect(imageCompression).toHaveBeenCalledTimes(2)
    })

    it('should call progress callback', async () => {
      const mockCompressed = new File(['comp'], 'file.jpg', {
        type: 'image/jpeg',
      })
      ;(imageCompression as any).mockResolvedValue(mockCompressed)

      const files = [
        new File([new ArrayBuffer(2 * 1024 * 1024)], 'file1.jpg', {
          type: 'image/jpeg',
        }),
        new File([new ArrayBuffer(2 * 1024 * 1024)], 'file2.jpg', {
          type: 'image/jpeg',
        }),
        new File([new ArrayBuffer(2 * 1024 * 1024)], 'file3.jpg', {
          type: 'image/jpeg',
        }),
      ]

      const progressMock = vi.fn()

      await compressMultiple(files, 'post', progressMock)

      expect(progressMock).toHaveBeenCalledWith(1, 3)
      expect(progressMock).toHaveBeenCalledWith(2, 3)
      expect(progressMock).toHaveBeenCalledWith(3, 3)
      expect(progressMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('getImageDimensions()', () => {
    it('should get image dimensions', async () => {
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

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const dimensions = await getImageDimensions(file)

      expect(dimensions.width).toBe(1920)
      expect(dimensions.height).toBe(1080)
    })

    it('should reject if image fails to load', async () => {
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

      const file = new File(['invalid'], 'test.jpg', { type: 'image/jpeg' })

      await expect(getImageDimensions(file)).rejects.toThrow(
        'Could not load image'
      )
    })
  })

  describe('calculateResizedDimensions()', () => {
    it('should keep original dimensions if under limit', () => {
      const result = calculateResizedDimensions(800, 600, 1920)

      expect(result.width).toBe(800)
      expect(result.height).toBe(600)
    })

    it('should resize landscape images correctly', () => {
      const result = calculateResizedDimensions(3840, 2160, 1920)

      expect(result.width).toBe(1920)
      expect(result.height).toBe(1080)
    })

    it('should resize portrait images correctly', () => {
      const result = calculateResizedDimensions(1080, 1920, 1200)

      expect(result.width).toBe(675)
      expect(result.height).toBe(1200)
    })

    it('should handle square images', () => {
      const result = calculateResizedDimensions(2000, 2000, 1000)

      expect(result.width).toBe(1000)
      expect(result.height).toBe(1000)
    })

    it('should maintain aspect ratio for wide images', () => {
      const result = calculateResizedDimensions(4000, 1000, 2000)

      expect(result.width).toBe(2000)
      expect(result.height).toBe(500)

      // Check aspect ratio is maintained
      const originalRatio = 4000 / 1000
      const resizedRatio = result.width / result.height
      expect(Math.abs(originalRatio - resizedRatio)).toBeLessThan(0.01)
    })

    it('should maintain aspect ratio for tall images', () => {
      const result = calculateResizedDimensions(1000, 4000, 2000)

      expect(result.width).toBe(500)
      expect(result.height).toBe(2000)

      // Check aspect ratio is maintained
      const originalRatio = 1000 / 4000
      const resizedRatio = result.width / result.height
      expect(Math.abs(originalRatio - resizedRatio)).toBeLessThan(0.01)
    })
  })
})
