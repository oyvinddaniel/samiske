// In-memory search cache with TTL

import { SEARCH_CONFIG } from './searchConstants'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SearchCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  /**
   * Set a cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = SEARCH_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now()
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      const entry = this.cache.get(key)
      if (entry && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })
  }
}

// Singleton instance
export const searchCache = new SearchCache()

// Cache key generators
export const getCacheKey = {
  search: (category: string, query: string, offset: number = 0) =>
    `search:${category}:${query}:${offset}`,

  recent: (category: string, limit: number = 6) =>
    `recent:${category}:${limit}`,

  geography: (type: string, query: string) => `geography:${type}:${query}`,
}

// Auto-cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup()
  }, 5 * 60 * 1000)
}
