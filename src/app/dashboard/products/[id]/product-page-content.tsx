"use client"

import { Products } from "@prisma/client"
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
import { useSearchParams } from "next/navigation"

interface ProductPageContentProps {
  product: Products
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
    return product.price ? `$${product.price}` : "No price set"
  }, [product.price])

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* <div> */}
        {/* <h1 className="text-2xl font-bold">{product.name}</h1> */}
        {/* <h1 className="text-2xl font-bold">
            {product.sku ? `SKU: ${product.sku}` : "No SKU assigned"}
          </h1> */}
        {/* </div> */}
        <EditProductModal product={product} />
      </div>

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
            {/* <h1 className="text-xl mb-4">Related Actions</h1> */}
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
              <div>
                <h3 className="text-sm font-semibold text-gray-500">
                  Description
                </h3>
                <p className="mt-1 text-gray-700">
                  {"No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">SKU</h3>
                  <p className="mt-1 flex items-center gap-2 text-gray-700">
                    <Tag className="size-4 text-gray-400" />
                    {product.sku || "No SKU assigned"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Price</h3>
                  <p className="mt-1 flex items-center gap-2 text-gray-700">
                    <DollarSign className="size-4 text-gray-400" />
                    {formattedPrice}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500">ID</h3>
                  <p className="mt-1 font-mono text-sm text-gray-600">
                    {product.id}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500">
                    Date Added
                  </h3>
                  <p className="mt-1 text-gray-700">{formattedCreatedDate}</p>
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
