import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { productRouter } from '@/server/routers/product-router'
import { createProductData, createInvalidProductData, createMinimalValidProduct } from '@/test/factories/product-factory'
import { createUserData, createUserWithoutOrganization } from '@/test/factories/user-factory'
import { ProductType, UOM } from '@prisma/client'

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

describe('Product Router Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getProducts', () => {
    it('should return products for user organization', async () => {
      const mockProducts = [
        createProductData({ id: 'product_1', name: 'Product 1' }),
        createProductData({ id: 'product_2', name: 'Product 2' }),
      ]

      mockDb.products.findMany.mockResolvedValue(mockProducts)

      const mockContext = {
        user: createUserData(),
        c: {
          superjson: (data: any) => data,
        },
      }

      const result = await productRouter.getProducts.query(mockContext)

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

      expect(result).toEqual({ products: mockProducts })
    })

    it('should return empty array when no products found', async () => {
      mockDb.products.findMany.mockResolvedValue([])

      const mockContext = {
        user: createUserData(),
        c: {
          superjson: (data: any) => data,
        },
      }

      const result = await productRouter.getProducts.query(mockContext)

      expect(result).toEqual({ products: [] })
    })
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = createMinimalValidProduct()
      const createdProduct = createProductData(productData)

      mockDb.products.create.mockResolvedValue(createdProduct)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      const result = await productRouter.createProduct.mutation(mockContext)

      expect(mockDb.products.create).toHaveBeenCalledWith({
        data: {
          itemCode: productData.itemCode,
          name: productData.name,
          price: expect.any(Object), // Prisma.Decimal
          packageCost: expect.any(Object), // Prisma.Decimal
          manufacturerBarcodeNumber: '',
          sku: '',
          type: productData.type,
          packageUOM: productData.packageUOM,
          containerUOM: productData.containerUOM,
          quantityPerContainer: productData.quantityPerContainer,
          unitUOM: productData.unitUOM,
          unitQuantity: expect.any(Object), // Prisma.Decimal
          userId: 'user_123',
          organizationId: 'org_123',
        },
      })

      expect(result).toEqual({
        product: {
          ...createdProduct,
          price: createdProduct.price.toString(),
          packageCost: createdProduct.packageCost.toString(),
          unitQuantity: createdProduct.unitQuantity.toString(),
        },
      })
    })

    it('should throw error when user has no organization', async () => {
      const productData = createMinimalValidProduct()

      const mockContext = {
        user: createUserWithoutOrganization(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow('User does not belong to an organization')
    })

    it('should validate required fields', async () => {
      const invalidData = createInvalidProductData()

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: invalidData,
      }

      // The validation should happen at the input level before reaching the mutation
      // This test ensures the zod schema validation works
      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow()
    })

    it('should handle database errors gracefully', async () => {
      const productData = createMinimalValidProduct()
      const dbError = new Error('Database connection failed')

      mockDb.products.create.mockRejectedValue(dbError)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await expect(
        productRouter.createProduct.mutation(mockContext)
      ).rejects.toThrow('Database connection failed')
    })

    it('should create product with all optional fields', async () => {
      const productData = createProductData({
        manufacturerBarcodeNumber: '123456789',
        sku: 'SKU001',
      })
      const createdProduct = createProductData(productData)

      mockDb.products.create.mockResolvedValue(createdProduct)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await productRouter.createProduct.mutation(mockContext)

      expect(mockDb.products.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          manufacturerBarcodeNumber: '123456789',
          sku: 'SKU001',
        }),
      })
    })
  })

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const productData = createProductData({
        id: 'product_123',
        name: 'Updated Product',
        price: 15.99,
      })
      const updatedProduct = createProductData(productData)

      mockDb.products.update.mockResolvedValue(updatedProduct)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      const result = await productRouter.updateProduct.mutation(mockContext)

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

      expect(result).toEqual({
        product: {
          ...updatedProduct,
          price: updatedProduct.price.toString(),
          packageCost: updatedProduct.packageCost.toString(),
          unitQuantity: updatedProduct.unitQuantity.toString(),
        },
      })
    })

    it('should throw error when user has no organization', async () => {
      const productData = createProductData({ id: 'product_123' })

      const mockContext = {
        user: createUserWithoutOrganization(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await expect(
        productRouter.updateProduct.mutation(mockContext)
      ).rejects.toThrow('User does not belong to an organization')
    })

    it('should handle product not found', async () => {
      const productData = createProductData({ id: 'nonexistent' })
      const notFoundError = new Error('Record to update not found')

      mockDb.products.update.mockRejectedValue(notFoundError)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: productData,
      }

      await expect(
        productRouter.updateProduct.mutation(mockContext)
      ).rejects.toThrow('Record to update not found')
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      mockDb.products.delete.mockResolvedValue({})

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: { id: 'product_123' },
      }

      const result = await productRouter.deleteProduct.mutation(mockContext)

      expect(mockDb.products.delete).toHaveBeenCalledWith({
        where: {
          id: 'product_123',
          organizationId: 'org_123',
        },
      })

      expect(result).toEqual({ success: true })
    })

    it('should throw error when user has no organization', async () => {
      const mockContext = {
        user: createUserWithoutOrganization(),
        c: {
          json: (data: any) => data,
        },
        input: { id: 'product_123' },
      }

      await expect(
        productRouter.deleteProduct.mutation(mockContext)
      ).rejects.toThrow('User does not belong to an organization')
    })

    it('should handle product not found during deletion', async () => {
      const notFoundError = new Error('Record to delete does not exist')
      mockDb.products.delete.mockRejectedValue(notFoundError)

      const mockContext = {
        user: createUserData(),
        c: {
          json: (data: any) => data,
        },
        input: { id: 'nonexistent' },
      }

      await expect(
        productRouter.deleteProduct.mutation(mockContext)
      ).rejects.toThrow('Record to delete does not exist')
    })
  })
})
