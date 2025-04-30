"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const addItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  inventoryId: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
})

type AddItemFormValues = z.infer<typeof addItemSchema>

interface AddInvoiceItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  locationId: string
}

export function AddInvoiceItemDialog({
  open,
  onOpenChange,
  invoiceId,
  locationId,
}: AddInvoiceItemDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState<string>("")

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await client.inventory.getProducts.$get()
      return response.json()
    },
  })

  // Fetch inventory items for selected product
  const { data: inventoryData } = useQuery({
    queryKey: ["inventory", selectedProductId, locationId],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get({
        productId: selectedProductId,
        locationId: locationId
      })
      return response.json()
    },
    enabled: !!selectedProductId && !!locationId,
  })

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      quantity: 1,
    },
  })

  const addItemMutation = useMutation({
    mutationFn: async (values: AddItemFormValues) => {
      const response = await client.invoice.addItems.$post({
        invoiceId,
        items: [values],
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] })
      toast({
        title: "Item Added",
        description: "Item has been added to the invoice",
      })
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: AddItemFormValues) => {
    addItemMutation.mutate(values)
  }

  // Filter inventory items for selected product and location
  const availableInventory = inventoryData?.inventoryItems.filter(
    (item) => 
      item.productId === selectedProductId && 
      item.locationId === locationId &&
      item.unitsReceived > 0
  ) || []

  // Auto-set price when inventory item is selected
  useEffect(() => {
    const selectedInventory = availableInventory.find(
      (item) => item.id === form.getValues("inventoryId")
    )
    if (selectedInventory) {
      form.setValue("price", Number(selectedInventory.price))
    }
  }, [form.getValues("inventoryId")])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to Invoice</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedProductId(value)
                      form.setValue("inventoryId", "") // Reset inventory selection
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productsData?.products.map((product) => (
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
              name="inventoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedProductId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableInventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          Lot: {item.lotNumber} - Available: {item.unitsReceived}
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
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
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...field}
                      onChange={(e) => {
                        const selectedInventory = availableInventory.find(
                          (item) => item.id === form.getValues("inventoryId")
                        )
                        field.onChange(e.target.value || selectedInventory?.price || 0)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addItemMutation.isPending}
              >
                {addItemMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Item"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 