"use client"

import { useState, ReactNode } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { client } from "@/lib/client"
import { useForm, Controller } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProductType, UOM } from "@prisma/client"
import { Edit, Save } from "lucide-react"
import { useRouter } from "next/navigation"

// UOM options with plurals - using enum values
const UOM_OPTIONS = [
  { value: UOM.BOX, label: "Box(es)" },
  { value: UOM.VIAL, label: "Vial(s)" },
  { value: UOM.CARTON, label: "Carton(s)" },
  { value: UOM.UNIT, label: "Unit(s)" },
  { value: UOM.ML, label: "Milliliter(s)" },
  { value: UOM.MG, label: "Milligram(s)" },
  { value: UOM.G, label: "Gram(s)" },
  { value: UOM.KG, label: "Kilogram(s)" },
  { value: UOM.L, label: "Liter(s)" },
  { value: UOM.TABLET, label: "Tablet(s)" },
  { value: UOM.CAPSULE, label: "Capsule(s)" },
  { value: UOM.BOTTLE, label: "Bottle(s)" },
  { value: UOM.PACK, label: "Pack(s)" },
  { value: UOM.CASE, label: "Case(s)" },
  { value: UOM.EA, label: "Each" },
  { value: UOM.DOSE, label: "Dose(s)" },
  { value: UOM.AMPULE, label: "Ampule(s)" },
  { value: UOM.PREFILLED, label: "Prefilled Syringe(s)" },
  { value: UOM.KIT, label: "Kit(s)" },
]

// Product type options
const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.MEDICATION, label: "Medication" },
  { value: ProductType.IMMUNIZATION, label: "Immunization" },
  { value: ProductType.GENERAL, label: "General" },
  { value: ProductType.CUSTOM, label: "Custom" },
]

// This interface represents a product with string values for Decimal fields
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

interface EditProductModalProps {
  product: SerializedProduct
  children?: ReactNode
  containerClassName?: string
  onEditStart?: () => void
  onEditComplete?: () => void
}

interface ProductFormValues {
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
}

export const EditProductModal = ({
  product,
  children,
  containerClassName,
  onEditStart,
  onEditComplete,
}: EditProductModalProps) => {
  const [showModal, setShowModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    defaultValues: {
      itemCode: product.itemCode || "",
      name: product.name,
      price: product.price || "0",
      packageCost: product.packageCost || "0",
      manufacturerBarcodeNumber: product.manufacturerBarcodeNumber || "",
      sku: product.sku || "",
      type: product.type,
      packageUOM: product.packageUOM,
      containerUOM: product.containerUOM,
      quantityPerContainer: product.quantityPerContainer || 1,
      unitUOM: product.unitUOM,
      unitQuantity: product.unitQuantity || "0",
    },
  })

  const handleOpenModal = () => {
    setShowModal(true)
    setErrorMessage(null)
    onEditStart?.()
  }

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      try {
        const response = await client.product.updateProduct.$post({
          id: product.id,
          itemCode: values.itemCode,
          name: values.name,
          price: parseFloat(values.price),
          packageCost: parseFloat(values.packageCost),
          manufacturerBarcodeNumber: values.manufacturerBarcodeNumber,
          sku: values.sku,
          type: values.type,
          packageUOM: values.packageUOM,
          containerUOM: values.containerUOM,
          quantityPerContainer: parseInt(
            values.quantityPerContainer.toString()
          ),
          unitUOM: values.unitUOM,
          unitQuantity: parseFloat(values.unitQuantity),
        })

        if (!response.ok) {
          const errorData = await response.json()
          // throw new Error(errorData.error || "Failed to update product")
        }

        return response.json()
      } catch (error: any) {
        console.error("Update error:", error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["user-products"] })
      setShowModal(false)
      setErrorMessage(null)
      onEditComplete?.()
      router.refresh()
    },
    onError: (error: any) => {
      // Set a simple error message
      setErrorMessage(
        error.message || "An error occurred while updating the product"
      )
    },
  })

  const onSubmit = (values: ProductFormValues) => {
    setErrorMessage(null)
    updateProduct(values)
  }

  return (
    <div className={containerClassName}>
      <div onClick={handleOpenModal}>
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
            setErrorMessage(null)
          }
        }}
        className="max-w-2xl p-8"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
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
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  {...register("itemCode", {
                    required: "Item code is required",
                  })}
                  placeholder="Enter item code"
                  className="mt-1"
                />
                {errors.itemCode && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.itemCode.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { required: "Price is required" })}
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="packageCost">Package Cost</Label>
                <Input
                  id="packageCost"
                  type="number"
                  step="0.01"
                  {...register("packageCost", {
                    required: "Package cost is required",
                  })}
                  placeholder="0.00"
                  className="mt-1"
                />
                {errors.packageCost && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.packageCost.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="Enter product SKU"
                  className="mt-1"
                />
                {errors.sku && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.sku.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="manufacturerBarcodeNumber">
                  Manufacturer Barcode
                </Label>
                <Input
                  id="manufacturerBarcodeNumber"
                  {...register("manufacturerBarcodeNumber")}
                  placeholder="Enter barcode number"
                  className="mt-1"
                />
                {errors.manufacturerBarcodeNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.manufacturerBarcodeNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Product Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-medium mb-3">
                Packaging Information
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <Label htmlFor="packageUOM">Package UOM</Label>
                  <Controller
                    name="packageUOM"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select package UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {UOM_OPTIONS.sort((a, b) =>
                            a.label.localeCompare(b.label)
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.packageUOM && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.packageUOM.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantityPerContainer">
                    Container Quantity
                  </Label>
                  <Input
                    id="quantityPerContainer"
                    type="number"
                    step="1"
                    {...register("quantityPerContainer", {
                      required: "Quantity per container is required",
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1"
                  />
                  {errors.quantityPerContainer && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.quantityPerContainer.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="containerUOM">Container UOM</Label>
                  <Controller
                    name="containerUOM"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select container UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {UOM_OPTIONS.sort((a, b) =>
                            a.label.localeCompare(b.label)
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.containerUOM && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.containerUOM.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-medium mb-3">Unit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitQuantity">Unit Quantity</Label>
                  <Input
                    id="unitQuantity"
                    type="number"
                    step="0.01"
                    {...register("unitQuantity", {
                      required: "Unit quantity is required",
                    })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                  {errors.unitQuantity && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.unitQuantity.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unitUOM">Unit UOM</Label>
                  <Controller
                    name="unitUOM"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select unit UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {UOM_OPTIONS.sort((a, b) =>
                            a.label.localeCompare(b.label)
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.unitUOM && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.unitUOM.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500 mt-4 p-2 bg-red-50 border border-red-200 rounded">
                {errorMessage}
              </p>
            )}

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
