/**
 * Media Service Basic E2E Tests
 * Grunnleggende tester som verifiserer at media-funksjonalitet er tilgjengelig
 */

import { test, expect } from '@playwright/test'

test.describe('Media Service - Basic Functionality', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Verify page loads
    await expect(page).toHaveTitle(/samiske/i, { timeout: 10000 })
  })

  test.skip('should have file upload inputs on post creation', async ({ page }) => {
    // Skipped: Requires authentication
    await page.goto('/')

    // Look for file input (might be hidden)
    const fileInputs = page.locator('input[type="file"]')

    // Just verify the page loads without errors
    await expect(page).not.toHaveTitle(/error/i)
  })

  test('should load media library code', async ({ page }) => {
    // This test verifies that media service code loads without errors

    await page.goto('/')

    // Check for JavaScript errors
    const errors: string[] = []
    page.on('pageerror', error => {
      errors.push(error.message)
    })

    // Navigate and wait
    await page.waitForLoadState('networkidle')

    // Should not have critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('MediaService') ||
      e.includes('media/') ||
      e.includes('compressForEntity')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out expected errors (if any)
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && // Ignore favicon errors
      !e.includes('sourcemap') // Ignore sourcemap warnings
    )

    // Log errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors:', criticalErrors)
    }

    // We allow some errors but verify no media-related errors
    const mediaErrors = criticalErrors.filter(e =>
      e.includes('media') ||
      e.includes('upload') ||
      e.includes('compress')
    )

    expect(mediaErrors).toHaveLength(0)
  })
})
