import { describe, it, expect } from 'vitest'
import { debounce, throttle } from '@/lib/utils'

describe('Performance Utilities', () => {
  describe('debounce', () => {
    it('should delay function execution', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(callCount).toBe(0)

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(callCount).toBe(1)
    })

    it('should reset delay on subsequent calls', async () => {
      let callCount = 0
      const debouncedFn = debounce(() => {
        callCount++
      }, 100)

      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 50))
      debouncedFn() // This should reset the timer
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(callCount).toBe(0) // Should not have been called yet
      
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(callCount).toBe(1) // Should have been called once
    })
  })

  describe('throttle', () => {
    it('should limit function execution frequency', async () => {
      let callCount = 0
      const throttledFn = throttle(() => {
        callCount++
      }, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(callCount).toBe(1) // Should be called immediately

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150))
      throttledFn()
      expect(callCount).toBe(2) // Should be called again after throttle period
    })
  })
})
