"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Package, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Modal } from "@/components/ui/modal"
import React from "react"

// Define the inventory item type based on how you'll structure your data
interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  price: number
  description?: string
  createdAt: Date
  updatedAt: Date
}

const INVENTORY_ITEM_VALIDATOR = z.object({
  name: z.string().min(1, "Product name is required."),
  sku: z.string().min(1, "SKU is required."),
  category: z.string().min(1, "Category is required."),
  quantity: z.number().int().min(0, "Quantity must be a non-negative integer."),
  price: z.number().min(0, "Price must be a non-negative number."),
  description: z.string().optional(),
})

type InventoryItemForm = z.infer<typeof INVENTORY_ITEM_VALIDATOR>

const CATEGORY_OPTIONS = [
  "Apparel",
  "Electronics",
  "Accessories",
  "Books",
  "Home & Kitchen",
  "Office Supplies",
  "Sports & Outdoors",
  "Other",
]

interface InventoryDetailPageContentProps {
  itemId: string
}

export const InventoryDetailPageContent = ({
  itemId,
}: InventoryDetailPageContentProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  // This would be replaced with your actual query to fetch inventory item details
  const { data: inventoryItem, isPending: isItemLoading } = useQuery({
    queryKey: ["inventory-item", itemId],
    queryFn: async () => {
      // Replace with actual API endpoint once implemented
      // const res = await client.inventory.getInventoryItemById.$get({ id: itemId })
      // return await res.json()

      // Mock data for now based on itemId
      // In a real implementation, you would fetch from your API
      const mockItems: Record<string, InventoryItem> = {
        "1": {
          id: "1",
          name: "T-Shirt - Black",
          sku: "TS-BLK-001",
          category: "Apparel",
          quantity: 150,
          price: 19.99,
          description: "Premium quality cotton t-shirt in classic black.",
          createdAt: new Date(2025, 2, 10),
          updatedAt: new Date(2025, 2, 10),
        },
        "2": {
          id: "2",
          name: "Coffee Mug",
          sku: "MUG-WHT-001",
          category: "Accessories",
          quantity: 75,
          price: 12.99,
          description: "Ceramic coffee mug with company logo.",
          createdAt: new Date(2025, 2, 12),
          updatedAt: new Date(2025, 2, 12),
        },
        "3": {
          id: "3",
          name: "Wireless Mouse",
          sku: "TECH-MOU-001",
          category: "Electronics",
          quantity: 35,
          price: 29.99,
          description: "Ergonomic wireless mouse with long battery life.",
          createdAt: new Date(2025, 2, 15),
          updatedAt: new Date(2025, 2, 15),
        },
      }

      // Simulate 1 second loading time to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (mockItems[itemId]) {
        return mockItems[itemId]
      }

      throw new Error("Item not found")
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
  } = useForm<InventoryItemForm>({
    resolver: zodResolver(INVENTORY_ITEM_VALIDATOR),
    // Set default values once data is loaded
    values: inventoryItem
      ? {
          name: inventoryItem.name,
          sku: inventoryItem.sku,
          category: inventoryItem.category,
          quantity: inventoryItem.quantity,
          price: inventoryItem.price,
          description: inventoryItem.description || "",
        }
      : undefined,
  })

  // Reset form when inventory item data is fetched
  React.useEffect(() => {
    if (inventoryItem) {
      reset({
        name: inventoryItem.name,
        sku: inventoryItem.sku,
        category: inventoryItem.category,
        quantity: inventoryItem.quantity,
        price: inventoryItem.price,
        description: inventoryItem.description || "",
      })
    }
  }, [inventoryItem, reset])

  const { mutate: updateInventoryItem, isPending: isUpdating } = useMutation({
    mutationFn: async (data: InventoryItemForm) => {
      // Replace with actual API endpoint once implemented
      // await client.inventory.updateInventoryItem.$post({ id: itemId, ...data })
      console.log("Updating inventory item:", itemId, data)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-item", itemId] })
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      setSuccessMessage("Item updated successfully!")
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    },
  })

  const { mutate: deleteInventoryItem, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      // Replace with actual API endpoint once implemented
      // await client.inventory.deleteInventoryItem.$post({ id: itemId })
      console.log("Deleting inventory item:", itemId)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      router.push("/dashboard/inventory")
    },
  })

  const onSubmit = (data: InventoryItemForm) => {
    updateInventoryItem(data)
  }

  if (isItemLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (!inventoryItem) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Item Not Found
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            The inventory item you're looking for doesn't exist or has been
            removed.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/inventory")}
          >
            Return to Inventory
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Item Details
              </h2>
              <p className="text-sm text-gray-600">
                Last updated:{" "}
                {format(inventoryItem.updatedAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button type="submit" size="sm" disabled={isUpdating || !isDirty}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register("name")} className="w-full" />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...register("sku")} className="w-full" />
                {errors.sku ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.sku.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register("category")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.category.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register("quantity", { valueAsNumber: true })}
                  min="0"
                  className="w-full"
                />
                {errors.quantity ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.quantity.message}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  min="0"
                  className="w-full"
                />
                {errors.price ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.price.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
              {errors.description ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/inventory")}
            >
              Back to Inventory
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        className="max-w-md p-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
              Delete Item
            </h2>
            <p className="text-sm/6 text-gray-600">
              Are you sure you want to delete "{inventoryItem.name}"? This
              action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteInventoryItem()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
