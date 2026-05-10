import { ProductType, UOM } from '@prisma/client'

export interface ProductFactoryOptions {
  name?: string
  itemCode?: string
  sku?: string
  price?: number
  packageCost?: number
  manufacturerBarcodeNumber?: string
  type?: ProductType
  packageUOM?: UOM
  containerUOM?: UOM
  quantityPerContainer?: number
  unitUOM?: UOM
  unitQuantity?: number
  organizationId?: string
  userId?: string
}

export const createProductData = (overrides: ProductFactoryOptions = {}) => ({
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
  organizationId: 'org_123',
  userId: 'user_123',
  ...overrides,
})

export const createProductFormData = (overrides: ProductFactoryOptions = {}) => ({
  name: 'Test Product',
  itemCode: 'TEST001',
  price: '10.99',
  packageCost: '8.50',
  manufacturerBarcodeNumber: '123456789',
  sku: 'SKU001',
  type: ProductType.MEDICATION,
  packageUOM: UOM.BOX,
  containerUOM: UOM.VIAL,
  quantityPerContainer: 10,
  unitUOM: UOM.ML,
  unitQuantity: 5.0,
  ...overrides,
})

export const createInvalidProductData = () => ({
  name: '', // Invalid: empty name
  itemCode: '', // Invalid: empty item code
  price: -10, // Invalid: negative price
  packageCost: -5, // Invalid: negative package cost
  type: ProductType.MEDICATION,
  packageUOM: UOM.BOX,
  containerUOM: UOM.VIAL,
  quantityPerContainer: 0, // Invalid: zero quantity
  unitUOM: UOM.ML,
  unitQuantity: -1, // Invalid: negative unit quantity
})

export const createMinimalValidProduct = () => ({
  name: 'Minimal Product',
  itemCode: 'MIN001',
  price: 0,
  packageCost: 0,
  type: ProductType.GENERAL,
  packageUOM: UOM.UNIT,
  containerUOM: UOM.UNIT,
  quantityPerContainer: 1,
  unitUOM: UOM.UNIT,
  unitQuantity: 1,
})
