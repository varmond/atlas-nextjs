"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertTriangle, CheckCircle, Package, MinusCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Textarea } from "@/components/ui/textarea"
import type { User } from "@prisma/client"
import { format, isAfter, addDays } from "date-fns"

const dispenseFormSchema = z.object({
  inventoryId: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  note: z.string().optional(),
  dispensedAt: z.string().optional(),
})

type DispenseFormValues = z.infer<typeof dispenseFormSchema>

interface InventoryItem {
  id: string
  productId: string
  price: number | string
  lotNumber: string
  expirationDate: string | Date
  serialNumber: string
  vendor: string
  manufacturer: string
  unitsReceived: number
  product: {
    name: string
    sku: string
  }
}

interface DispenseContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

// Memoized inventory item component
const InventoryItemOption = memo(({ item }: { item: InventoryItem }) => {
  const expirationDate = new Date(item.expirationDate)
  const today = new Date()
  const sevenDaysFromNow = addDays(today, 7)

  let status = 'good'
  let statusColor = 'text-green-600'
  let statusText = 'Good'

  if (isAfter(today, expirationDate)) {
    status = 'expired'
    statusColor = 'text-red-600'
    statusText = 'Expired'
  } else if (isAfter(sevenDaysFromNow, expirationDate)) {
    status = 'expiring-soon'
    statusColor = 'text-orange-600'
    statusText = 'Expiring Soon'
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <div className="font-medium">{item.product.name}</div>
        <div className="text-sm text-gray-500">
          Lot: {item.lotNumber} • {item.unitsReceived} units available
        </div>
                 <div className="text-xs text-gray-400">
           {/* Location info not available in this query */}
         </div>
      </div>
      <Badge variant="outline" className={`ml-2 ${statusColor}`}>
        {statusText}
      </Badge>
    </div>
  )
})

InventoryItemOption.displayName = "InventoryItemOption"

// Memoized quantity validation component
const QuantityValidation = memo(({ 
  selectedItem, 
  quantity 
}: { 
  selectedItem?: InventoryItem
  quantity: number 
}) => {
  if (!selectedItem) return null

  const availableUnits = selectedItem.unitsReceived
  const isValid = quantity <= availableUnits
  const isLowStock = availableUnits <= 10

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Package className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          Available: {availableUnits} units
        </span>
        {isLowStock && (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            Low Stock
          </Badge>
        )}
      </div>
      
      {quantity > 0 && (
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid 
              ? `${quantity} units will be dispensed` 
              : `Cannot dispense ${quantity} units (only ${availableUnits} available)`
            }
          </span>
        </div>
      )}
    </div>
  )
})

QuantityValidation.displayName = "QuantityValidation"

