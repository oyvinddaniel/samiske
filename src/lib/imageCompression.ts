import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.15, // Target ~150KB
    maxWidthOrHeight = 1920,
    quality = 0.7,
  } = options

  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality,
    preserveExif: false,
    fileType: 'image/jpeg' as const,
  }

  try {
    const compressedFile = await imageCompression(file, compressionOptions)

    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original file if compression fails
    return file
  }
}

export async function compressProfileImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.1, // 100KB for profile images
    maxWidthOrHeight: 400,
    quality: 0.8,
  })
}

export async function compressPostImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2, // 200KB for post images
    maxWidthOrHeight: 1200,
    quality: 0.75,
  })
}

export async function compressGeographyImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.3, // 300KB for geography/landscape images
    maxWidthOrHeight: 1600,
    quality: 0.8,
  })
}
