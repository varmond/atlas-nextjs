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
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/utils"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { client } from "@/lib/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

// Schema validation for the header
const headerFormSchema = z.object({
  vendor: z.string().min(1, "Vendor is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  packageCost: z.coerce.number().min(0, "Package cost cannot be negative"),
  receiptDate: z.date({
    required_error: "Receipt date is required",
  }),
})

// Schema validation for inventory items
const inventoryItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  price: z.coerce.number().positive("Price must be positive"),
  lotNumber: z.string().min(1, "Lot number is required"),
  expirationDate: z.date({
    required_error: "Expiration date is required",
  }),
  serialNumber: z.string().min(1, "Serial number is required"),
  unitsReceived: z.coerce.number().int().positive("Units must be positive"),
})

type HeaderFormValues = z.infer<typeof headerFormSchema>
type InventoryItemValues = z.infer<typeof inventoryItemSchema>

type Product = {
  id: string
  name: string
  sku: string
}

type BatchItem = InventoryItemValues & {
  id: string
  productName?: string
  productSku?: string
}

interface AddInventoryPageContentProps {
  initialProducts?: Product[]
}

export function AddInventoryPageContent({
  initialProducts = [],
}: AddInventoryPageContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single")
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])

  // Fetch products for dropdown
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await client.inventory.getProducts.$get()
      const data = await response.json()
      return data.products
    },
    initialData: initialProducts,
  })

  // Header form - shared between single and batch modes
  const headerForm = useForm<HeaderFormValues>({
    resolver: zodResolver(headerFormSchema),
    defaultValues: {
      vendor: "",
      manufacturer: "",
      receiptNumber: "",
      notes: "",
      packageCost: 0,
      receiptDate: new Date(),
    },
  })

  // Item form - for single item or adding to batch
  const itemForm = useForm<InventoryItemValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      price: undefined,
      lotNumber: "",
      serialNumber: "",
      unitsReceived: undefined,
    },
  })

  // Add item to batch
  const addToBatch = () => {
    const itemValues = itemForm.getValues()
    const product = productsData?.find((p) => p.id === itemValues.productId)

    const newItem: BatchItem = {
      ...itemValues,
      id: `item-${Date.now()}`, // Temporary ID for tracking in the UI
      productName: product?.name,
      productSku: product?.sku,
    }

    setBatchItems([...batchItems, newItem])

    // Reset the form for the next item, but keep the product selection
    itemForm.reset({
      productId: itemValues.productId, // Keep the selected product
      price: undefined,
      lotNumber: "",
      serialNumber: "",
      unitsReceived: undefined,
    })

    toast({
      title: "Item added to batch",
      description: `${product?.name} added to the current batch`,
    })
  }

  // Remove item from batch
  const removeFromBatch = (itemId: string) => {
    setBatchItems(batchItems.filter((item) => item.id !== itemId))
  }

  // Clear the batch
  const clearBatch = () => {
    setBatchItems([])
    itemForm.reset()
  }

  // Setup mutation for single item
  const createSingleInventoryMutation = useMutation({
    mutationFn: async (data: {
      header: HeaderFormValues
      item: InventoryItemValues
    }) => {
      const { header, item } = data
      const payload = {
        ...item,
        expirationDate: item.expirationDate.toISOString(),
        vendor: header.vendor,
        manufacturer: header.manufacturer,
        packageCost: header.packageCost,
      }

      const response = await client.inventory.createInventory.$post(payload)
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Inventory has been successfully added",
      })

      // Reset forms
      headerForm.reset()
      itemForm.reset()

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

  // Setup mutation for batch
  const createBatchInventoryMutation = useMutation({
    mutationFn: async (data: {
      header: HeaderFormValues
      items: BatchItem[]
    }) => {
      const { header, items } = data
      const payload = {
        header: {
          ...header,
          receiptDate: header.receiptDate.toISOString(),
        },
        items: items.map((item) => ({
          ...item,
          expirationDate: item.expirationDate.toISOString(),
        })),
      }

      const response = await client.inventory.createBatchInventory.$post(
        payload
      )
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Batch Added!",
        description: `${batchItems.length} items have been successfully added to inventory`,
      })

      // Reset forms and batch
      headerForm.reset()
      itemForm.reset()
      setBatchItems([])

      // Redirect to inventory view
      router.push("/dashboard/view-inventory")
    },
    onError: (error) => {
      console.error("Error adding batch inventory:", error)
      toast({
        title: "Error",
        description: "Failed to add inventory batch",
        variant: "destructive",
      })
    },
  })

  async function onSubmitSingle() {
    const headerValues = headerForm.getValues()
    const itemValues = itemForm.getValues()

    createSingleInventoryMutation.mutate({
      header: headerValues,
      item: itemValues,
    })
  }

  async function onSubmitBatch() {
    if (batchItems.length === 0) {
      toast({
        title: "No items in batch",
        description: "Please add at least one item to the batch",
        variant: "destructive",
      })
      return
    }

    const headerValues = headerForm.getValues()
    createBatchInventoryMutation.mutate({
      header: headerValues,
      items: batchItems,
    })
  }

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue="single"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "single" | "batch")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="single">Single Item</TabsTrigger>
          <TabsTrigger value="batch">Batch Receiving</TabsTrigger>
        </TabsList>

        <Card className="p-6">
          {/* Receipt/Header info - common to both tabs */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Receipt Information</h2>
            <p className="text-sm text-gray-500">
              Enter details about this inventory receipt
            </p>
          </div>

          <Form {...headerForm}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <FormField
                control={headerForm.control}
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
                control={headerForm.control}
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

              <FormField
                control={headerForm.control}
                name="receiptDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Receipt Date</FormLabel>
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
                control={headerForm.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter receipt number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={headerForm.control}
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
                    <FormDescription>
                      Total shipping/handling cost
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={headerForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-3">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this receipt"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>

          <TabsContent value="single" className="mt-0 p-0">
            <div className="border-t pt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Product Information</h2>
                <p className="text-sm text-gray-500">
                  Enter details about the item being received
                </p>
              </div>

              <Form {...itemForm}>
                <form
                  onSubmit={itemForm.handleSubmit(onSubmitSingle)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter serial number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
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
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        createSingleInventoryMutation.isPending ||
                        isLoadingProducts
                      }
                    >
                      {createSingleInventoryMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Inventory
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-0 p-0">
            <div className="border-t pt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Batch Items</h2>
                <p className="text-sm text-gray-500">
                  Add multiple products to this receipt
                </p>
              </div>

              <Form {...itemForm}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
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
                      control={itemForm.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serial Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter serial number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
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
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => itemForm.reset()}
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="button"
                      onClick={async () => {
                        const valid = await itemForm.trigger()
                        if (valid) {
                          addToBatch()
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Batch
                    </Button>
                  </div>
                </div>
              </Form>

              {/* Batch Items Table */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Items in Batch ({batchItems.length})
                  </h3>
                  {batchItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearBatch}>
                      Clear All
                    </Button>
                  )}
                </div>

                {batchItems.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Lot Number</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{item.productName}</div>
                                <div className="text-xs text-gray-500">
                                  {item.productSku}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.lotNumber}</TableCell>
                            <TableCell>{item.serialNumber}</TableCell>
                            <TableCell>{item.unitsReceived}</TableCell>
                            <TableCell>
                              ${Number(item.price).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(item.expirationDate),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromBatch(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-md bg-gray-50">
                    <p className="text-gray-500">
                      No items in batch. Add items using the form above.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={onSubmitBatch}
                    disabled={
                      batchItems.length === 0 ||
                      createBatchInventoryMutation.isPending
                    }
                  >
                    {createBatchInventoryMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Batch ({batchItems.length} items)
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
