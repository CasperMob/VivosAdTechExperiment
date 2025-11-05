import { AdResult } from '@/types'

interface CachedAd {
  ad: AdResult
  timestamp: number
  query: string
}

class AdCache {
  private cache: Map<string, CachedAd>
  private recentlyShown: Set<string>
  private maxCacheSize = 50
  private cacheDuration = 1000 * 60 * 30 // 30 minutes
  private recentWindowSize = 10

  constructor() {
    this.cache = new Map()
    this.recentlyShown = new Set()
  }

  /**
   * Get a cached ad for a query
   */
  get(query: string): AdResult | null {
    const normalizedQuery = this.normalizeQuery(query)
    const cached = this.cache.get(normalizedQuery)

    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheDuration) {
      this.cache.delete(normalizedQuery)
      return null
    }

    return cached.ad
  }

  /**
   * Store an ad in cache
   */
  set(query: string, ad: AdResult): void {
    const normalizedQuery = this.normalizeQuery(query)

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(normalizedQuery, {
      ad,
      timestamp: Date.now(),
      query: normalizedQuery,
    })
  }

  /**
   * Check if an ad was recently shown
   */
  wasRecentlyShown(adTitle: string): boolean {
    return this.recentlyShown.has(adTitle.toLowerCase())
  }

  /**
   * Mark an ad as recently shown
   */
  markAsShown(adTitle: string): void {
    this.recentlyShown.add(adTitle.toLowerCase())

    // Limit the size of recently shown set
    if (this.recentlyShown.size > this.recentWindowSize) {
      const firstItem = this.recentlyShown.values().next().value
      this.recentlyShown.delete(firstItem)
    }
  }

  /**
   * Normalize query for cache key
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ')
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheDuration) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const adCache = new AdCache()

// Cleanup every 10 minutes
setInterval(() => {
  adCache.cleanup()
}, 1000 * 60 * 10)

