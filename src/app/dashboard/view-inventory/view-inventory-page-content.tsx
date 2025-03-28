"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowRight, BarChart2, Edit, Package, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { InventoryEmptyState } from "../inventory/inventory-empty-state"

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

  return (
    <>
      <div className="space-y-6">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-medium text-gray-900">{category}</h2>
            <ul className="grid max-w-6xl grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="relative group z-10 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="absolute z-0 inset-px rounded-lg bg-white" />

                  <div className="pointer-events-none z-0 absolute inset-px rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md ring-1 ring-black/5" />
                  <div className="relative p-6 z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="size-12 bg-brand-100 rounded-full flex items-center justify-center">
                        <Package className="size-6 text-brand-700" />
                      </div>

                      <div>
                        <h3 className="text-lg/7 font-medium tracking-tight text-gray-950">
                          {item.name}
                        </h3>
                        <p className="text-sm/6 text-gray-600">
                          SKU: {item.sku}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm/5 text-gray-600">
                        <BarChart2 className="size-4 mr-2 text-brand-500" />
                        <span className="font-medium">Quantity:</span>
                        <span className="ml-1">{item.quantity}</span>
                      </div>
                      <div className="flex items-center text-sm/5 text-gray-600">
                        <span className="font-medium">Price:</span>
                        <span className="ml-1">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center text-sm/5 text-gray-600">
                        <span className="font-medium">Last updated:</span>
                        <span className="ml-1">
                          {format(item.updatedAt, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <Link
                        href={`/dashboard/inventory/${item.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "flex items-center gap-2 text-sm",
                        })}
                      >
                        View details <ArrowRight className="size-4" />
                      </Link>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-brand-600 transition-colors"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Link href={`/dashboard/inventory/${item.id}`}>
                            <Edit className="size-5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          aria-label={`Delete ${item.name}`}
                          onClick={() => setDeletingItemId(item.id)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
