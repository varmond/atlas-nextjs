"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ModernPageLayout } from "@/components/page-layouts"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import {
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { CreateProductModal } from "@/components/create-product-modal"

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
  const getVariant = (type: string) => {
    switch (type) {
      case 'MEDICATION':
        return 'default'
      case 'IMMUNIZATION':
        return 'secondary'
      case 'CUSTOM':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const labelMap = {
    MEDICATION: "Medication",
    IMMUNIZATION: "Immunization", 
    GENERAL: "General",
    CUSTOM: "Custom",
  }

  return (
    <Badge variant={getVariant(type) as any}>
      {labelMap[type as keyof typeof labelMap] || type}
    </Badge>
  )
})

ProductTypeBadge.displayName = "ProductTypeBadge"

// Memoized action buttons component
const ActionButtons = memo(({ product }: { product: Product }) => (
  <div className="flex items-center space-x-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-muted"
      asChild
    >
      <Link href={`/dashboard/products/${product.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 hover:bg-muted"
      asChild
    >
      <Link href={`/dashboard/products/${product.id}?edit=true`}>
        <Edit className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
))

ActionButtons.displayName = "ActionButtons"

export function ProductsPageContent() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

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

  // Filter products based on search term
  const filteredData = useMemo(() => {
    if (!data) return []
    if (!searchTerm) return data
    
    return data.filter((product: Product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data, searchTerm])

  // Memoized table columns
  const columns = useMemo(() => [
    {
      key: 'name' as keyof Product,
      header: 'Product',
      sortable: true,
      filterable: true,
      width: 250,
      render: (value: any, row: Product) => (
        <div className="space-y-1">
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.itemCode}</div>
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
      header: 'Package',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Product) => (
        <div className="text-sm">
          <div>{row.quantityPerContainer} {row.packageUOM}</div>
          <div className="text-xs text-muted-foreground">per {row.containerUOM}</div>
        </div>
      ),
    },
    {
      key: 'actions' as keyof Product,
      header: '',
      sortable: false,
      filterable: false,
      width: 80,
      render: (value: any, row: Product) => <ActionButtons product={row} />,
    },
  ], [])

  // Memoized row click handler
  const handleRowClick = useCallback((product: Product) => {
    window.location.href = `/dashboard/products/${product.id}`
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Error Loading Products</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to load products. Please try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageLayout
      title="Products"
      description={`${filteredData.length} product${filteredData.length !== 1 ? 's' : ''} found`}
      actions={
        <CreateProductModal>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CreateProductModal>
      }
    >
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        pageSize={25}
        searchable={false} // We handle search manually
        sortable={true}
        filterable={false}
        selectable={true}
        onRowClick={handleRowClick}
        loading={isLoading}
        emptyMessage="No products found. Create your first product to get started."
        className="w-full"
      />
    </ModernPageLayout>
  )
}
