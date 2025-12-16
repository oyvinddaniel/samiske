/**
 * Simple in-memory rate limiter for API routes
 *
 * For production with multiple instances, consider using:
 * - Upstash Redis
 * - Vercel KV
 * - Supabase for persistent rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

interface RateLimitConfig {
  limit: number        // Max requests per window
  windowMs: number     // Window size in milliseconds
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given identifier (e.g., IP or user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // No entry or expired - create new one
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client identifier from request (IP address or forwarded IP)
 */
export function getClientIdentifier(request: Request): string {
  // Check various headers for the real client IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default identifier
  return 'unknown-client'
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict limit for sensitive operations (account deletion)
  sensitive: {
    limit: 3,           // 3 requests
    windowMs: 3600000,  // per hour
  },

  // Standard API limit
  api: {
    limit: 30,          // 30 requests
    windowMs: 60000,    // per minute
  },

  // Lenient limit for data export
  export: {
    limit: 5,           // 5 requests
    windowMs: 3600000,  // per hour
  },

  // Auth rate limits (login/register)
  auth: {
    limit: 5,           // 5 attempts
    windowMs: 900000,   // per 15 minutes
  },

  // Registration rate limit (stricter)
  register: {
    limit: 3,           // 3 registrations
    windowMs: 3600000,  // per hour
  },
}
