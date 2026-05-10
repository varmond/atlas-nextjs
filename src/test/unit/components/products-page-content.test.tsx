import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ProductsPageContent } from '@/app/dashboard/products/products-page-content'
import { createProductData } from '@/test/factories/product-factory'

// Mock the client
vi.mock('@/lib/client', () => ({
  client: {
    product: {
      getProducts: {
        $get: vi.fn(),
      },
    },
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

describe('ProductsPageContent', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the products page with title and description', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: [] }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('0 products found')).toBeInTheDocument()
  })

  it('renders loading state initially', () => {
    const mockGet = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve({ products: [] }),
      }), 100))
    )

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    // The DataTable component should show loading state
    expect(screen.getByText('Products')).toBeInTheDocument()
  })

  it('renders products in the data table', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Product 1',
        itemCode: 'ITEM001',
        sku: 'SKU001',
        price: 10.99,
        type: 'MEDICATION' as any,
      }),
      createProductData({
        id: 'product_2',
        name: 'Product 2',
        itemCode: 'ITEM002',
        sku: 'SKU002',
        price: 15.50,
        type: 'IMMUNIZATION' as any,
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('2 products found')).toBeInTheDocument()
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
      expect(screen.getByText('ITEM001')).toBeInTheDocument()
      expect(screen.getByText('ITEM002')).toBeInTheDocument()
    })
  })

  it('filters products by search term', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Aspirin',
        itemCode: 'ASP001',
        sku: 'SKU001',
      }),
      createProductData({
        id: 'product_2',
        name: 'Ibuprofen',
        itemCode: 'IBU001',
        sku: 'SKU002',
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument()
      expect(screen.getByText('Ibuprofen')).toBeInTheDocument()
    })

    // Search for "Aspirin"
    const searchInput = screen.getByPlaceholderText('Search products...')
    await user.type(searchInput, 'Aspirin')

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument()
      expect(screen.queryByText('Ibuprofen')).not.toBeInTheDocument()
    })
  })

  it('filters products by item code', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Product 1',
        itemCode: 'ABC123',
        sku: 'SKU001',
      }),
      createProductData({
        id: 'product_2',
        name: 'Product 2',
        itemCode: 'XYZ789',
        sku: 'SKU002',
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    // Search by item code
    const searchInput = screen.getByPlaceholderText('Search products...')
    await user.type(searchInput, 'ABC123')

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
    })
  })

  it('filters products by SKU', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Product 1',
        itemCode: 'ITEM001',
        sku: 'SPECIAL_SKU',
      }),
      createProductData({
        id: 'product_2',
        name: 'Product 2',
        itemCode: 'ITEM002',
        sku: 'NORMAL_SKU',
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    // Search by SKU
    const searchInput = screen.getByPlaceholderText('Search products...')
    await user.type(searchInput, 'SPECIAL_SKU')

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no products match search', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Product 1',
        itemCode: 'ITEM001',
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument()
    })

    // Search for non-existent product
    const searchInput = screen.getByPlaceholderText('Search products...')
    await user.type(searchInput, 'NonExistentProduct')

    await waitFor(() => {
      expect(screen.getByText('No products found. Create your first product to get started.')).toBeInTheDocument()
    })
  })

  it('renders product type badges correctly', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Medication Product',
        type: 'MEDICATION' as any,
      }),
      createProductData({
        id: 'product_2',
        name: 'Immunization Product',
        type: 'IMMUNIZATION' as any,
      }),
      createProductData({
        id: 'product_3',
        name: 'Custom Product',
        type: 'CUSTOM' as any,
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Medication')).toBeInTheDocument()
      expect(screen.getByText('Immunization')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })
  })

  it('formats price correctly', async () => {
    const mockProducts = [
      createProductData({
        id: 'product_1',
        name: 'Product 1',
        price: 10.99,
      }),
      createProductData({
        id: 'product_2',
        name: 'Product 2',
        price: 0,
      }),
    ]

    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: mockProducts }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('$10.99')).toBeInTheDocument()
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })
  })

  it('shows error state when API call fails', async () => {
    const mockGet = vi.fn().mockRejectedValue(new Error('API Error'))

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Error Loading Products')).toBeInTheDocument()
      expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument()
    })
  })

  it('renders add product button', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ products: [] }),
    })

    const { client } = await import('@/lib/client')
    client.product.getProducts.$get = mockGet

    render(<ProductsPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument()
    })
  })
})
