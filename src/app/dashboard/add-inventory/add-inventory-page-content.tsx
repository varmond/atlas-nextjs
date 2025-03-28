"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Upload } from "lucide-react"

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

export const AddInventoryPageContent = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

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

  const { mutate: createInventoryItem, isPending } = useMutation({
    mutationFn: async (data: InventoryItemForm) => {
      // Replace with actual API endpoint once implemented
      // await client.inventory.createInventoryItem.$post(data)
      console.log("Creating inventory item:", data)
      return { success: true }
    },
    onSuccess: () => {
      reset()
      setSuccessMessage("Product added successfully!")
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    },
  })

  const onSubmit = (data: InventoryItemForm) => {
    createInventoryItem(data)
  }

  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="max-w-3xl mx-auto">
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              Product Information
            </h2>
            <p className="text-sm text-gray-600">
              Add details about your new inventory item
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
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

            <div className="mt-4">
              <Label>Product Image (Optional)</Label>
              <div
                className={`mt-2 border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center ${
                  isDragging ? "bg-gray-50 border-brand-500" : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  // Handle file drop logic here
                }}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                router.push("/dashboard/inventory")
              }}
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
