import { test, expect } from '@playwright/test'

test.describe('Product CRUD Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/products')
    await page.waitForLoadState('networkidle')
  })

  test('should create, read, update, and delete a product', async ({ page }) => {
    // CREATE: Create a new product
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    await page.getByLabel('Product Name').fill('E2E Test Product')
    await page.getByLabel('Item Code').fill('E2E001')
    await page.getByLabel('Price').fill('25.99')
    await page.getByLabel('Package Cost').fill('20.00')
    await page.getByLabel('SKU').fill('E2E_SKU')
    await page.getByLabel('Manufacturer Barcode').fill('987654321')
    
    // Select product type
    await page.getByLabel('Product Type').click()
    await page.getByText('Medication').click()
    
    // Fill packaging information
    await page.getByLabel('Package UOM').click()
    await page.getByText('Box(es)').click()
    await page.getByLabel('Container Quantity').fill('12')
    await page.getByLabel('Container UOM').click()
    await page.getByText('Vial(s)').click()
    
    // Fill unit information
    await page.getByLabel('Unit Quantity').fill('10.0')
    await page.getByLabel('Unit UOM').click()
    await page.getByText('Milliliter(s)').click()
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Wait for product to be created and modal to close
    await expect(page.getByRole('heading', { name: 'Add New Product' })).not.toBeVisible()
    await expect(page.getByText('E2E Test Product')).toBeVisible()
    
    // READ: Verify product details are displayed correctly
    await expect(page.getByText('E2E001')).toBeVisible()
    await expect(page.getByText('$25.99')).toBeVisible()
    await expect(page.getByText('Medication')).toBeVisible()
    
    // Click on the product to view details
    await page.getByText('E2E Test Product').click()
    
    // Should navigate to product detail page
    await expect(page).toHaveURL(/\/dashboard\/products\/[^\/]+$/)
    
    // Go back to products list
    await page.goBack()
    await page.waitForLoadState('networkidle')
    
    // UPDATE: Edit the product
    // Click the edit button (eye icon should be view, edit should be pencil)
    const editButton = page.locator('button').filter({ hasText: '' }).nth(1) // Second button (edit)
    await editButton.click()
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/dashboard\/products\/[^\/]+\?edit=true$/)
    
    // Update the product name
    await page.getByLabel('Product Name').fill('Updated E2E Test Product')
    await page.getByLabel('Price').fill('29.99')
    
    // Save changes (assuming there's a save button)
    await page.getByRole('button', { name: 'Save' }).click()
    
    // Go back to products list
    await page.goto('/dashboard/products')
    await page.waitForLoadState('networkidle')
    
    // Verify the update
    await expect(page.getByText('Updated E2E Test Product')).toBeVisible()
    await expect(page.getByText('$29.99')).toBeVisible()
    
    // DELETE: Delete the product
    const deleteButton = page.locator('button').filter({ hasText: '' }).nth(2) // Third button (delete)
    await deleteButton.click()
    
    // Confirm deletion (if there's a confirmation dialog)
    await page.getByRole('button', { name: 'Delete' }).click()
    
    // Verify product is deleted
    await expect(page.getByText('Updated E2E Test Product')).not.toBeVisible()
  })

  test('should handle product creation with minimal required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill only required fields
    await page.getByLabel('Product Name').fill('Minimal Product')
    await page.getByLabel('Item Code').fill('MIN001')
    
    // Use default values for other fields
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Verify product is created
    await expect(page.getByText('Minimal Product')).toBeVisible()
    await expect(page.getByText('MIN001')).toBeVisible()
  })

  test('should handle product creation with all optional fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill all fields including optional ones
    await page.getByLabel('Product Name').fill('Complete Product')
    await page.getByLabel('Item Code').fill('COMP001')
    await page.getByLabel('Price').fill('45.50')
    await page.getByLabel('Package Cost').fill('35.00')
    await page.getByLabel('SKU').fill('COMPLETE_SKU')
    await page.getByLabel('Manufacturer Barcode').fill('111222333')
    
    // Select different product type
    await page.getByLabel('Product Type').click()
    await page.getByText('Immunization').click()
    
    // Fill packaging information
    await page.getByLabel('Package UOM').click()
    await page.getByText('Vial(s)').click()
    await page.getByLabel('Container Quantity').fill('5')
    await page.getByLabel('Container UOM').click()
    await page.getByText('Ampule(s)').click()
    
    // Fill unit information
    await page.getByLabel('Unit Quantity').fill('2.5')
    await page.getByLabel('Unit UOM').click()
    await page.getByText('Dose(s)').click()
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Verify all data is displayed correctly
    await expect(page.getByText('Complete Product')).toBeVisible()
    await expect(page.getByText('COMP001')).toBeVisible()
    await expect(page.getByText('$45.50')).toBeVisible()
    await expect(page.getByText('Immunization')).toBeVisible()
  })

  test('should validate product creation with invalid data', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Try to submit with invalid data
    await page.getByLabel('Product Name').fill('') // Empty name
    await page.getByLabel('Item Code').fill('') // Empty item code
    await page.getByLabel('Price').fill('-10') // Negative price
    await page.getByLabel('Package Cost').fill('-5') // Negative package cost
    await page.getByLabel('Unit Quantity').fill('0') // Zero unit quantity
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check all validation errors are shown
    await expect(page.getByText('Name is required.')).toBeVisible()
    await expect(page.getByText('Item code is required.')).toBeVisible()
    await expect(page.getByText('Price must be a positive number.')).toBeVisible()
    await expect(page.getByText('Package cost must be a positive number.')).toBeVisible()
    await expect(page.getByText('Unit quantity must be greater than 0')).toBeVisible()
  })

  test('should handle concurrent product creation', async ({ page, context }) => {
    // Open a second tab
    const page2 = await context.newPage()
    await page2.goto('/dashboard/products')
    await page2.waitForLoadState('networkidle')
    
    // Create product in first tab
    await page.getByRole('button', { name: 'Add Product' }).click()
    await page.getByLabel('Product Name').fill('Concurrent Product 1')
    await page.getByLabel('Item Code').fill('CONC001')
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Create product in second tab
    await page2.getByRole('button', { name: 'Add Product' }).click()
    await page2.getByLabel('Product Name').fill('Concurrent Product 2')
    await page2.getByLabel('Item Code').fill('CONC002')
    await page2.getByRole('button', { name: 'Create Product' }).click()
    
    // Verify both products are created
    await expect(page.getByText('Concurrent Product 1')).toBeVisible()
    await expect(page2.getByText('Concurrent Product 2')).toBeVisible()
    
    // Refresh first tab to see if second product appears
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByText('Concurrent Product 1')).toBeVisible()
    await expect(page.getByText('Concurrent Product 2')).toBeVisible()
    
    await page2.close()
  })

  test('should handle large number of products with pagination', async ({ page }) => {
    // Create multiple products to test pagination
    const productCount = 5 // Adjust based on your page size
    
    for (let i = 1; i <= productCount; i++) {
      await page.getByRole('button', { name: 'Add Product' }).click()
      await page.getByLabel('Product Name').fill(`Pagination Product ${i}`)
      await page.getByLabel('Item Code').fill(`PAG${i.toString().padStart(3, '0')}`)
      await page.getByRole('button', { name: 'Create Product' }).click()
      
      // Wait for product to be created
      await expect(page.getByText(`Pagination Product ${i}`)).toBeVisible()
    }
    
    // Check that all products are visible
    for (let i = 1; i <= productCount; i++) {
      await expect(page.getByText(`Pagination Product ${i}`)).toBeVisible()
    }
    
    // Test search functionality with many products
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('Pagination Product 3')
    
    // Should show only the searched product
    await expect(page.getByText('Pagination Product 3')).toBeVisible()
    await expect(page.getByText('Pagination Product 1')).not.toBeVisible()
    await expect(page.getByText('Pagination Product 2')).not.toBeVisible()
  })

  test('should handle product creation with special characters', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Test with special characters in name and item code
    await page.getByLabel('Product Name').fill('Product with Special Chars: @#$%^&*()')
    await page.getByLabel('Item Code').fill('SPECIAL@#$%')
    await page.getByLabel('SKU').fill('SKU-with-dashes_and_underscores')
    await page.getByLabel('Manufacturer Barcode').fill('123-456-789')
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Verify product is created with special characters
    await expect(page.getByText('Product with Special Chars: @#$%^&*()')).toBeVisible()
    await expect(page.getByText('SPECIAL@#$%')).toBeVisible()
  })

  test('should handle product creation with very long text', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Test with very long product name
    const longName = 'A'.repeat(255) // Very long name
    await page.getByLabel('Product Name').fill(longName)
    await page.getByLabel('Item Code').fill('LONG001')
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Verify product is created (or validation error if there's a length limit)
    // This test helps identify if there are any length limits that need to be handled
    await expect(page.getByText(longName)).toBeVisible()
  })
})
