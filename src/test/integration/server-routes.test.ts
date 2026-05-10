import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { productRouter } from '@/server/routers/product-router'
import { createProductData, createMinimalValidProduct } from '@/test/factories/product-factory'
import { createUserData } from '@/test/factories/user-factory'

// Mock the database
const mockDb = {
  products: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}

vi.mock('@/db', () => ({
  db: mockDb,
}))

// Mock Prisma Decimal
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual('@prisma/client')
  return {
    ...actual,
    Prisma: {
      Decimal: class MockDecimal {
        constructor(public value: number) {}
        toString() {
          return this.value.toString()
        }
      },
    },
  }
})

describe('Server Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Product API Endpoints', () => {
    it('should handle GET /api/product/getProducts', async () => {
      const mockProducts = [
        createProductData({ id: 'product_1', name: 'Product 1' }),
        createProductData({ id: 'product_2', name: 'Product 2' }),
      ]

      mockDb.products.findMany.mockResolvedValue(mockProducts)

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/product/getProducts',
        headers: {
          'content-type': 'application/json',
        },
      })

      // Mock the context that would be provided by the middleware
      const mockContext = {
        user: createUserData(),
        c: {
          superjson: (data: any) => data,
        },
      }

      const result = await productRouter.getProducts.query(mockContext)

      expect(result).toEqual({ products: mockProducts })
      expect(mockDb.products.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org_123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          itemCode: true,
          price: true,
          packageCost: true,
          manufacturerBarcodeNumber: true,
          sku: true,
          type: true,
          packageUOM: true,
          containerUOM: true,
          quantityPerContainer: true,
          unitUOM: true,
          unitQuantity: true,
          altUOM: true,
          userId: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        }),
        orderBy: { updatedAt: 'desc' },
      })
    })

    it('should handle POST /api/product/createProduct', async () => {
      const productData = createMinimalValidProduct()
      const createdProduct = createProductData(productData)

      mockDb.products.create.mockResolvedValue(createdProduct)

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/product/createProduct',
        headers: {
          'content-type': 'application/json',
        },
        body: productData,
      })

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      const result = await productRouter.createProduct.mutation(mockContext)

      expect(result).toEqual({
        product: {
          ...createdProduct,
          price: createdProduct.price.toString(),
          packageCost: createdProduct.packageCost.toString(),
          unitQuantity: createdProduct.unitQuantity.toString(),
        },
      })

      expect(mockDb.products.create).toHaveBeenCalledWith({
        data: {
          itemCode: productData.itemCode,
          name: productData.name,
          price: expect.any(Object),
          packageCost: expect.any(Object),
          manufacturerBarcodeNumber: '',
          sku: '',
          type: productData.type,
          packageUOM: productData.packageUOM,
          containerUOM: productData.containerUOM,
          quantityPerContainer: productData.quantityPerContainer,
          unitUOM: productData.unitUOM,
          unitQuantity: expect.any(Object),
          userId: 'user_123',
          organizationId: 'org_123',
        },
      })
    })

    it('should handle PUT /api/product/updateProduct', async () => {
      const productData = createProductData({
        id: 'product_123',
        name: 'Updated Product',
        price: 15.99,
      })
      const updatedProduct = createProductData(productData)

      mockDb.products.update.mockResolvedValue(updatedProduct)

      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/product/updateProduct',
        headers: {
          'content-type': 'application/json',
        },
        body: productData,
      })

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      const result = await productRouter.updateProduct.mutation(mockContext)

      expect(result).toEqual({
        product: {
          ...updatedProduct,
          price: updatedProduct.price.toString(),
          packageCost: updatedProduct.packageCost.toString(),
          unitQuantity: updatedProduct.unitQuantity.toString(),
        },
      })

      expect(mockDb.products.update).toHaveBeenCalledWith({
        where: {
          id: 'product_123',
          organizationId: 'org_123',
        },
        data: {
          itemCode: productData.itemCode,
          name: 'Updated Product',
          price: expect.any(Object),
          packageCost: expect.any(Object),
          manufacturerBarcodeNumber: '',
          sku: '',
          type: productData.type,
          packageUOM: productData.packageUOM,
          containerUOM: productData.containerUOM,
          quantityPerContainer: productData.quantityPerContainer,
          unitUOM: productData.unitUOM,
          unitQuantity: expect.any(Object),
        },
      })
    })

    it('should handle DELETE /api/product/deleteProduct', async () => {
      mockDb.products.delete.mockResolvedValue({})

      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/product/deleteProduct?id=product_123',
        headers: {
          'content-type': 'application/json',
        },
      })

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: { id: 'product_123' },
      }

      const result = await productRouter.deleteProduct.mutation(mockContext)

      expect(result).toEqual({ success: true })

      expect(mockDb.products.delete).toHaveBeenCalledWith({
        where: {
          id: 'product_123',
          organizationId: 'org_123',
        },
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed')
      mockDb.products.findMany.mockRejectedValue(dbError)

      const mockContext = {
        user: createUserData(),
        c: {
          superjson: (data: any) => data,
        },
      }

      await expect(
        productRouter.getProducts.query(mockContext)
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle validation errors in createProduct', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        itemCode: '', // Invalid: empty item code
        price: -10, // Invalid: negative price
        packageCost: -5, // Invalid: negative package cost
        type: 'MEDICATION',
        packageUOM: 'BOX',
        containerUOM: 'VIAL',
        quantityPerContainer: 0, // Invalid: zero quantity
        unitUOM: 'ML',
        unitQuantity: -1, // Invalid: negative unit quantity
      }

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: invalidData,
      }

      // The validation should happen at the input level
      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow()
    })

    it('should handle organization access errors', async () => {
      const productData = createMinimalValidProduct()

      const mockContext = {
        user: {
          ...createUserData(),
          organizationId: null, // No organization
        },
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow('User does not belong to an organization')
    })
  })

  describe('Data Validation', () => {
    it('should validate product type enum', async () => {
      const invalidData = {
        ...createMinimalValidProduct(),
        type: 'INVALID_TYPE', // Invalid enum value
      }

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: invalidData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow()
    })

    it('should validate UOM enum values', async () => {
      const invalidData = {
        ...createMinimalValidProduct(),
        packageUOM: 'INVALID_UOM', // Invalid enum value
      }

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: invalidData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow()
    })

    it('should validate numeric constraints', async () => {
      const invalidData = {
        ...createMinimalValidProduct(),
        quantityPerContainer: 0, // Must be at least 1
      }

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: invalidData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow()
    })
  })
})