export function DispenseContent({ user }: DispenseContentProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DispenseFormValues>({
    resolver: zodResolver(dispenseFormSchema),
    defaultValues: {
      note: "",
    },
  })

  // Watch form values for real-time validation
  const watchedInventoryId = form.watch("inventoryId")
  const watchedQuantity = form.watch("quantity")

  // Fetch inventory data with optimized caching
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get()
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Memoized filtered inventory (only available items)
  const availableInventory = useMemo(() => {
    if (!inventoryData?.inventoryItems) return []
    
    return inventoryData.inventoryItems.filter((item: InventoryItem) => 
      item.unitsReceived > 0
    )
  }, [inventoryData])

  // Memoized selected item
  const selectedItem = useMemo(() => {
    if (!watchedInventoryId || !availableInventory) return undefined
    return availableInventory.find((item: InventoryItem) => item.id === watchedInventoryId)
  }, [watchedInventoryId, availableInventory])

  // Optimistic dispense mutation
  const dispenseMutation = useMutation({
    mutationFn: async (values: DispenseFormValues) => {
      const response = await client.dispense.createDispense.$post(values)
      if (!response.ok) {
        throw new Error('Failed to dispense inventory')
      }
      return response.json()
    },
    onMutate: async (values) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["inventory"] })

      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(["inventory"])

      // Optimistically update the inventory
      queryClient.setQueryData(["inventory"], (old: any) => {
        if (!old?.inventoryItems) return old
        
        return {
          ...old,
          inventoryItems: old.inventoryItems.map((item: InventoryItem) => 
            item.id === values.inventoryId 
              ? { ...item, unitsReceived: item.unitsReceived - values.quantity }
              : item
          )
        }
      })

      return { previousInventory }
    },
    onError: (err, values, context) => {
      // Rollback on error
      if (context?.previousInventory) {
        queryClient.setQueryData(["inventory"], context.previousInventory)
      }
      toast({
        title: "Error",
        description: err.message || "Failed to dispense inventory",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory dispensed successfully",
      })
      form.reset()
      // Refetch inventory to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })

  // Enhanced form submission with validation
  const onSubmit = useCallback(async (values: DispenseFormValues) => {
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select a valid inventory item",
        variant: "destructive",
      })
      return
    }

    if (values.quantity > selectedItem.unitsReceived) {
      toast({
        title: "Error",
        description: `Cannot dispense ${values.quantity} units. Only ${selectedItem.unitsReceived} available.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await dispenseMutation.mutateAsync(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedItem, dispenseMutation, toast])

  // Handle quantity change with validation
  const handleQuantityChange = useCallback((value: string) => {
    const numValue = parseInt(value) || 0
    form.setValue("quantity", numValue)
    
    if (selectedItem && numValue > selectedItem.unitsReceived) {
      form.setError("quantity", {
        type: "manual",
        message: `Cannot dispense more than ${selectedItem.unitsReceived} units`
      })
    } else {
      form.clearErrors("quantity")
    }
  }, [form, selectedItem])

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableInventory?.length || 0}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {availableInventory?.reduce((total: number, item: InventoryItem) => 
                  total + item.unitsReceived, 0) || 0}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {availableInventory?.filter((item: InventoryItem) => 
                  item.unitsReceived <= 10
                ).length || 0}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Dispense Form */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <MinusCircle className="w-5 h-5 mr-2 text-red-600" />
            Dispense Inventory
          </h2>
          <p className="text-sm text-gray-600">
            Remove items from inventory stock
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="inventoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Item</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingInventory}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingInventory ? "Loading..." : "Select an item"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingInventory ? (
                        <SelectItem value="loading" disabled>Loading inventory...</SelectItem>
                      ) : availableInventory?.length === 0 ? (
                        <SelectItem value="no-items" disabled>No available inventory items</SelectItem>
                      ) : (
                        availableInventory?.map((item: InventoryItem) => (
                          <SelectItem key={item.id} value={item.id}>
                            <InventoryItemOption item={item} />
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedItem && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Selected Item Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-medium">{selectedItem.product.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SKU:</span>
                    <span className="ml-2 font-medium">{selectedItem.product.sku}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lot Number:</span>
                    <span className="ml-2 font-medium">{selectedItem.lotNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Serial Number:</span>
                    <span className="ml-2 font-medium">{selectedItem.serialNumber}</span>
                  </div>
                                       <div>
                       <span className="text-gray-600">Location:</span>
                       <span className="ml-2 font-medium">
                         Current location
                       </span>
                     </div>
                  <div>
                    <span className="text-gray-600">Expiration:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(selectedItem.expirationDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Dispense</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      max={selectedItem?.unitsReceived || undefined}
                      {...field}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    <QuantityValidation 
                      selectedItem={selectedItem} 
                      quantity={watchedQuantity || 0} 
                    />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this dispense..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting || dispenseMutation.isPending}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || 
                  dispenseMutation.isPending || 
                  !selectedItem ||
                  !watchedQuantity ||
                  watchedQuantity > (selectedItem?.unitsReceived || 0)
                }
              >
                {(isSubmitting || dispenseMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dispensing...
                  </>
                ) : (
                  <>
                    <MinusCircle className="mr-2 h-4 w-4" />
                    Dispense Inventory
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  )
} 