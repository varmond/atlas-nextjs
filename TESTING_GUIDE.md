# JStack Testing Guide

This guide provides comprehensive information about testing in the JStack application, including setup, running tests, and best practices.

## 🧪 Testing Framework Overview

The JStack application uses a multi-layered testing approach:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test API routes and database interactions
- **E2E Tests**: Test complete user workflows in a real browser environment

### Technologies Used

- **Vitest**: Fast unit and integration testing framework
- **Playwright**: End-to-end testing with real browser automation
- **Testing Library**: React component testing utilities
- **MSW**: API mocking for isolated testing
- **Jest DOM**: Additional DOM matchers for testing

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- Node.js (v18 or higher)
- npm or pnpm
- All project dependencies installed (`npm install`)

### Running Tests

```bash
# Run all tests (unit, integration, e2e)
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run E2E tests with UI
npm run test:e2e:ui

# Check if all prerequisites are met
npm run test:check
```

## 📁 Test Structure

```
src/test/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── utils/             # Utility function tests
│   └── lib/               # Library tests
├── integration/            # Integration tests
│   ├── api/               # API route tests
│   └── server-routes.test.ts
├── e2e/                   # End-to-end tests
│   ├── products-flow.spec.ts
│   └── product-crud.spec.ts
├── mocks/                 # Mock data and handlers
│   ├── handlers.ts
│   └── server.ts
├── factories/             # Test data factories
│   ├── product-factory.ts
│   └── user-factory.ts
├── utils/                 # Test utilities
│   └── test-utils.tsx
├── setup.ts              # Test setup configuration
└── run-tests.ts          # Comprehensive test runner
```

## 🧩 Unit Tests

Unit tests focus on testing individual components and functions in isolation.

### Component Testing

```typescript
// Example: Testing a React component
import { render, screen } from '@/test/utils/test-utils'
import { CreateProductModal } from '@/components/create-product-modal'

test('renders create product modal', () => {
  render(<CreateProductModal><button>Add Product</button></CreateProductModal>)
  expect(screen.getByText('Add Product')).toBeInTheDocument()
})
```

### Key Features

- **Isolated Testing**: Components are tested without external dependencies
- **Mocked APIs**: All API calls are mocked using MSW
- **User Interactions**: Simulated user interactions with Testing Library
- **Form Validation**: Comprehensive form validation testing
- **Error States**: Testing error handling and edge cases

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific unit test file
npx vitest src/test/unit/components/create-product-modal.test.tsx

# Run unit tests in watch mode
npx vitest src/test/unit --watch
```

## 🔗 Integration Tests

Integration tests verify that different parts of the application work together correctly.

### API Route Testing

```typescript
// Example: Testing API routes
import { productRouter } from '@/server/routers/product-router'

test('should create a product successfully', async () => {
  const mockContext = {
    user: createUserData(),
    c: { json: (data: any) => data },
    input: createMinimalValidProduct(),
  }

  const result = await productRouter.createProduct.mutation(mockContext)
  expect(result.product).toBeDefined()
})
```

### Key Features

- **Database Mocking**: Database operations are mocked for isolated testing
- **Authentication Testing**: User authentication and authorization flows
- **Data Validation**: Input validation and error handling
- **Business Logic**: Complex business logic and workflows

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npx vitest src/test/integration/api/product.test.ts
```

## 🌐 End-to-End Tests

E2E tests simulate real user interactions in a browser environment.

### User Workflow Testing

```typescript
// Example: Testing complete user workflow
test('should create, read, update, and delete a product', async ({ page }) => {
  await page.goto('/dashboard/products')
  
  // Create product
  await page.getByRole('button', { name: 'Add Product' }).click()
  await page.getByLabel('Product Name').fill('Test Product')
  await page.getByLabel('Item Code').fill('TEST001')
  await page.getByRole('button', { name: 'Create Product' }).click()
  
  // Verify product was created
  await expect(page.getByText('Test Product')).toBeVisible()
})
```

### Key Features

- **Real Browser Testing**: Tests run in actual browsers (Chrome, Firefox, Safari)
- **Complete Workflows**: End-to-end user journeys
- **Cross-Browser Compatibility**: Tests across different browsers
- **Mobile Testing**: Responsive design and mobile interactions
- **Performance Testing**: Page load times and responsiveness

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test
npx playwright test src/test/e2e/products-flow.spec.ts

