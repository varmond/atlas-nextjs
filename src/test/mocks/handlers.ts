import { http, HttpResponse } from 'msw'
import { ProductType, UOM } from '@prisma/client'

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user_123',
  externalId: 'clerk_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  organizationId: 'org_123',
  isSuperAdmin: false,
  supportTier: 'NONE',
  ...overrides,
})

export const createMockOrganization = (overrides = {}) => ({
  id: 'org_123',
  name: 'Test Organization',
  slug: 'test-org',
  ...overrides,
})

export const createMockProduct = (overrides = {}) => ({
  id: 'product_123',
  name: 'Test Product',
  itemCode: 'TEST001',
  sku: 'SKU001',
  price: 10.99,
  packageCost: 8.50,
  manufacturerBarcodeNumber: '123456789',
  type: ProductType.MEDICATION,
  packageUOM: UOM.BOX,
  containerUOM: UOM.VIAL,
  quantityPerContainer: 10,
  unitUOM: UOM.ML,
  unitQuantity: 5.0,
  altUOM: null,
  userId: 'user_123',
  organizationId: 'org_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// API handlers
export const handlers = [
  // Auth endpoints
  http.get('/api/auth/me', () => {
    return HttpResponse.json(createMockUser())
  }),

  // Organization endpoints
  http.get('/api/organization/getCurrentOrganization', () => {
    return HttpResponse.json(createMockOrganization())
  }),

  http.get('/api/organization/getUserOrganizations', () => {
    return HttpResponse.json([createMockOrganization()])
  }),

  // Product endpoints
  http.get('/api/product/getProducts', () => {
    return HttpResponse.json({
      products: [
        createMockProduct(),
        createMockProduct({
          id: 'product_456',
          name: 'Another Product',
          itemCode: 'TEST002',
        }),
      ],
    })
  }),

  http.post('/api/product/createProduct', async ({ request }) => {
    const body = await request.json()
    
    // Simulate validation errors
    if (!body.name) {
      return HttpResponse.json(
        { error: 'Name is required.' },
        { status: 400 }
      )
    }
    
    if (!body.itemCode) {
      return HttpResponse.json(
        { error: 'Item code is required.' },
        { status: 400 }
      )
    }

    if (body.price < 0) {
      return HttpResponse.json(
        { error: 'Price must be a positive number.' },
        { status: 400 }
      )
    }

    // Simulate successful creation
    return HttpResponse.json({
      product: createMockProduct({
        name: body.name,
        itemCode: body.itemCode,
        price: body.price,
        packageCost: body.packageCost,
        type: body.type,
        packageUOM: body.packageUOM,
        containerUOM: body.containerUOM,
        quantityPerContainer: body.quantityPerContainer,
        unitUOM: body.unitUOM,
        unitQuantity: body.unitQuantity,
      }),
    })
  }),

  http.put('/api/product/updateProduct', async ({ request }) => {
    const body = await request.json()
    
    if (!body.id) {
      return HttpResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      product: createMockProduct({
        id: body.id,
        name: body.name,
        itemCode: body.itemCode,
        price: body.price,
        packageCost: body.packageCost,
        type: body.type,
        packageUOM: body.packageUOM,
        containerUOM: body.containerUOM,
        quantityPerContainer: body.quantityPerContainer,
        unitUOM: body.unitUOM,
        unitQuantity: body.unitQuantity,
      }),
    })
  }),

  http.delete('/api/product/deleteProduct', async ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return HttpResponse.json(
        { error: 'Product ID is required.' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ success: true })
  }),

  // Category endpoints
  http.get('/api/category/getEventCategories', () => {
    return HttpResponse.json({
      categories: [
        { id: 'cat_1', name: 'Medication', color: '#3B82F6' },
        { id: 'cat_2', name: 'Immunization', color: '#10B981' },
      ],
    })
  }),

  // Inventory endpoints
  http.get('/api/inventory/getInventory', () => {
    return HttpResponse.json({
      inventory: [],
    })
  }),

  http.get('/api/inventory/getProducts', () => {
    return HttpResponse.json({
      products: [createMockProduct()],
    })
  }),

  // Vendor endpoints
  http.get('/api/vendor/getVendors', () => {
    return HttpResponse.json({
      vendors: [
        { id: 'vendor_1', name: 'Test Vendor', email: 'vendor@test.com' },
      ],
    })
  }),
]