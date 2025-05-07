"use client"

import { useState, useEffect } from "react"
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
import { CalendarIcon, Loader2, Plus, Trash2, QrCode } from "lucide-react"
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
import { Location } from "@prisma/client"

// Schema validation for the header
const headerFormSchema = z.object({
  vendor: z.string().optional(),
  manufacturer: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  packageCost: z.coerce.number().min(0, "Package cost cannot be negative"),
  receiptDate: z.date({
    required_error: "Receipt date is required",
  }),
  locationId: z.string().min(1, "Location is required"),
})

// Schema validation for inventory items
const inventoryItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  price: z.coerce.number().min(0, "Price is required for this product."),
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
  initialLocations?: Location[]
}

// Move hook outside component
const useBarcodeScanner = () => {
  const { toast } = useToast()
  
  const scanBarcode = async () => {
    try {
      if (!('BarcodeDetector' in window)) {
        toast({
          title: "Barcode Scanner Not Available",
          description: "Your browser doesn't support barcode scanning",
          variant: "destructive",
        })
        return null
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // const barcodeDetector = new BarcodeDetector()
      
      // Implementation details to be added
      // This is a placeholder for the actual scanning logic
      
      return "scanned_barcode_value"
    } catch (error) {
      console.error('Barcode scanning error:', error)
      toast({
        title: "Scanning Failed",
        description: "Unable to access camera or scan barcode",
        variant: "destructive",
      })
      return null
    }
  }

  return { scanBarcode }
}

export function AddInventoryPageContent({
  initialProducts = [],
  initialLocations = [],
}: AddInventoryPageContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { scanBarcode } = useBarcodeScanner()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])

  // Header form - Move this up before the queries
  const headerForm = useForm<HeaderFormValues>({
    resolver: zodResolver(headerFormSchema),
    defaultValues: {
      vendor: "",
      manufacturer: "",
      receiptNumber: "",
      notes: "",
      packageCost: 0,
      receiptDate: new Date(),
      locationId: initialLocations?.[0]?.id || "", // Default to first location if available
    },
  })

  // Fetch products for dropdown
  const { data: productsData = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await client.product.getProducts.$get()
      const data = await response.json()
      return data.products
    },
    initialData: initialProducts,
  })

  // Fetch locations for dropdown
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await client.location.getLocations.$get()
      const data = await response.json()
      return data.locations
    },
    initialData: initialLocations,
  })

  // Update the default location after locations are loaded
  useEffect(() => {
    if (locationsData?.length > 0 && !headerForm.getValues().locationId) {
      headerForm.setValue('locationId', locationsData[0].id)
    }
  }, [locationsData, headerForm])

  // Item form
  const itemForm = useForm<InventoryItemValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      productId: "",
      price: undefined,
      lotNumber: "",
      serialNumber: "",
      unitsReceived: undefined,
      expirationDate: new Date(),
    },
  })

  // Add item to batch
  const addToBatch = async () => {
    const valid = await itemForm.trigger()
    if (!valid) return

    const itemValues = itemForm.getValues()
    const product = productsData?.find((p) => p.id === itemValues.productId)

    const newItem: BatchItem = {
      ...itemValues,
      id: `item-${Date.now()}`,
      productName: product?.name,
      productSku: product?.sku,
    }

    setBatchItems([...batchItems, newItem])

    // Reset the item form but keep header values
    itemForm.reset({
      productId: "",
      price: undefined,
      lotNumber: "",
      serialNumber: "",
      unitsReceived: undefined,
      expirationDate: undefined,
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

  // Update mutation to handle batch
  const createInventoryMutation = useMutation({
    mutationFn: async () => {
      const headerValues = headerForm.getValues()
      
      const payload = {
        header: {
          vendor: headerValues.vendor || "",
          manufacturer: headerValues.manufacturer || "",
          packageCost: headerValues.packageCost,
          receiptDate: headerValues.receiptDate.toISOString(),
          receiptNumber: headerValues.receiptNumber || "",
          notes: headerValues.notes || "",
          locationId: headerValues.locationId,
        },
        items: batchItems.map(item => ({
          productId: item.productId,
          price: item.price,
          lotNumber: item.lotNumber,
          expirationDate: item.expirationDate.toISOString(),
          serialNumber: item.serialNumber,
          unitsReceived: item.unitsReceived,
        })),
      }

      const response = await client.inventory.createBatchInventory.$post(payload)
      if (!response.ok) {
        throw new Error('Failed to create batch inventory')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Batch Added!",
        description: `${batchItems.length} items have been successfully added to inventory`,
      })
      headerForm.reset()
      itemForm.reset()
      setBatchItems([])
      router.push("/dashboard/view-inventory")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory batch",
        variant: "destructive",
      })
    },
  })

  // Update form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const headerValid = await headerForm.trigger()
    if (!headerValid) {
      toast({
        title: "Validation Error",
        description: "Please check the header information",
        variant: "destructive",
      })
      return
    }

    if (batchItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the batch",
        variant: "destructive",
      })
      return
    }

    createInventoryMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Add Inventory</h2>
          <p className="text-sm text-gray-500">Enter new inventory details</p>
        </div>

        <Form {...itemForm}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex gap-4 items-end">
              <FormField
                control={itemForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Product</FormLabel>
                    <div className="flex gap-2">
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
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={scanBarcode}
                        className="whitespace-nowrap"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan Barcode
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={itemForm.control}
                name="unitsReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Received</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Input placeholder="Enter manufacturer" {...field} />
                    </FormControl>
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
                      <Input placeholder="Enter serial number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
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
                control={headerForm.control}
                name="packageCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Total shipping/handling cost</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={headerForm.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingLocations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationsData?.map((location: { id: string, name: string }) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={headerForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  headerForm.reset()
                  itemForm.reset()
                  setBatchItems([])
                }}
              >
                Clear All
              </Button>
              <Button
                type="button"
                onClick={addToBatch}
                disabled={isSubmitting}
              >
                Add to Batch
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createInventoryMutation.isPending || batchItems.length === 0}
              >
                {(isSubmitting || createInventoryMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Batch...
                  </>
                ) : (
                  `Save Batch (${batchItems.length})`
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Batch Items Table */}
        {batchItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Items in Batch</h3>
            <div className="rounded-md border">
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
                      <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(item.expirationDate), "MMM d, yyyy")}
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
          </div>
        )}
      </Card>
    </div>
  )
}
