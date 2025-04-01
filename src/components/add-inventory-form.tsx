"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { client } from "@/lib/client"
import { useMutation, useQuery } from "@tanstack/react-query"

// Schema validation
const inventoryFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  price: z.coerce.number().positive("Price must be positive"),
  packageCost: z.coerce.number().positive("Package cost must be positive"),
  lotNumber: z.string().min(1, "Lot number is required"),
  expirationDate: z.date({
    required_error: "Expiration date is required",
  }),
  serialNumber: z.string().min(1, "Serial number is required"),
  vendor: z.string().min(1, "Vendor is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  unitsReceived: z.coerce.number().int().positive("Units must be positive"),
})

type InventoryFormValues = z.infer<typeof inventoryFormSchema>

type Product = {
  id: string
  name: string
  sku: string
}

export function AddInventoryForm() {
  const { toast } = useToast()
  const router = useRouter()

  // Fetch products for dropdown
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await client.inventory.getProducts.$get()
      const data = await response.json()
      return data.products
    },
  })

  // Create form
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      price: undefined,
      packageCost: undefined,
      lotNumber: "",
      serialNumber: "",
      vendor: "",
      manufacturer: "",
      unitsReceived: undefined,
    },
  })

  // Setup mutation
  const createInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      // Convert Date to ISO string for API
      const inventoryData = {
        ...data,
        expirationDate: data.expirationDate.toISOString(),
      }

      const response = await client.inventory.createInventory.$post(
        inventoryData
      )
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Inventory has been successfully added",
      })

      // Reset form
      form.reset()

      // Redirect to inventory view
      router.push("/dashboard/view-inventory")
    },
    onError: (error) => {
      console.error("Error adding inventory:", error)
      toast({
        title: "Error",
        description: "Failed to add inventory",
        variant: "destructive",
      })
    },
  })

  function onSubmit(data: InventoryFormValues) {
    createInventoryMutation.mutate(data)
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Add New Inventory</h2>
        <p className="text-sm text-gray-500">
          Enter details to receive new inventory items
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productsData?.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitsReceived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units Received</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Price per unit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packageCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Total package/shipping cost</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lot Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter lot number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter serial number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter manufacturer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createInventoryMutation.isPending || isLoadingProducts}
            >
              {createInventoryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Inventory
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}
