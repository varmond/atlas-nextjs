"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Loader2, QrCode, Package, CheckCircle, AlertTriangle, Camera } from "lucide-react"
import { format, addYears } from "date-fns"
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
import { BarcodeScanner } from "./barcode-scanner"

// Schema validation for smart receiving
const smartReceivingSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  unitsReceived: z.coerce.number().int().positive("Units must be positive"),
  vendor: z.string().optional(),
  packageCost: z.coerce.number().positive("Package cost must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  lotNumber: z.string().optional(),
  expirationDate: z.date().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  locationId: z.string().min(1, "Location is required"),
  subLocationId: z.string().optional(),
  notes: z.string().optional(),
})

type SmartReceivingFormValues = z.infer<typeof smartReceivingSchema>

interface Product {
  id: string
  name: string
  sku: string
  manufacturerBarcodeNumber: string
  type: string
  price: string
  packageCost: string
}

interface SmartSuggestions {
  product: Product
  suggestions: {
    vendors: Array<{ vendor: string; count: number }>
    locations: Array<{ id: string; name: string; count: number; hasSubLocation: boolean }>
    avgCost: number
    recentReceipts: number
  }
  availableLocations: Array<{ id: string; name: string; description?: string }>
}

export function SmartReceivingForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [showScanner, setShowScanner] = useState(false)

  // Fetch products for barcode lookup
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const response = await client.inventory.getProducts.$get()
      const data = await response.json()
      
      // Convert API response to match our Product interface
      return data.products.map((product: any) => ({
        ...product,
        price: product.price || "0",
        packageCost: product.packageCost || "0"
      })) as Product[]
    },
  })

  // Fetch vendors for dropdown
  const { data: vendorsData, isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await client.vendor.getVendors.$get()
      const data = await response.json()
      return data.vendors
    },
  })

  // Fetch smart suggestions when product is selected
  const { data: smartData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["smart-suggestions", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null
      const response = await client.inventory.getSmartSuggestions.$get({
        productId: selectedProductId
      })
      const data = await response.json()
      
      // Convert the API response to match our interface
      return {
        product: {
          ...data.product,
          price: data.product.price || "0",
          packageCost: data.product.packageCost || "0"
        },
        suggestions: data.suggestions,
        availableLocations: data.availableLocations
      } as SmartSuggestions
    },
    enabled: !!selectedProductId,
  })

  // Create form with smart defaults
  const form = useForm<SmartReceivingFormValues>({
    resolver: zodResolver(smartReceivingSchema),
    defaultValues: {
      unitsReceived: undefined,
      packageCost: undefined,
      price: undefined,
      lotNumber: "",
      serialNumber: "",
      vendor: undefined,
      manufacturer: "",
      expirationDate: undefined, // No default date - allow blank
      locationId: undefined,
      notes: "",
    },
  })

  // Setup mutation
  const createInventoryMutation = useMutation({
    mutationFn: async (data: SmartReceivingFormValues) => {
      const inventoryData = {
        ...data,
        expirationDate: data.expirationDate?.toISOString() || null,
        lotNumber: data.lotNumber?.trim() || "",
        serialNumber: data.serialNumber?.trim() || "",
        manufacturer: data.manufacturer?.trim() || "",
        vendor: data.vendor?.trim() || "",
        notes: data.notes?.trim() || "",
      }

      const response = await client.inventory.createInventory.$post(inventoryData)
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Inventory has been successfully received",
      })

      // Reset form and continue receiving
      form.reset({
        unitsReceived: undefined,
        packageCost: undefined,
        price: undefined,
        lotNumber: "",
        serialNumber: "",
        vendor: undefined,
        manufacturer: "",
        expirationDate: undefined, // No default date
        locationId: undefined,
        notes: "",
      })
      setSelectedProductId("")
      setScannedBarcode("")
      
      // Keep the same location for batch receiving
      if (smartData?.suggestions.locations[0]) {
        form.setValue("locationId", smartData.suggestions.locations[0].id)
      }
    },
    onError: (error) => {
      console.error("Error receiving inventory:", error)
      toast({
        title: "Error",
        description: "Failed to receive inventory",
        variant: "destructive",
      })
    },
  })

  // Handle barcode scan
  const handleBarcodeScan = useCallback((barcode: string) => {
    setScannedBarcode(barcode)
    setShowScanner(false)
    
    // Find product by barcode
    const product = productsData?.find((p: Product) => 
      p.manufacturerBarcodeNumber === barcode || p.sku === barcode
    )
    
    if (product) {
      setSelectedProductId(product.id)
      form.setValue("productId", product.id)
      
      // Auto-generate lot number if it's a new receipt
      if (!form.getValues("lotNumber")) {
        const timestamp = Date.now().toString(36).toUpperCase()
        form.setValue("lotNumber", `LOT-${timestamp}`)
      }
      
      // Auto-generate serial number if it's a new receipt
      if (!form.getValues("serialNumber")) {
        const timestamp = Date.now().toString(36).toUpperCase()
        form.setValue("serialNumber", `SER-${timestamp}`)
      }
    } else {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode. Please add the product first.",
        variant: "destructive",
      })
    }
  }, [productsData, form, toast])

  // Apply smart suggestions when they're loaded
  useMemo(() => {
    if (smartData && !form.getValues("vendor") && !form.getValues("locationId")) {
      // Set most frequent vendor
      if (smartData.suggestions.vendors[0]) {
        form.setValue("vendor", smartData.suggestions.vendors[0].vendor)
      }
      
      // Set most frequent location
      if (smartData.suggestions.locations[0]) {
        form.setValue("locationId", smartData.suggestions.locations[0].id)
      }
      
      // Set average cost
      if (smartData.suggestions.avgCost > 0) {
        form.setValue("packageCost", smartData.suggestions.avgCost)
      }
      
      // Set price from product
      if (smartData.product.price) {
        form.setValue("price", Number(smartData.product.price))
      }
      
      // Set package cost from product if not set by suggestions
      if (smartData.product.packageCost && !form.getValues("packageCost")) {
        form.setValue("packageCost", Number(smartData.product.packageCost))
      }
      
      // Set manufacturer from product
      if (smartData.product) {
        form.setValue("manufacturer", smartData.product.name.split(' ')[0]) // Simple heuristic
      }
    }
  }, [smartData, form])

  // Handle form submission
  function onSubmit(data: SmartReceivingFormValues) {
    createInventoryMutation.mutate(data)
  }

  // Simulate barcode scanning (for testing)
  const simulateScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      const mockBarcode = "1234567890123"
      handleBarcodeScan(mockBarcode)
      setIsScanning(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Scan Section */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Receiving</h2>
          <p className="text-gray-600">Scan barcode to quickly receive inventory</p>
        </div>

        {/* Barcode Scanner Area */}
        <div className="text-center mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
            {isScanning ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Scanning...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <QrCode className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Ready to scan barcode</p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowScanner(true)} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Barcode
                  </Button>
                  <Button onClick={simulateScan} variant="outline" className="flex-1">
                    Simulate Scan
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Product Selection */}
          <div className="text-sm text-gray-500">
            Or select product manually:
          </div>
          {isLoadingProducts ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading products...</div>
            </div>
          ) : (
            <Select
              value={selectedProductId || undefined}
              onValueChange={(value) => {
                setSelectedProductId(value)
                form.setValue("productId", value)
              }}
            >
              <SelectTrigger className="w-64 mx-auto mt-2">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {productsData && productsData.length > 0 ? (
                  productsData
                    .filter(product => 
                      product && 
                      product.id && 
                      product.id.trim() !== '' && 
                      product.name && 
                      product.name.trim() !== ''
                    )
                    .map((product: Product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.sku || 'No SKU'}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="no-products" disabled>No products available</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Product Found - Smart Form */}
      {selectedProductId && smartData && !isLoadingSuggestions && (
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold">{smartData.product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {smartData.product.sku}</p>
              </div>
            </div>

            {/* Smart Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-900">Vendor</div>
                <div className="text-lg font-semibold text-blue-700">
                  {smartData.suggestions.vendors[0]?.vendor || "No history"}
                </div>
                <div className="text-xs text-blue-600">
                  Used {smartData.suggestions.vendors[0]?.count || 0} times
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-900">Location</div>
                <div className="text-lg font-semibold text-green-700">
                  {smartData.suggestions.locations[0]?.name || "No history"}
                </div>
                <div className="text-xs text-green-600">
                  Used {smartData.suggestions.locations[0]?.count || 0} times
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-purple-900">Avg Cost</div>
                <div className="text-lg font-semibold text-purple-700">
                  ${smartData.suggestions.avgCost || "0.00"}
                </div>
                <div className="text-xs text-purple-600">
                  {smartData.suggestions.recentReceipts} recent receipts
                </div>
              </div>
            </div>
          </div>

          {/* Quick Receiving Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity - Primary Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many are you receiving?
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  className="text-2xl text-center font-bold h-16"
                  {...form.register("unitsReceived")}
                  autoFocus
                />
                {form.formState.errors.unitsReceived && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.unitsReceived.message}
                  </p>
                )}
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor (Optional)
                </label>
                <Select
                  value={form.watch("vendor") || undefined}
                  onValueChange={(value) => form.setValue("vendor", value)}
                  disabled={isLoadingVendors}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No vendor</SelectItem>
                    {vendorsData && vendorsData.length > 0 ? (
                      vendorsData
                        .filter(v => 
                          v && 
                          v.name && 
                          v.name.trim() !== ''
                        )
                        .map((vendor: any) => (
                          <SelectItem key={vendor.id || vendor.name} value={vendor.name}>
                            {vendor.name}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Fallback for smart suggestions if no vendors in database */}
                {smartData?.suggestions.vendors.length > 0 && (!vendorsData || vendorsData.length === 0) && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-2">
                      Or select from recent vendors:
                    </div>
                    <Select
                      value={form.watch("vendor") || undefined}
                      onValueChange={(value) => form.setValue("vendor", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recent vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No vendor</SelectItem>
                        {smartData.suggestions.vendors
                          .filter(v => v.vendor && v.vendor.trim() !== '')
                          .map((v) => (
                            <SelectItem key={v.vendor} value={v.vendor}>
                              {v.vendor} ({v.count} times)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {form.formState.errors.vendor && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.vendor.message}
                  </p>
                )}
              </div>

              {/* Package Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("packageCost")}
                />
                {form.formState.errors.packageCost && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.packageCost.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("price")}
                />
                {form.formState.errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Storage Location
                </label>
                <Select
                  value={form.watch("locationId") || undefined}
                  onValueChange={(value) => form.setValue("locationId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {smartData.suggestions.locations.length > 0 ? (
                      smartData.suggestions.locations
                        .filter(loc => loc.id && loc.id.trim() !== '' && loc.name && loc.name.trim() !== '')
                        .map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.count} times)
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-locations" disabled>No location history available</SelectItem>
                    )}
                    {smartData.availableLocations.length > 0 ? (
                      smartData.availableLocations
                        .filter(loc => loc.id && loc.id.trim() !== '' && loc.name && loc.name.trim() !== '')
                        .filter(loc => !smartData.suggestions.locations.find(s => s.id === loc.id))
                        .map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-available-locations" disabled>No locations available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.locationId && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.locationId.message}
                  </p>
                )}
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date (Optional)
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("expirationDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("expirationDate") ? (
                        format(form.watch("expirationDate"), "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("expirationDate")}
                      onSelect={(date) => form.setValue("expirationDate", date || undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.expirationDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.expirationDate.message}
                  </p>
                )}
              </div>

              {/* Lot Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lot Number (Optional)
                </label>
                <Input
                  placeholder="LOT-12345"
                  {...form.register("lotNumber")}
                />
                {form.formState.errors.lotNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.lotNumber.message}
                  </p>
                )}
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number (Optional)
                </label>
                <Input
                  placeholder="SER-12345"
                  {...form.register("serialNumber")}
                />
                {form.formState.errors.serialNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.serialNumber.message}
                  </p>
                )}
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer (Optional)
                </label>
                <Input
                  placeholder="Manufacturer name"
                  {...form.register("manufacturer")}
                />
                {form.formState.errors.manufacturer && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.manufacturer.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <Input
                  placeholder="Any special notes about this receipt..."
                  {...form.register("notes")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 h-12 text-lg"
                disabled={createInventoryMutation.isPending}
              >
                {createInventoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Receiving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Receive Inventory
                  </>
                  )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-12"
                onClick={() => {
                  form.reset({
                    unitsReceived: undefined,
                    packageCost: undefined,
                    price: undefined,
                    lotNumber: "",
                    serialNumber: "",
                    vendor: undefined,
                    manufacturer: "",
                    expirationDate: undefined, // No default date
                    locationId: undefined,
                    notes: "",
                  })
                  setSelectedProductId("")
                  setScannedBarcode("")
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Quick Actions */}
      {!selectedProductId && (
        <Card className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push("/dashboard/products")}>
                Add New Product
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/locations")}>
                Manage Locations
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/view-inventory")}>
                View Inventory
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  )
}
