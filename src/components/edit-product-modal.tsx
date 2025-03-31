"use client"

import { useState, ReactNode } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
import { client } from "@/lib/client"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Products } from "@prisma/client"
import { Edit, Save } from "lucide-react"
import { Prisma } from "@prisma/client"

interface EditProductModalProps {
  product: Products
  children?: ReactNode
  containerClassName?: string
}

interface ProductFormValues {
  name: string
  description: string
  price: string | null
  sku: string
}

export const EditProductModal = ({
  product,
  children,
  containerClassName,
}: EditProductModalProps) => {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product.name,
      price: product.price.toString() || "",
      sku: product.sku || "",
    },
  })

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const response = await client.product.updateProduct.$post({
        id: product.id,
        name: values.name,
        description: values.description || undefined,
        price: values.price ? Number(values.price) : undefined,
        sku: values.sku || undefined,
      })

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["user-products"] })
      setShowModal(false)
    },
  })

  const onSubmit = (values: ProductFormValues) => {
    updateProduct(values)
  }

  return (
    <div className={containerClassName}>
      <div onClick={() => setShowModal(true)}>
        {children || (
          <Button className="flex items-center gap-2">
            <Edit className="size-4" />
            Edit Product
          </Button>
        )}
      </div>

      <Modal
        showModal={showModal}
        setShowModal={(show) => {
          setShowModal(show)
          if (!show) {
            reset()
          }
        }}
        className="max-w-md p-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-lg/7 font-medium tracking-tight text-gray-950">
              Edit Product
            </h2>
            <p className="text-sm/6 text-gray-600">
              Update the details for {product.name}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="Enter product name"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price")}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="Enter product SKU"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
