import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test string concatenation', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World')
  })

  it('should test array operations', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr.includes(2)).toBe(true)
  })
})
