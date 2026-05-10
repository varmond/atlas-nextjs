"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModernPageLayout } from "@/components/page-layouts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { 
  ArrowRightLeft, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  MapPin,
  Truck
} from "lucide-react"
import { format, isAfter, addDays } from "date-fns"
import type { User } from "@prisma/client"

const transferFormSchema = z.object({
  sourceLocationId: z.string().min(1, "Source location is required"),
  sourceSubLocationId: z.string().optional(),
  destLocationId: z.string().min(1, "Destination location is required"),
  destSubLocationId: z.string().optional(),
  inventoryId: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
}).refine((data) => data.sourceLocationId !== data.destLocationId, {
  message: "Source and destination locations must be different",
  path: ["destLocationId"],
})

type TransferFormValues = z.infer<typeof transferFormSchema>

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

interface Location {
  id: string
  name: string
  subLocations?: {
    id: string
    name: string
    code: string
  }[]
}

interface TransferInventoryContentProps {
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
          {/* Removed Location and subLocation display */}
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
              ? `${quantity} units will be transferred` 
              : `Cannot transfer ${quantity} units (only ${availableUnits} available)`
            }
          </span>
        </div>
      )}
    </div>
  )
})

QuantityValidation.displayName = "QuantityValidation"

export function TransferInventoryContent({ user }: TransferInventoryContentProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      notes: "",
    },
  })

  // Watch form values for real-time validation
  const watchedSourceLocationId = form.watch("sourceLocationId")
  const watchedDestLocationId = form.watch("destLocationId")
  const watchedInventoryId = form.watch("inventoryId")
  const watchedQuantity = form.watch("quantity")

  // Fetch locations with optimized caching
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await client.location.getLocations.$get()
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch sub-locations for source location
  const { data: sourceSubLocationsData } = useQuery({
    queryKey: ["subLocations", watchedSourceLocationId],
    queryFn: async () => {
      if (!watchedSourceLocationId) return { subLocations: [] }
      const response = await client["sub-location"].getSubLocations.$get({
        locationId: watchedSourceLocationId
      })
      return response.json()
    },
    enabled: !!watchedSourceLocationId
  })

  // Fetch sub-locations for destination location
  const { data: destSubLocationsData } = useQuery({
    queryKey: ["subLocations", watchedDestLocationId],
    queryFn: async () => {
      if (!watchedDestLocationId) return { subLocations: [] }
      const response = await client["sub-location"].getSubLocations.$get({
        locationId: watchedDestLocationId
      })
      return response.json()
    },
    enabled: !!watchedDestLocationId
  })

  // Fetch inventory for source location
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventory", watchedSourceLocationId],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get({
        locationId: watchedSourceLocationId
      })
      return response.json()
    },
    enabled: !!watchedSourceLocationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

  // Optimistic transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (values: TransferFormValues) => {
      const response = await client.inventory.createTransfer.$post({
        inventoryId: values.inventoryId,
        quantity: values.quantity,
        sourceLocationId: values.sourceLocationId,
        sourceSubLocationId: values.sourceSubLocationId,
        destLocationId: values.destLocationId,
        destSubLocationId: values.destSubLocationId,
        notes: values.notes,
      })
      if (!response.ok) {
        throw new Error('Failed to create transfer')
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
        description: err.message || "Failed to create transfer",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer completed successfully",
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
  const onSubmit = useCallback(async (values: TransferFormValues) => {
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
        description: `Cannot transfer ${values.quantity} units. Only ${selectedItem.unitsReceived} available.`,
        variant: "destructive",
      })
      return
    }

    if (values.sourceLocationId === values.destLocationId) {
      toast({
        title: "Error",
        description: "Source and destination locations must be different",
        variant: "destructive",
      })
      return
    }

    await transferMutation.mutateAsync(values)
  }, [selectedItem, transferMutation, toast])

  // Handle quantity change with validation
  const handleQuantityChange = useCallback((value: string) => {
    const numValue = parseInt(value) || 0
    form.setValue("quantity", numValue)
    
    if (selectedItem && numValue > selectedItem.unitsReceived) {
      form.setError("quantity", {
        type: "manual",
        message: `Cannot transfer more than ${selectedItem.unitsReceived} units`
      })
    } else {
      form.clearErrors("quantity")
    }
  }, [form, selectedItem])

  return (
    <ModernPageLayout
      title="Transfer Inventory"
      description="Move items between locations"
    >
      {/* Transfer Form */}
      <Card className="p-6">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Source and Destination Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Source Location</h3>
                <FormField
                  control={form.control}
                  name="sourceLocationId"
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
                            <SelectValue placeholder="Select source location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locationsData?.locations?.map((location: Location) => (
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

                <FormField
                  control={form.control}
                  name="sourceSubLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Location (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!watchedSourceLocationId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceSubLocationsData?.subLocations?.map((subLocation) => (
                            <SelectItem key={subLocation.id} value={subLocation.id}>
                              {subLocation.name} ({subLocation.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Destination Location</h3>
                <FormField
                  control={form.control}
                  name="destLocationId"
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
                            <SelectValue placeholder="Select destination location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locationsData?.locations?.map((location: Location) => (
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

                <FormField
                  control={form.control}
                  name="destSubLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Location (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!watchedDestLocationId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {destSubLocationsData?.subLocations?.map((subLocation) => (
                            <SelectItem key={subLocation.id} value={subLocation.id}>
                              {subLocation.name} ({subLocation.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Item Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Item Details</h3>
              <FormField
                control={form.control}
                name="inventoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Item</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingInventory || !watchedSourceLocationId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchedSourceLocationId 
                              ? "Select source location first" 
                              : isLoadingInventory 
                                ? "Loading..." 
                                : "Select an item"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingInventory ? (
                          <SelectItem value="loading" disabled>Loading inventory...</SelectItem>
                        ) : availableInventory?.length === 0 ? (
                          <SelectItem value="no-items" disabled>No available inventory items at this location</SelectItem>
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
                       <span className="text-gray-600">Current Location:</span>
                       <span className="ml-2 font-medium">
                         Source location
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
                    <FormLabel>Quantity to Transfer</FormLabel>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this transfer..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={transferMutation.isPending}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={
                  transferMutation.isPending || 
                  !selectedItem ||
                  !watchedQuantity ||
                  watchedQuantity > (selectedItem?.unitsReceived || 0) ||
                  watchedSourceLocationId === watchedDestLocationId
                }
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Transfer...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Complete Transfer
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </ModernPageLayout>
  )
} 