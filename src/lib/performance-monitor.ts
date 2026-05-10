// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track page load performance
  trackPageLoad(pageName: string): void {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        this.recordMetric(`page_load_${pageName}`, loadTime)
        
        // Track Core Web Vitals
        this.trackCoreWebVitals(pageName)
      }
    }
  }

  // Track Core Web Vitals
  private trackCoreWebVitals(pageName: string): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.recordMetric(`lcp_${pageName}`, lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set(`lcp_${pageName}`, lcpObserver)

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          this.recordMetric(`fid_${pageName}`, entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set(`fid_${pageName}`, fidObserver)

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.recordMetric(`cls_${pageName}`, clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set(`cls_${pageName}`, clsObserver)
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.recordMetric(`api_${endpoint}_duration`, duration)
    this.recordMetric(`api_${endpoint}_success`, success ? 1 : 0)
  }

  // Track component render performance
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric(`component_render_${componentName}`, renderTime)
  }

  // Track user interaction performance
  trackInteraction(interactionName: string, duration: number): void {
    this.recordMetric(`interaction_${interactionName}`, duration)
  }

  // Record a metric
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
    
    // Keep only last 100 values to prevent memory leaks
    if (this.metrics.get(name)!.length > 100) {
      this.metrics.get(name)!.shift()
    }
  }

  // Get average metric value
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  // Get performance report
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    for (const [name, values] of this.metrics.entries()) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      report[name] = {
        average: avg,
        min,
        max,
        count: values.length,
        recent: values.slice(-10) // Last 10 values
      }
    }
    
    return report
  }

  // Check if performance meets thresholds
  checkPerformanceThresholds(): {
    pageLoad: boolean
    apiCalls: boolean
    interactions: boolean
    coreWebVitals: boolean
  } {
    const thresholds = {
      pageLoad: 2000, // 2 seconds
      apiCalls: 500,  // 500ms
      interactions: 100, // 100ms
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1 // 0.1
    }

    const report = this.getPerformanceReport()
    
    return {
      pageLoad: this.getAverageMetric('page_load') < thresholds.pageLoad,
      apiCalls: this.getAverageMetric('api_duration') < thresholds.apiCalls,
      interactions: this.getAverageMetric('interaction_duration') < thresholds.interactions,
      coreWebVitals: 
        this.getAverageMetric('lcp') < thresholds.lcp &&
        this.getAverageMetric('fid') < thresholds.fid &&
        this.getAverageMetric('cls') < thresholds.cls
    }
  }

  // Cleanup observers
  cleanup(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
  }
}

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance()

  const trackPageLoad = (pageName: string) => {
    monitor.trackPageLoad(pageName)
  }

  const trackApiCall = (endpoint: string, duration: number, success: boolean) => {
    monitor.trackApiCall(endpoint, duration, success)
  }

  const trackComponentRender = (componentName: string, renderTime: number) => {
    monitor.trackComponentRender(componentName, renderTime)
  }

  const trackInteraction = (interactionName: string, duration: number) => {
    monitor.trackInteraction(interactionName, duration)
  }

  const getPerformanceReport = () => {
    return monitor.getPerformanceReport()
  }

  const checkPerformanceThresholds = () => {
    return monitor.checkPerformanceThresholds()
  }

  return {
    trackPageLoad,
    trackApiCall,
    trackComponentRender,
    trackInteraction,
    getPerformanceReport,
    checkPerformanceThresholds
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Memoize expensive calculations
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = func(...args)
      cache.set(key, result)
      return result
    }) as T
  },

  // Batch DOM updates
  batchDOMUpdates(updates: (() => void)[]): void {
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        updates.forEach(update => update())
      })
    } else {
      updates.forEach(update => update())
    }
  },

  // Preload critical resources
  preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image'): void {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      link.as = type
      document.head.appendChild(link)
    }
  },

  // Optimize images
  optimizeImage(url: string, width: number, quality: number = 80): string {
    // Add image optimization parameters
    const params = new URLSearchParams({
      w: width.toString(),
      q: quality.toString(),
      fm: 'webp'
    })
    return `${url}?${params.toString()}`
  }
}

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  API_TIMEOUT: 10000,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_RETRIES: 3,
  BATCH_SIZE: 50,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 50,
  LAZY_LOAD_THRESHOLD: 100
} as const
