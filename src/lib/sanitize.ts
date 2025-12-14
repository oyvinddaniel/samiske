/**
 * HTML Sanitization Utilities
 *
 * Provides functions to sanitize user input and prevent XSS attacks.
 * Used primarily in admin interfaces when displaying user-submitted content.
 */

/**
 * Sanitizes HTML by escaping all HTML special characters
 * Converts HTML to plain text, preventing any script execution
 *
 * @param input - The potentially unsafe string to sanitize
 * @returns The sanitized string safe for display in HTML context
 *
 * @example
 * sanitizeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''

  // Create a map of characters to escape
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Sanitizes a string for use in URL contexts
 * Removes potentially dangerous characters and schemes
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * sanitizeUrl('javascript:alert(1)')
 * // Returns: ''
 *
 * sanitizeUrl('https://example.com')
 * // Returns: 'https://example.com'
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''

  const trimmed = url.trim()

  // Block dangerous URL schemes
  const dangerousSchemes = /^(javascript|data|vbscript|file):/i
  if (dangerousSchemes.test(trimmed)) {
    return ''
  }

  // Only allow http, https, mailto, tel
  if (!/^(https?|mailto|tel):/i.test(trimmed) && !/^\//.test(trimmed)) {
    return ''
  }

  return trimmed
}

/**
 * Sanitizes text for display while preserving line breaks
 * Escapes HTML but converts \n to <br>
 *
 * @param text - The text to sanitize
 * @returns Sanitized text with line breaks as <br> tags
 *
 * @example
 * sanitizeTextWithBreaks('Line 1\nLine 2')
 * // Returns: 'Line 1<br>Line 2'
 */
export function sanitizeTextWithBreaks(text: string | null | undefined): string {
  if (!text) return ''

  const escaped = sanitizeHtml(text)
  return escaped.replace(/\n/g, '<br>')
}

/**
 * Strips all HTML tags from a string, leaving only text content
 * Useful for creating plain text versions of HTML content
 *
 * @param html - The HTML string to strip
 * @returns Plain text without any HTML tags
 *
 * @example
 * stripHtml('<p>Hello <strong>world</strong></p>')
 * // Returns: 'Hello world'
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''

  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Decode common entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim()
}

/**
 * Validates and sanitizes a JSON object for safe storage
 * Recursively sanitizes all string values in the object
 *
 * @param obj - The object to sanitize
 * @returns Sanitized copy of the object
 */
export function sanitizeJsonObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeHtml(item) : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeJsonObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
