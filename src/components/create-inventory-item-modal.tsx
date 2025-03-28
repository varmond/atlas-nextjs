"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PropsWithChildren, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Modal } from "./ui/modal"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { client } from "@/lib/client"

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

interface CreateInventoryItemModalProps extends PropsWithChildren {
  containerClassName?: string
}

export const CreateInventoryItemModal = ({
  children,
  containerClassName,
}: CreateInventoryItemModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { mutate: createInventoryItem, isPending } = useMutation({
    mutationFn: async (data: InventoryItemForm) => {
      // Replace with actual API endpoint once implemented
      // await client.inventory.createInventoryItem.$post(data)
      console.log("Creating inventory item:", data)
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] })
      setIsOpen(false)
      reset()
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemForm>({
    resolver: zodResolver(INVENTORY_ITEM_VALIDATOR),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      price: 0,
      description: "",
    },
  })

  const onSubmit = (data: InventoryItemForm) => {
    createInventoryItem(data)
  }

  return (
    <>
      <div className={containerClassName} onClick={() => setIsOpen(true)}>
        {children}
      </div>

      <Modal
        className="max-w-xl p-8"
        showModal={isOpen}
        setShowModal={setIsOpen}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
              Add Inventory Item
            </h2>
            <p className="text-sm/7 text-gray-600">
              Add a new product to your inventory.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                autoFocus
                id="name"
                {...register("name")}
                placeholder="e.g. Black T-Shirt"
                className="w-full"
              />
              {errors.name ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="e.g. TS-BLK-001"
                  className="w-full"
                />
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
