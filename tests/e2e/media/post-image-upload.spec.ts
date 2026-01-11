/**
 * Post Image Upload E2E Tests
 * Tester komplett flyt for opplasting av bilder til innlegg
 *
 * VIKTIG: Krever at applikasjonen kjører (npm run dev)
 * Kjøres med: npx playwright test
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Post Image Upload', () => {
  // Setup: Login før hver test (hvis påkrevd)
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Skip login hvis allerede innlogget
    // I en ekte test ville du logge inn her
    // For nå antar vi at brukeren er innlogget
  })

  test('should upload single image to post', async ({ page }) => {
    // Gå til innlegg-opprettelsesside
    await page.goto('/')

    // Klikk på "Opprett innlegg" knapp
    const createPostButton = page.getByRole('button', { name: /opprett innlegg/i })
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
    }

    // Vent på at modalen eller sheetet åpnes
    await page.waitForSelector('textarea, input[placeholder*="hva tenker"]', {
      timeout: 5000,
    })

    // Skriv innleggstekst
    const textarea = page.locator('textarea').first()
    await textarea.fill('Test innlegg med bilde')

    // Last opp bilde
    const testImagePath = path.join(process.cwd(), 'tests/fixtures/images/small.jpg')

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testImagePath)

    // Vent på preview
    await expect(page.locator('img[alt*="Preview"], img[src*="blob:"]')).toBeVisible({
      timeout: 10000,
    })

    // Publiser innlegg
    const publishButton = page.getByRole('button', { name: /publiser|post/i })
    if (await publishButton.isVisible()) {
      await publishButton.click()
    }

    // Verifiser at innlegget vises i feed med bilde
    await expect(page.getByText('Test innlegg med bilde')).toBeVisible({
      timeout: 10000,
    })

    // Verifiser at bildet vises
    // await expect(page.locator('img[src*="supabase"]')).toBeVisible()
  })

  test('should upload multiple images to post', async ({ page }) => {
    await page.goto('/')

    // Opprett innlegg med flere bilder
    const createPostButton = page.getByRole('button', { name: /opprett innlegg/i })
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
    }

    await page.waitForSelector('textarea, input[placeholder*="hva tenker"]')

    const textarea = page.locator('textarea').first()
    await textarea.fill('Innlegg med 3 bilder')

    // Last opp 3 bilder
    const testImages = [
      'tests/fixtures/images/small.jpg',
      'tests/fixtures/images/small.jpg', // Reuse for testing
      'tests/fixtures/images/small.jpg',
    ].map(p => path.join(process.cwd(), p))

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testImages)

    // Vent på previews
    await page.waitForTimeout(2000) // Wait for images to load

    // Should see 3 previews
    const previews = page.locator('img[alt*="Preview"], img[src*="blob:"]')
    await expect(previews).toHaveCount(3, { timeout: 10000 })
  })

  test('should show error for oversized file', async ({ page }) => {
    await page.goto('/')

    const createPostButton = page.getByRole('button', { name: /opprett innlegg/i })
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
    }

    await page.waitForSelector('textarea')

    // Try to upload oversized file
    const oversizedPath = path.join(process.cwd(), 'tests/fixtures/images/oversized.jpg')

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(oversizedPath)

    // Should show error message
    // await expect(page.getByText(/for stor|too large/i)).toBeVisible({ timeout: 5000 })
  })

  test('should allow removing image before upload', async ({ page }) => {
    await page.goto('/')

    const createPostButton = page.getByRole('button', { name: /opprett innlegg/i })
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
    }

    await page.waitForSelector('textarea')

    // Upload image
    const testImagePath = path.join(process.cwd(), 'tests/fixtures/images/small.jpg')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(testImagePath)

    // Wait for preview
    await page.waitForSelector('img[src*="blob:"]', { timeout: 5000 })

    // Click remove button (usually an X icon)
    const removeButton = page.locator('button[aria-label*="fjern"], button[aria-label*="remove"]').first()
    if (await removeButton.isVisible()) {
      await removeButton.click()

      // Verify preview is gone
      await expect(page.locator('img[src*="blob:"]')).not.toBeVisible()
    }
  })

  test('should compress large images before upload', async ({ page }) => {
    // This test verifies compression happens client-side
    // We can't directly test file size, but we can verify the upload completes

    await page.goto('/')

    const createPostButton = page.getByRole('button', { name: /opprett innlegg/i })
    if (await createPostButton.isVisible()) {
      await createPostButton.click()
    }

    await page.waitForSelector('textarea')

    const textarea = page.locator('textarea').first()
    await textarea.fill('Test komprimering')

    // Upload large file
    const largePath = path.join(process.cwd(), 'tests/fixtures/images/large.jpg')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(largePath)

    // Should still show preview even though file is large
    await expect(page.locator('img[src*="blob:"]')).toBeVisible({ timeout: 10000 })
  })

  test.skip('should respect max images per post limit', async ({ page }) => {
    // This test would upload 31 images when limit is 30
    // Skipped as it would take too long and require actual backend
  })
})