# Run E2E tests in headed mode (see browser)
npx playwright test --headed
```

## 🏭 Test Data Factories

Test data factories provide consistent, reusable test data.

### Product Factory

```typescript
// Create test data with defaults
const product = createProductData({
  name: 'Custom Product',
  price: 25.99
})

// Create minimal valid data
const minimalProduct = createMinimalValidProduct()

// Create invalid data for testing validation
const invalidProduct = createInvalidProductData()
```

### User Factory

```typescript
// Create different user types
const regularUser = createUserData()
const superAdmin = createSuperAdminUser()
const userWithoutOrg = createUserWithoutOrganization()
```

## 🎭 Mocking and Test Utilities

### API Mocking with MSW

```typescript
// Mock API responses
export const handlers = [
  http.get('/api/product/getProducts', () => {
    return HttpResponse.json({
      products: [createMockProduct()]
    })
  }),
  
  http.post('/api/product/createProduct', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      product: createMockProduct(body)
    })
  })
]
```

### Test Utilities

```typescript
// Custom render function with providers
import { render } from '@/test/utils/test-utils'

// Renders component with QueryClient, Toaster, etc.
render(<MyComponent />)
```

## 📊 Coverage Reports

Generate and view test coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Coverage Targets

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🐛 Debugging Tests

### Unit/Integration Tests

```bash
# Run tests in debug mode
npx vitest --inspect-brk

# Run specific test with verbose output
npx vitest src/test/unit/components/create-product-modal.test.tsx --reporter=verbose
```

### E2E Tests

```bash
# Run E2E tests in headed mode
npx playwright test --headed

# Run E2E tests with UI
npx playwright test --ui

# Debug specific E2E test
npx playwright test src/test/e2e/products-flow.spec.ts --debug
```

## 🚨 Common Issues and Solutions

### Issue: Tests failing due to missing mocks

**Solution**: Ensure all external dependencies are properly mocked in test setup.

```typescript
// Mock external dependencies
vi.mock('@/lib/client', () => ({
  client: {
    product: {
      createProduct: { $post: vi.fn() }
    }
  }
}))
```

### Issue: E2E tests timing out

**Solution**: Add proper wait conditions and increase timeout if needed.

```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle')

// Wait for specific element
await expect(page.getByText('Product Created')).toBeVisible()
```

### Issue: Database connection errors in tests

**Solution**: Ensure database is properly mocked in integration tests.

```typescript
// Mock database
vi.mock('@/db', () => ({
  db: {
    products: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))
```

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Updated Text')).toBeInTheDocument()
  })
})
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { productRouter } from '@/server/routers/product-router'
import { createProductData } from '@/test/factories/product-factory'

describe('Product Router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create product successfully', async () => {
    const mockContext = {
      user: createUserData(),
      c: { json: (data: any) => data },
      input: createProductData()
    }

    const result = await productRouter.createProduct.mutation(mockContext)
    expect(result.product).toBeDefined()
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/feature')
    await page.waitForLoadState('networkidle')
  })

  test('should complete user workflow', async ({ page }) => {
    // Test user workflow
    await page.getByRole('button', { name: 'Action' }).click()
    await expect(page.getByText('Expected Result')).toBeVisible()
  })
})
```

## 🎯 Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused on a single behavior or feature

### 2. Test Data

- Use factories for consistent test data
- Create minimal test data that only includes necessary fields
- Use realistic data that reflects production scenarios

### 3. Assertions

- Use specific assertions that test the exact behavior
- Test both positive and negative scenarios
- Verify error states and edge cases

### 4. Mocking

- Mock external dependencies to isolate units under test
- Use MSW for API mocking to maintain realistic request/response patterns
- Keep mocks simple and focused

### 5. E2E Testing

- Test complete user workflows, not just individual actions
- Use data-testid attributes for reliable element selection
- Wait for network requests to complete before assertions

## 🔧 Configuration Files

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:coverage
```

## 🎉 Conclusion

This testing framework provides comprehensive coverage for the JStack application, ensuring reliability and maintainability. The multi-layered approach catches issues at different levels, from individual components to complete user workflows.

For questions or issues with testing, refer to:
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

Happy testing! 🧪✨
