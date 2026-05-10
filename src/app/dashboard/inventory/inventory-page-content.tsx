"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { CardPageLayout } from "@/components/page-layouts"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowRight, BarChart2, Edit, Package, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { InventoryEmptyState } from "./inventory-empty-state"

// Define the inventory item type based on how you'll structure your data
interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  price: number
  createdAt: Date
  updatedAt: Date
}

export const InventoryPageContent = () => {
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // This would be replaced with your actual query to fetch inventory items
  const { data: inventoryItems, isPending: isInventoryItemsLoading } = useQuery(
    {
      queryKey: ["inventory-items"],
      queryFn: async () => {
        // Replace with actual API endpoint once implemented
        // const res = await client.inventory.getInventoryItems.$get()
        // const { items } = await res.json()

        // Mock data for now
        const mockItems: InventoryItem[] = [
          {
            id: "1",
            name: "T-Shirt - Black",
            sku: "TS-BLK-001",
            category: "Apparel",
            quantity: 150,
            price: 19.99,
            createdAt: new Date(2025, 2, 10),
            updatedAt: new Date(2025, 2, 10),
          },
          {
            id: "2",
            name: "Coffee Mug",
            sku: "MUG-WHT-001",
            category: "Accessories",
            quantity: 75,
            price: 12.99,
            createdAt: new Date(2025, 2, 12),
            updatedAt: new Date(2025, 2, 12),
          },
          {
            id: "3",
            name: "Wireless Mouse",
            sku: "TECH-MOU-001",
            category: "Electronics",
            quantity: 35,
            price: 29.99,
            createdAt: new Date(2025, 2, 15),
            updatedAt: new Date(2025, 2, 15),
          },
        ]

        return mockItems
      },
    }
  )

  const { mutate: deleteInventoryItem, isPending: isDeletingItem } =
    useMutation({
      mutationFn: async (id: string) => {
        // Replace with actual API implementation once created
        // await client.inventory.deleteInventoryItem.$post({ id })
        console.log(`Deleting item with ID: ${id}`)
        return { success: true }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
        setDeletingItemId(null)
      },
    })

  if (isInventoryItemsLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (!inventoryItems || inventoryItems.length === 0) {
    return <InventoryEmptyState />
  }

  // Group items by category for better organization
  const itemsByCategory = inventoryItems.reduce<
    Record<string, InventoryItem[]>
  >((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  // Transform data for CardPageLayout
  const cardItems = Object.entries(itemsByCategory).flatMap(([category, items]) =>
    items.map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: `SKU: ${item.sku}`,
      description: `Category: ${category}`,
      metadata: [
        {
          label: "Quantity",
          value: item.quantity,
          icon: <BarChart2 className="w-4 h-4" />
        },
        {
          label: "Price",
          value: `$${item.price.toFixed(2)}`
        },
        {
          label: "Last updated",
          value: format(item.updatedAt, "MMM d, yyyy")
        }
      ],
      badges: [
        {
          label: category,
          variant: "outline" as const
        }
      ],
      actions: [
        {
          label: "View",
          icon: <ArrowRight className="w-4 h-4" />,
          onClick: () => window.location.href = `/dashboard/inventory/${item.id}`
        },
        {
          label: "Edit",
          icon: <Edit className="w-4 h-4" />,
          variant: "ghost" as const,
          onClick: () => {
            // Edit functionality would go here
          }
        },
        {
          label: "Delete",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => setDeletingItemId(item.id)
        }
      ],
      onClick: () => window.location.href = `/dashboard/inventory/${item.id}`
    }))
  )

  return (
    <>
      <CardPageLayout
        title="Inventory"
        items={cardItems}
        loading={isInventoryItemsLoading}
        emptyMessage="No inventory items found. Create your first item to get started."
        columns={3}
        primaryAction={{
          label: "Add Item",
          icon: <Package className="w-4 h-4" />,
          onClick: () => {
            // This will be handled by the CreateInventoryItemModal in the page component
          }
        }}
      />

      <Modal
        showModal={!!deletingItemId}
        setShowModal={() => setDeletingItemId(null)}
        className="max-w-md p-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
              Delete Item
            </h2>
            <p className="text-sm/6 text-gray-600">
              Are you sure you want to delete this inventory item? This action
              cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDeletingItemId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deletingItemId && deleteInventoryItem(deletingItemId)
              }
              disabled={isDeletingItem}
            >
              {isDeletingItem ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
