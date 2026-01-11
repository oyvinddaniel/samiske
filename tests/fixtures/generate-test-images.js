/**
 * Generate test images for testing
 * This creates dummy files of specific sizes for testing upload limits
 */

const fs = require('fs')
const path = require('path')

const IMAGES_DIR = path.join(__dirname, 'images')

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// Create a minimal valid JPEG header
const jpegHeader = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, // JPEG SOI and APP0
  0x00, 0x10, // APP0 length
  0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF"
  0x01, 0x01, // version
  0x00, // units
  0x00, 0x01, 0x00, 0x01, // X/Y density
  0x00, 0x00, // thumbnail
])

const jpegFooter = Buffer.from([0xff, 0xd9]) // JPEG EOI

function createJPEG(filename, sizeInBytes) {
  const filePath = path.join(IMAGES_DIR, filename)

  // Calculate padding needed
  const padding = sizeInBytes - jpegHeader.length - jpegFooter.length
  const paddingBuffer = Buffer.alloc(Math.max(0, padding), 0xff)

  // Combine header, padding, footer
  const fileBuffer = Buffer.concat([jpegHeader, paddingBuffer, jpegFooter])

  fs.writeFileSync(filePath, fileBuffer)
  console.log(`✓ Created ${filename} (${(sizeInBytes / 1024).toFixed(2)} KB)`)
}

function createTextFile(filename) {
  const filePath = path.join(IMAGES_DIR, filename)
  fs.writeFileSync(filePath, 'This is not an image file')
  console.log(`✓ Created ${filename} (text file for type validation)`)
}

// Generate test files
console.log('Generating test images...\n')

// Small image - 50KB
createJPEG('small.jpg', 50 * 1024)

// Medium image - 500KB
createJPEG('medium.jpg', 500 * 1024)

// Large image - 5MB
createJPEG('large.jpg', 5 * 1024 * 1024)

// Oversized image - 30MB (exceeds typical 20MB limit)
createJPEG('oversized.jpg', 30 * 1024 * 1024)

// Invalid file type
createTextFile('invalid.txt')

console.log('\n✅ All test images generated successfully!')
console.log(`   Location: ${IMAGES_DIR}`)
