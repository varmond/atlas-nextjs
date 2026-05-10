import { test, expect } from '@playwright/test'

test.describe('Inventory Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard and login
    await page.goto('/dashboard')
    // Add login logic here based on your auth setup
  })

  test('should add new inventory item', async ({ page }) => {
    // Navigate to add inventory page
    await page.click('[data-testid="add-inventory-button"]')
    
    // Fill out the form
    await page.fill('[data-testid="product-select"]', 'Test Product')
    await page.fill('[data-testid="quantity-input"]', '100')
    await page.fill('[data-testid="lot-number-input"]', 'LOT001')
    await page.fill('[data-testid="expiration-date-input"]', '2024-12-31')
    
    // Submit the form
    await page.click('[data-testid="submit-button"]')
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify item appears in inventory list
    await page.goto('/dashboard/inventory')
    await expect(page.locator('text=LOT001')).toBeVisible()
  })

  test('should dispense inventory item', async ({ page }) => {
    // Navigate to dispense page
    await page.goto('/dashboard/inventory/dispense')
    
    // Select inventory item
    await page.click('[data-testid="inventory-item-1"]')
    
    // Enter dispense quantity
    await page.fill('[data-testid="dispense-quantity"]', '10')
    await page.fill('[data-testid="dispense-notes"]', 'Patient medication')
    
    // Submit dispense
    await page.click('[data-testid="dispense-submit"]')
    
    // Verify success
    await expect(page.locator('[data-testid="dispense-success"]')).toBeVisible()
  })

  test('should transfer inventory between locations', async ({ page }) => {
    // Navigate to transfer page
    await page.goto('/dashboard/inventory/transfers')
    
    // Select source and destination locations
    await page.selectOption('[data-testid="from-location"]', 'loc-1')
    await page.selectOption('[data-testid="to-location"]', 'loc-2')
    
    // Select items to transfer
    await page.check('[data-testid="item-checkbox-1"]')
    await page.fill('[data-testid="transfer-quantity-1"]', '5')
    
    // Submit transfer
    await page.click('[data-testid="transfer-submit"]')
    
    // Verify success
    await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible()
  })

  test('should view inventory reports', async ({ page }) => {
    // Navigate to reports page
    await page.goto('/dashboard/reports')
    
    // Check that reports are displayed
    await expect(page.locator('[data-testid="stock-levels-report"]')).toBeVisible()
    await expect(page.locator('[data-testid="low-stock-alerts"]')).toBeVisible()
    await expect(page.locator('[data-testid="expiration-tracking"]')).toBeVisible()
  })
})
