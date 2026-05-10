import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { CreateProductModal } from '@/components/create-product-modal'
import { ProductType, UOM } from '@prisma/client'
import { createProductFormData, createInvalidProductData } from '@/test/factories/product-factory'

// Mock the client
vi.mock('@/lib/client', () => ({
  client: {
    product: {
      createProduct: {
        $post: vi.fn(),
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

describe('CreateProductModal', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the modal trigger button', () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    expect(screen.getByText('Add Product')).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    expect(screen.getByText('Add New Product')).toBeInTheDocument()
    expect(screen.getByText('Create a new product in your inventory')).toBeInTheDocument()
  })

  it('renders all required form fields', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    // Basic information fields
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Item Code')).toBeInTheDocument()
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Package Cost')).toBeInTheDocument()
    expect(screen.getByLabelText('SKU')).toBeInTheDocument()
    expect(screen.getByLabelText('Manufacturer Barcode')).toBeInTheDocument()
    expect(screen.getByLabelText('Product Type')).toBeInTheDocument()

    // Packaging information fields
    expect(screen.getByLabelText('Package UOM')).toBeInTheDocument()
    expect(screen.getByLabelText('Container Quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Container UOM')).toBeInTheDocument()

    // Unit information fields
    expect(screen.getByLabelText('Unit Quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Unit UOM')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))
    await user.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument()
      expect(screen.getByText('Item code is required.')).toBeInTheDocument()
    })
  })

  it('validates price and package cost are positive numbers', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    const priceInput = screen.getByLabelText('Price')
    const packageCostInput = screen.getByLabelText('Package Cost')

    await user.type(priceInput, '-10')
    await user.type(packageCostInput, '-5')
    await user.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(screen.getByText('Price must be a positive number.')).toBeInTheDocument()
      expect(screen.getByText('Package cost must be a positive number.')).toBeInTheDocument()
    })
  })

  it('validates unit quantity is greater than 0', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    const unitQuantityInput = screen.getByLabelText('Unit Quantity')
    await user.clear(unitQuantityInput)
    await user.type(unitQuantityInput, '0')
    await user.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(screen.getByText('Unit quantity must be greater than 0')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ product: { id: 'new-product' } }),
    })

    const { client } = await import('@/lib/client')
    client.product.createProduct.$post = mockPost

    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    const formData = createProductFormData()

    // Fill in the form
    await user.type(screen.getByLabelText('Product Name'), formData.name)
    await user.type(screen.getByLabelText('Item Code'), formData.itemCode)
    await user.type(screen.getByLabelText('Price'), formData.price)
    await user.type(screen.getByLabelText('Package Cost'), formData.packageCost)
    await user.type(screen.getByLabelText('SKU'), formData.sku)
    await user.type(screen.getByLabelText('Manufacturer Barcode'), formData.manufacturerBarcodeNumber)

    // Select product type
    await user.click(screen.getByLabelText('Product Type'))
    await user.click(screen.getByText('Medication'))

    // Select package UOM
    await user.click(screen.getByLabelText('Package UOM'))
    await user.click(screen.getByText('Box(es)'))

    // Fill container quantity
    await user.type(screen.getByLabelText('Container Quantity'), formData.quantityPerContainer.toString())

    // Select container UOM
    await user.click(screen.getByLabelText('Container UOM'))
    await user.click(screen.getByText('Vial(s)'))

    // Fill unit quantity
    await user.type(screen.getByLabelText('Unit Quantity'), formData.unitQuantity.toString())

    // Select unit UOM
    await user.click(screen.getByLabelText('Unit UOM'))
    await user.click(screen.getByText('Milliliter(s)'))

    // Submit the form
    await user.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith({
        name: formData.name,
        itemCode: formData.itemCode,
        price: parseFloat(formData.price),
        packageCost: parseFloat(formData.packageCost),
        manufacturerBarcodeNumber: formData.manufacturerBarcodeNumber,
        sku: formData.sku,
        type: formData.type,
        packageUOM: formData.packageUOM,
        containerUOM: formData.containerUOM,
        quantityPerContainer: formData.quantityPerContainer,
        unitUOM: formData.unitUOM,
        unitQuantity: formData.unitQuantity,
      })
    })
  })

  it('shows loading state during submission', async () => {
    const mockPost = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve({ product: { id: 'new-product' } }),
      }), 100))
    )

    const { client } = await import('@/lib/client')
    client.product.createProduct.$post = mockPost

    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    const formData = createProductFormData()

    // Fill in minimal required fields
    await user.type(screen.getByLabelText('Product Name'), formData.name)
    await user.type(screen.getByLabelText('Item Code'), formData.itemCode)

    // Submit the form
    await user.click(screen.getByText('Create Product'))

    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
  })

  it('closes modal on successful submission', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ product: { id: 'new-product' } }),
    })

    const { client } = await import('@/lib/client')
    client.product.createProduct.$post = mockPost

    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))

    const formData = createProductFormData()

    // Fill in minimal required fields
    await user.type(screen.getByLabelText('Product Name'), formData.name)
    await user.type(screen.getByLabelText('Item Code'), formData.itemCode)

    // Submit the form
    await user.click(screen.getByText('Create Product'))

    await waitFor(() => {
      expect(screen.queryByText('Add New Product')).not.toBeInTheDocument()
    })
  })

  it('closes modal when cancel is clicked', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    await user.click(screen.getByText('Add Product'))
    await user.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Add New Product')).not.toBeInTheDocument()
  })

  it('resets form when modal is closed and reopened', async () => {
    render(
      <CreateProductModal>
        <button>Add Product</button>
      </CreateProductModal>
    )

    // Open modal and fill some data
    await user.click(screen.getByText('Add Product'))
    await user.type(screen.getByLabelText('Product Name'), 'Test Product')

    // Close modal
    await user.click(screen.getByText('Cancel'))

    // Reopen modal
    await user.click(screen.getByText('Add Product'))

    // Check that form is reset
    expect(screen.getByLabelText('Product Name')).toHaveValue('')
  })
})
