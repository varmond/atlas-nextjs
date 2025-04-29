"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { client } from "@/lib/client"
import { UOM, ProductType } from "@prisma/client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon } from "lucide-react"

// UOM options with labels (based on the UOM enum)
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

// Form validation schema based on updated DB schema
const productSchema = z.object({
  name: z.string().min(1, "Name is required."),
  itemCode: z.string().min(1, "Item code is required."),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Price must be a positive number.",
    }),
  packageCost: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Package cost must be a positive number.",
    }),
  manufacturerBarcodeNumber: z.string().optional(),
  sku: z.string().optional(),
  type: z.nativeEnum(ProductType),
  packageUOM: z.nativeEnum(UOM),
  containerUOM: z.nativeEnum(UOM),
  quantityPerContainer: z.number(),
  unitUOM: z.nativeEnum(UOM),
  unitQuantity: z.coerce
    .number()
    .min(0.01, "Unit quantity must be greater than 0"),
})

type ProductFormValues = z.infer<typeof productSchema>

export const CreateProductModal = ({
  children,
  containerClassName,
}: {
  children: React.ReactNode
  containerClassName?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      itemCode: "",
      name: "",
      price: "0",
      packageCost: "0",
      manufacturerBarcodeNumber: "",
      sku: "",
      type: ProductType.GENERAL,
      packageUOM: UOM.BOX,
      containerUOM: UOM.VIAL,
      quantityPerContainer: 1,
      unitUOM: UOM.ML,
      unitQuantity: 1,
    },
  })

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const response = await client.product.createProduct.$post({
        name: values.name,
        itemCode: values.itemCode,
        price: parseFloat(values.price),
        packageCost: parseFloat(values.packageCost),
        manufacturerBarcodeNumber: values.manufacturerBarcodeNumber || "",
        sku: values.sku || "",
        type: values.type,
        packageUOM: values.packageUOM,
        containerUOM: values.containerUOM,
        quantityPerContainer: values.quantityPerContainer,
        unitUOM: values.unitUOM,
        unitQuantity: values.unitQuantity,
      })

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-products"] })
      setIsOpen(false)
      reset()
      router.refresh()
    },
  })

  const onSubmit = (data: ProductFormValues) => {
    createProduct(data)
  }

  return (
    <>
      <div className={containerClassName} onClick={() => setIsOpen(true)}>
        {children}
      </div>

      <Modal
        className="max-w-2xl p-8"
        showModal={isOpen}
        setShowModal={setIsOpen}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-xl/8 font-medium tracking-tight text-gray-950">
              Add New Product
            </h2>
            <p className="text-sm/6 text-gray-600">
              Create a new product in your inventory
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...register("name")}
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
                {...register("itemCode")}
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
                {...register("price")}
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
                {...register("packageCost")}
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
            <h3 className="text-md font-medium mb-3">Packaging Information</h3>
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
                <Label htmlFor="quantityPerContainer">Container Quantity</Label>
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
                    valueAsNumber: true,
                  })}
                  placeholder="0"
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                "Creating..."
              ) : (
                <>
                  <PlusIcon className="size-4" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
