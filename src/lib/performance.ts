// Performance optimization utilities for lightning-fast app

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Virtual scrolling helper
export function createVirtualScroller<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const totalHeight = items.length * itemHeight

  return {
    getVisibleRange: (scrollTop: number) => {
      const start = Math.floor(scrollTop / itemHeight)
      const end = Math.min(start + visibleCount + 1, items.length)
      return { start, end }
    },
    getVisibleItems: (scrollTop: number) => {
      const { start, end } = createVirtualScroller(items, itemHeight, containerHeight).getVisibleRange(scrollTop)
      return items.slice(start, end).map((item, index) => ({
        item,
        index: start + index,
        style: {
          position: 'absolute' as const,
          top: (start + index) * itemHeight,
          height: itemHeight,
        },
      }))
    },
    totalHeight,
  }
}

// Optimized data fetching with caching
export class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>()

  constructor(private defaultTTL = 5 * 60 * 1000) {} // 5 minutes default

  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTimer(name: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      this.metrics.get(name)!.push(duration)
    }
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name)
    if (!times || times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [name] of this.metrics) {
      result[name] = this.getAverageTime(name)
    }
    return result
  }

  clear(): void {
    this.metrics.clear()
  }
}

// Lazy loading helper
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  cache = new Map<string, Promise<T>>()
) {
  return (key: string): Promise<T> => {
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const promise = loader()
    cache.set(key, promise)
    return promise
  }
}

// Optimized array operations
export const arrayUtils = {
  // Fast array chunking
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },

  // Fast array deduplication
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array))
  },

  // Fast array intersection
  intersection: <T>(arrays: T[][]): T[] => {
    if (arrays.length === 0) return []
    if (arrays.length === 1) return arrays[0]

    return arrays.reduce((acc, curr) => 
      acc.filter(item => curr.includes(item))
    )
  },

  // Fast array difference
  difference: <T>(array1: T[], array2: T[]): T[] => {
    const set = new Set(array2)
    return array1.filter(item => !set.has(item))
  },
}

// Memory optimization helpers
export const memoryUtils = {
  // Weak map for object caching
  createWeakCache: <T extends object, U>() => new WeakMap<T, U>(),

  // Object pooling for frequently created objects
  createObjectPool: <T>(factory: () => T, reset?: (obj: T) => void) => {
    const pool: T[] = []
    
    return {
      get: (): T => {
        return pool.pop() || factory()
      },
      release: (obj: T) => {
        if (reset) reset(obj)
        pool.push(obj)
      },
      size: () => pool.length,
    }
  },

  // Garbage collection hint
  suggestGC: () => {
    if ('gc' in globalThis) {
      // @ts-ignore
      globalThis.gc()
    }
  },
}

// Network optimization
export const networkUtils = {
  // Request batching
  createBatchProcessor: <T, R>(
    processor: (items: T[]) => Promise<R[]>,
    batchSize = 10,
    delay = 100
  ) => {
    let batch: T[] = []
    let timeout: NodeJS.Timeout | null = null
    const callbacks: Array<(result: R) => void> = []

    const processBatch = async () => {
      if (batch.length === 0) return

      const currentBatch = [...batch]
      const currentCallbacks = [...callbacks]
      
      batch = []
      callbacks.length = 0

      try {
        const results = await processor(currentBatch)
        results.forEach((result, index) => {
          currentCallbacks[index]?.(result)
        })
      } catch (error) {
        currentCallbacks.forEach(callback => {
          try {
            callback(error as R)
          } catch (e) {
            console.error('Error in batch callback:', e)
          }
        })
      }
    }

    return (item: T): Promise<R> => {
      return new Promise((resolve) => {
        batch.push(item)
        callbacks.push(resolve)

        if (batch.length >= batchSize) {
          if (timeout) {
            clearTimeout(timeout)
            timeout = null
          }
          processBatch()
        } else if (!timeout) {
          timeout = setTimeout(processBatch, delay)
        }
      })
    }
  },

  // Request deduplication
  createRequestDeduplicator: <T, R>(fetcher: (params: T) => Promise<R>) => {
    const pending = new Map<string, Promise<R>>()

    return (params: T): Promise<R> => {
      const key = JSON.stringify(params)
      
      if (pending.has(key)) {
        return pending.get(key)!
      }

      const promise = fetcher(params)
      pending.set(key, promise)

      promise.finally(() => {
        pending.delete(key)
      })

      return promise
    }
  },
}

// Export performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Export default cache instance
export const defaultCache = new DataCache()

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  BATCH_SIZE: 10,
  BATCH_DELAY: 100,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 50,
} as const
