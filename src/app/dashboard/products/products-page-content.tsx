"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { CreateProductModal } from "@/components/create-product-modal"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import {
  Package,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Tag,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  sku: string
  itemCode: string
  price: number
  packageCost: number
  type: string
  packageUOM: string
  containerUOM: string
  quantityPerContainer: number
  unitUOM: string
  unitQuantity: number
  manufacturerBarcodeNumber?: string
  createdAt: string
  updatedAt: string
}

// Memoized product type badge component
const ProductTypeBadge = memo(({ type }: { type: string }) => {
  const colorMap = {
    MEDICATION: "bg-blue-50 text-blue-700 border-blue-200",
    IMMUNIZATION: "bg-green-50 text-green-700 border-green-200",
    GENERAL: "bg-gray-50 text-gray-700 border-gray-200",
    CUSTOM: "bg-purple-50 text-purple-700 border-purple-200",
  }

  const labelMap = {
    MEDICATION: "Medication",
    IMMUNIZATION: "Immunization", 
    GENERAL: "General",
    CUSTOM: "Custom",
  }

  return (
    <Badge variant="outline" className={colorMap[type as keyof typeof colorMap] || colorMap.GENERAL}>
      {labelMap[type as keyof typeof labelMap] || type}
    </Badge>
  )
})

ProductTypeBadge.displayName = "ProductTypeBadge"

// Memoized action buttons component
const ActionButtons = memo(({ product }: { product: Product }) => (
  <div className="flex items-center space-x-2">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="View Details"
      asChild
    >
      <Link href={`/dashboard/products/${product.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="Edit Product"
      asChild
    >
      <Link href={`/dashboard/products/${product.id}?edit=true`}>
        <Edit className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
      title="Delete Product"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
))

ActionButtons.displayName = "ActionButtons"

export function ProductsPageContent() {
  const { toast } = useToast()

  // Query to fetch products
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await client.product.getProducts.$get()
      const data = await response.json()
      return data.products || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Memoized statistics
  const stats = useMemo(() => {
    if (!data) return { totalProducts: 0, totalValue: '0.00', byType: {} }

    const totalProducts = data.length
    const totalValue = data.reduce((sum: number, product: Product) => {
      // Ensure price is a number and handle null/undefined
      const price = typeof product.price === 'number' ? product.price : 0
      return sum + price
    }, 0)

    const byType = data.reduce((acc: Record<string, number>, product: Product) => {
      acc[product.type] = (acc[product.type] || 0) + 1
      return acc
    }, {})

    return {
      totalProducts,
      totalValue: totalValue.toFixed(2),
      byType
    }
  }, [data])

  // Memoized table columns
  const columns = useMemo(() => [
    {
      key: 'name' as keyof Product,
      header: 'Product Name',
      sortable: true,
      filterable: true,
      width: 200,
      render: (value: any, row: Product) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.itemCode}</div>
        </div>
      ),
    },
    {
      key: 'sku' as keyof Product,
      header: 'SKU',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Product) => (
        <span className="font-mono text-sm">{row.sku || 'N/A'}</span>
      ),
    },
    {
      key: 'type' as keyof Product,
      header: 'Type',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Product) => <ProductTypeBadge type={row.type} />,
    },
    {
      key: 'price' as keyof Product,
      header: 'Price',
      sortable: true,
      filterable: true,
      width: 100,
      render: (value: any, row: Product) => (
        <span className="font-medium">
          ${typeof row.price === "number" ? row.price.toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      key: 'packageUOM' as keyof Product,
      header: 'Package Unit',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Product) => (
        <div>
          <div>{row.quantityPerContainer} {row.packageUOM}</div>
          <div className="text-xs text-gray-500">per {row.containerUOM}</div>
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof Product,
      header: 'Created',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Product) => 
        new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions' as keyof Product,
      header: 'Actions',
      sortable: false,
      filterable: false,
      width: 100,
      render: (value: any, row: Product) => <ActionButtons product={row} />,
    },
  ], [])

  // Memoized row click handler
  const handleRowClick = useCallback((product: Product) => {
    // Navigate to product detail page
    window.location.href = `/dashboard/products/${product.id}`
  }, [])

  // Memoized selection change handler
  const handleSelectionChange = useCallback((selectedProducts: Product[]) => {
    console.log('Selected products:', selectedProducts)
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Products</h3>
        <p className="mt-2 text-sm text-gray-500">
          Failed to load products. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Product Types</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byType).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Products ({data?.length || 0})
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <CreateProductModal>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </Button>
          </CreateProductModal>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data || []}
        columns={columns}
        pageSize={25}
        searchable={true}
        sortable={true}
        filterable={true}
        selectable={true}
        onRowClick={handleRowClick}
        onSelectionChange={handleSelectionChange}
        loading={isLoading}
        emptyMessage="No products found. Create your first product to get started."
        className="w-full"
      />
    </div>
  )
}
