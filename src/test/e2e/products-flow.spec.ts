import { test, expect } from '@playwright/test'

test.describe('Products Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - you may need to adjust this based on your auth setup
    await page.goto('/dashboard/products')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display products page with correct title and description', async ({ page }) => {
    // Check page title and description
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    await expect(page.getByText(/products found/)).toBeVisible()
  })

  test('should show add product button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Product' })).toBeVisible()
  })

  test('should open create product modal when add product button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Check modal is open
    await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible()
    await expect(page.getByText('Create a new product in your inventory')).toBeVisible()
  })

  test('should display all required form fields in create product modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Basic information fields
    await expect(page.getByLabel('Product Name')).toBeVisible()
    await expect(page.getByLabel('Item Code')).toBeVisible()
    await expect(page.getByLabel('Price')).toBeVisible()
    await expect(page.getByLabel('Package Cost')).toBeVisible()
    await expect(page.getByLabel('SKU')).toBeVisible()
    await expect(page.getByLabel('Manufacturer Barcode')).toBeVisible()
    await expect(page.getByLabel('Product Type')).toBeVisible()
    
    // Packaging information fields
    await expect(page.getByLabel('Package UOM')).toBeVisible()
    await expect(page.getByLabel('Container Quantity')).toBeVisible()
    await expect(page.getByLabel('Container UOM')).toBeVisible()
    
    // Unit information fields
    await expect(page.getByLabel('Unit Quantity')).toBeVisible()
    await expect(page.getByLabel('Unit UOM')).toBeVisible()
  })

  test('should validate required fields when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Try to submit without filling any fields
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check for validation errors
    await expect(page.getByText('Name is required.')).toBeVisible()
    await expect(page.getByText('Item code is required.')).toBeVisible()
  })

  test('should validate price and package cost are positive numbers', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill in negative values
    await page.getByLabel('Price').fill('-10')
    await page.getByLabel('Package Cost').fill('-5')
    
    // Fill required fields to avoid other validation errors
    await page.getByLabel('Product Name').fill('Test Product')
    await page.getByLabel('Item Code').fill('TEST001')
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check for validation errors
    await expect(page.getByText('Price must be a positive number.')).toBeVisible()
    await expect(page.getByText('Package cost must be a positive number.')).toBeVisible()
  })

  test('should validate unit quantity is greater than 0', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill in zero unit quantity
    await page.getByLabel('Unit Quantity').fill('0')
    
    // Fill required fields
    await page.getByLabel('Product Name').fill('Test Product')
    await page.getByLabel('Item Code').fill('TEST001')
    
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check for validation error
    await expect(page.getByText('Unit quantity must be greater than 0')).toBeVisible()
  })

  test('should successfully create a product with valid data', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill in all required fields
    await page.getByLabel('Product Name').fill('Test Medication')
    await page.getByLabel('Item Code').fill('MED001')
    await page.getByLabel('Price').fill('15.99')
    await page.getByLabel('Package Cost').fill('12.50')
    await page.getByLabel('SKU').fill('SKU001')
    await page.getByLabel('Manufacturer Barcode').fill('123456789')
    
    // Select product type
    await page.getByLabel('Product Type').click()
    await page.getByText('Medication').click()
    
    // Select package UOM
    await page.getByLabel('Package UOM').click()
    await page.getByText('Box(es)').click()
    
    // Fill container quantity
    await page.getByLabel('Container Quantity').fill('10')
    
    // Select container UOM
    await page.getByLabel('Container UOM').click()
    await page.getByText('Vial(s)').click()
    
    // Fill unit quantity
    await page.getByLabel('Unit Quantity').fill('5.0')
    
    // Select unit UOM
    await page.getByLabel('Unit UOM').click()
    await page.getByText('Milliliter(s)').click()
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check that modal closes and product appears in the list
    await expect(page.getByRole('heading', { name: 'Add New Product' })).not.toBeVisible()
    
    // Wait for the product to appear in the list
    await expect(page.getByText('Test Medication')).toBeVisible()
    await expect(page.getByText('MED001')).toBeVisible()
  })

  test('should show loading state during product creation', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill in required fields
    await page.getByLabel('Product Name').fill('Test Product')
    await page.getByLabel('Item Code').fill('TEST001')
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check for loading state
    await expect(page.getByText('Creating...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Creating...' })).toBeDisabled()
  })

  test('should close modal when cancel button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Check modal is open
    await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible()
    
    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click()
    
    // Check modal is closed
    await expect(page.getByRole('heading', { name: 'Add New Product' })).not.toBeVisible()
  })

  test('should search products by name', async ({ page }) => {
    // First create a product to search for
    await page.getByRole('button', { name: 'Add Product' }).click()
    await page.getByLabel('Product Name').fill('Unique Product Name')
    await page.getByLabel('Item Code').fill('UNIQUE001')
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Wait for product to be created
    await expect(page.getByText('Unique Product Name')).toBeVisible()
    
    // Search for the product
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('Unique Product Name')
    
    // Check that only the searched product is visible
    await expect(page.getByText('Unique Product Name')).toBeVisible()
  })

  test('should search products by item code', async ({ page }) => {
    // Create a product with a specific item code
    await page.getByRole('button', { name: 'Add Product' }).click()
    await page.getByLabel('Product Name').fill('Searchable Product')
    await page.getByLabel('Item Code').fill('SEARCH123')
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Wait for product to be created
    await expect(page.getByText('Searchable Product')).toBeVisible()
    
    // Search by item code
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('SEARCH123')
    
    // Check that the product is found
    await expect(page.getByText('Searchable Product')).toBeVisible()
  })

  test('should search products by SKU', async ({ page }) => {
    // Create a product with a specific SKU
    await page.getByRole('button', { name: 'Add Product' }).click()
    await page.getByLabel('Product Name').fill('SKU Product')
    await page.getByLabel('Item Code').fill('SKU001')
    await page.getByLabel('SKU').fill('SPECIAL_SKU_123')
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Wait for product to be created
    await expect(page.getByText('SKU Product')).toBeVisible()
    
    // Search by SKU
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('SPECIAL_SKU_123')
    
    // Check that the product is found
    await expect(page.getByText('SKU Product')).toBeVisible()
  })

  test('should show empty state when no products match search', async ({ page }) => {
    // Search for non-existent product
    const searchInput = page.getByPlaceholder('Search products...')
    await searchInput.fill('NonExistentProduct')
    
    // Check empty state message
    await expect(page.getByText('No products found. Create your first product to get started.')).toBeVisible()
  })

  test('should display product type badges correctly', async ({ page }) => {
    // Create products with different types
    const productTypes = [
      { name: 'Medication Product', type: 'Medication' },
      { name: 'Immunization Product', type: 'Immunization' },
      { name: 'Custom Product', type: 'Custom' },
    ]
    
    for (const product of productTypes) {
      await page.getByRole('button', { name: 'Add Product' }).click()
      await page.getByLabel('Product Name').fill(product.name)
      await page.getByLabel('Item Code').fill(`ITEM_${product.type.toUpperCase()}`)
      
      // Select product type
      await page.getByLabel('Product Type').click()
      await page.getByText(product.type).click()
      
      await page.getByRole('button', { name: 'Create Product' }).click()
      
      // Wait for product to be created
      await expect(page.getByText(product.name)).toBeVisible()
    }
    
    // Check that badges are displayed
    await expect(page.getByText('Medication')).toBeVisible()
    await expect(page.getByText('Immunization')).toBeVisible()
    await expect(page.getByText('Custom')).toBeVisible()
  })

  test('should format prices correctly in the table', async ({ page }) => {
    // Create a product with specific price
    await page.getByRole('button', { name: 'Add Product' }).click()
    await page.getByLabel('Product Name').fill('Price Test Product')
    await page.getByLabel('Item Code').fill('PRICE001')
    await page.getByLabel('Price').fill('19.99')
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Wait for product to be created
    await expect(page.getByText('Price Test Product')).toBeVisible()
    
    // Check that price is formatted correctly
    await expect(page.getByText('$19.99')).toBeVisible()
  })

  test('should show error state when API call fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/product/getProducts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })
    
    // Reload the page to trigger the API call
    await page.reload()
    
    // Check error state
    await expect(page.getByText('Error Loading Products')).toBeVisible()
    await expect(page.getByText('Failed to load products. Please try again.')).toBeVisible()
  })

  test('should handle product creation API failure gracefully', async ({ page }) => {
    // Mock API failure for product creation
    await page.route('**/api/product/createProduct', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Validation failed' }),
      })
    })
    
    await page.getByRole('button', { name: 'Add Product' }).click()
    
    // Fill in required fields
    await page.getByLabel('Product Name').fill('Test Product')
    await page.getByLabel('Item Code').fill('TEST001')
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Product' }).click()
    
    // Check that error is handled (modal should remain open)
    await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible()
  })
})
