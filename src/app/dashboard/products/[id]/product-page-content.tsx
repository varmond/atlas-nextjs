"use client"

import { ProductType, UOM } from "@prisma/client"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  ArrowUpDown,
  Package,
  DollarSign,
  Tag,
  Calendar,
  Info,
  Edit,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils"
import { Heading } from "@/components/heading"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { EditProductModal } from "@/components/edit-product-modal"
import { getUOMLabel } from "@/utils"

// Define a serialized version of the Products type for client components
interface SerializedProduct {
  id: string
  itemCode: string
  name: string
  price: string
  packageCost: string
  manufacturerBarcodeNumber: string
  sku: string
  type: ProductType
  packageUOM: UOM
  containerUOM: UOM
  quantityPerContainer: number
  unitUOM: UOM
  unitQuantity: string
  altUOM?: any
  organizationId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

interface ProductPageContentProps {
  product: SerializedProduct
}

export const ProductPageContent = ({ product }: ProductPageContentProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "history"
  >("overview")

  // Format the created date
  const formattedCreatedDate = useMemo(() => {
    return new Date(product.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [product.createdAt])

  // Format the updated date
  const formattedUpdatedDate = useMemo(() => {
    return formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })
  }, [product.updatedAt])

  // Format price
  const formattedPrice = useMemo(() => {
    return product.price ? `${product.price}` : "No price set"
  }, [product.price])

  return (
    <div className="space-y-6">
      {/* Product Header */}
      {/* <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <EditProductModal product={product} />
      </div> */}

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "overview" | "details" | "history")
        }}
        className="mt-8"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Product Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm/6 font-medium">Price</p>
                <DollarSign className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formattedPrice}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm/6 font-medium">Added</p>
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formattedCreatedDate}</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <p className="text-sm/6 font-medium">Last Updated</p>
                <Info className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formattedUpdatedDate}</p>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <Heading className="text-xl mb-4">Description</Heading>
            <p className="text-gray-700">
              {"No description provided for this product."}
            </p>
          </Card>

          {/* Related Actions */}
          <div className="mt-8">
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/add-inventory">
                <Button variant="outline" className="flex items-center gap-2">
                  <Package className="size-4" />
                  Manage Inventory
                </Button>
              </Link>

              <Link href="/dashboard/products">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown className="size-4" />
                  View All Products
                </Button>
              </Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card className="p-6">
            <Heading className="text-xl mb-4">Product Details</Heading>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Section */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Product Name
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {product.name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Item Code
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {product.itemCode || "No Item Code"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Price
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        <DollarSign className="size-4 text-gray-400" />
                        {formattedPrice}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Package Cost
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        <DollarSign className="size-4 text-gray-400" />
                        {product.packageCost}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        SKU
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        <Tag className="size-4 text-gray-400" />
                        {product.sku || "No SKU assigned"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Product Type
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {(() => {
                          switch (product.type) {
                            case "MEDICATION":
                              return "Medication"
                            case "IMMUNIZATION":
                              return "Immunization"
                            case "GENERAL":
                              return "General"
                            case "CUSTOM":
                              return "Custom"
                            default:
                              return product.type
                          }
                        })()}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Manufacturer Barcode
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {product.manufacturerBarcodeNumber ||
                          "No barcode assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Packaging Information Section */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                    Packaging Information
                  </h3>
                  <div className="grid grid-cols-3 gap-6 items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Package UOM
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {getUOMLabel(product.packageUOM)}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Container Quantity
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {product.quantityPerContainer || "0"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Container UOM
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {getUOMLabel(product.containerUOM)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unit Information Section */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                    Unit Information
                  </h3>
                  <div className="flex flex-wrap gap-6 items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Quantity per Unit
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {product.unitQuantity}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Unit UOM
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-gray-700">
                        {getUOMLabel(product.unitUOM)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Information Section */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                    System Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        ID
                      </h3>
                      <p className="mt-1 font-mono text-sm text-gray-600">
                        {product.id}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Date Added
                      </h3>
                      <p className="mt-1 text-gray-700">
                        {formattedCreatedDate}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Last Updated
                      </h3>
                      <p className="mt-1 text-gray-700">
                        {formattedUpdatedDate}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">
                        Organization ID
                      </h3>
                      <p className="mt-1 font-mono text-sm text-gray-600">
                        {product.organizationId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <Heading className="text-xl mb-4">Product History</Heading>

            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Calendar className="size-5 text-brand-700" />
                <div>
                  <p className="font-medium">Product Created</p>
                  <p className="text-sm text-gray-500">
                    {formattedCreatedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-4 border-b">
                <Edit className="size-5 text-brand-700" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-sm text-gray-500">
                    {formattedUpdatedDate}
                  </p>
                </div>
              </div>

              {/* This section could be expanded to show a full edit history if that data is available */}
              <p className="text-gray-500 text-sm italic mt-4">
                Detailed edit history is not available at this time.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
