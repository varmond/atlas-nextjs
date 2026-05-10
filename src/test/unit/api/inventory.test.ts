import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock the client
vi.mock('@/lib/client', () => ({
  client: {
    inventory: {
      get: vi.fn(),
      post: vi.fn(),
    }
  }
}))

describe('Inventory API', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('should fetch inventory list', async () => {
    server.use(
      http.get('/api/inventory', () => {
        return HttpResponse.json({
          inventory: [
            {
              id: '1',
              productId: 'prod-1',
              locationId: 'loc-1',
              quantity: 100,
              expirationDate: '2024-12-31',
              lotNumber: 'LOT001'
            }
          ]
        })
      })
    )

    const response = await fetch('/api/inventory')
    const data = await response.json()
    
    expect(data.inventory).toHaveLength(1)
    expect(data.inventory[0].id).toBe('1')
    expect(data.inventory[0].quantity).toBe(100)
  })

  it('should create new inventory item', async () => {
    const newInventory = {
      productId: 'prod-2',
      locationId: 'loc-1',
      quantity: 50,
      expirationDate: '2024-11-30',
      lotNumber: 'LOT002'
    }

    server.use(
      http.post('/api/inventory', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({
          inventory: {
            id: '2',
            ...body
          }
        })
      })
    )

    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInventory)
    })
    
    const data = await response.json()
    expect(data.inventory.id).toBe('2')
    expect(data.inventory.productId).toBe('prod-2')
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get('/api/inventory', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )

    const response = await fetch('/api/inventory')
    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Internal Server Error')
  })
})
