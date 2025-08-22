"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { client } from "@/lib/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, isAfter, addDays } from "date-fns"
import { 
  Package, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Edit, 
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  History,
  FileText,
  BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  productId: string
  price: number | string
  packageCost: number | string
  lotNumber: string
  expirationDate: string | Date
  serialNumber: string
  vendor: string
  manufacturer: string
  unitsReceived: number
  createdAt: string | Date
  updatedAt: string | Date
  organizationId: string
  userId: string
  locationId: string
  headerId: string
  subLocationId: string | null
  product: {
    name: string
    sku: string
    type: string
  }
  Location?: {
    name: string
  }
  subLocation?: {
    name: string
    code: string
  }
}

interface Transaction {
  id: string
  type: 'dispense' | 'transfer' | 'adjustment'
  quantity: number
  date: string
  user: string
  notes?: string
  location?: string
}

// Memoized status badge component
const StatusBadge = memo(({ item }: { item: InventoryItem }) => {
  const expirationDate = new Date(item.expirationDate)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry < 0) {
    return <Badge variant="destructive">Expired</Badge>
  } else if (daysUntilExpiry <= 30) {
    return <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">Expiring Soon</Badge>
  } else if (item.unitsReceived <= 10) {
    return <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">Low Stock</Badge>
  } else {
    return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">In Stock</Badge>
  }
})

StatusBadge.displayName = "StatusBadge"

// Memoized transaction type badge
const TransactionTypeBadge = memo(({ type }: { type: string }) => {
  const colorMap = {
    dispense: "bg-red-50 text-red-700 border-red-200",
    transfer: "bg-blue-50 text-blue-700 border-blue-200",
    adjustment: "bg-purple-50 text-purple-700 border-purple-200",
  }

  const labelMap = {
    dispense: "Dispensed",
    transfer: "Transferred", 
    adjustment: "Adjusted",
  }

  return (
    <Badge variant="outline" className={colorMap[type as keyof typeof colorMap] || colorMap.adjustment}>
      {labelMap[type as keyof typeof labelMap] || type}
    </Badge>
  )
})

TransactionTypeBadge.displayName = "TransactionTypeBadge"

interface InventoryDetailPageContentProps {
  itemId: string
}

export function InventoryDetailPageContent({ itemId }: InventoryDetailPageContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch inventory item details
  const { data: inventoryItem, isLoading, error } = useQuery({
    queryKey: ["inventory-item", itemId],
    queryFn: async () => {
      const response = await client.inventory.getInventoryItemById.$get({ id: itemId })
      const data = await response.json()
      return data.inventoryItem
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch transaction history
  const { data: transactions } = useQuery({
    queryKey: ["inventory-transactions", itemId],
    queryFn: async () => {
      // This would be replaced with actual API endpoint
      // For now, return mock data
      return [
        {
          id: "1",
          type: "dispense" as const,
          quantity: 5,
          date: new Date().toISOString(),
          user: "john@example.com",
          notes: "Patient dispense",
          location: "Main Clinic"
        },
        {
          id: "2", 
          type: "transfer" as const,
          quantity: 10,
          date: new Date(Date.now() - 86400000).toISOString(),
          user: "admin@example.com",
          notes: "Transfer to secondary location",
          location: "Secondary Clinic"
        }
      ] as Transaction[]
    },
    enabled: !!inventoryItem,
  })

  // Memoized inventory statistics
  const stats = useMemo(() => {
    if (!inventoryItem) return null

    const expirationDate = new Date(inventoryItem.expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    const totalValue = typeof inventoryItem.price === "number" 
      ? inventoryItem.price * inventoryItem.unitsReceived
      : parseFloat(inventoryItem.price as string) * inventoryItem.unitsReceived

    return {
      daysUntilExpiry,
      totalValue: totalValue.toFixed(2),
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry >= 0,
      isLowStock: inventoryItem.unitsReceived <= 10,
    }
  }, [inventoryItem])

  // Memoized transaction columns
  const transactionColumns = useMemo(() => [
    {
      key: 'type' as keyof Transaction,
      header: 'Type',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Transaction) => <TransactionTypeBadge type={row.type} />,
    },
    {
      key: 'quantity' as keyof Transaction,
      header: 'Quantity',
      sortable: true,
      filterable: true,
      width: 100,
      render: (value: any, row: Transaction) => (
        <span className={row.type === 'dispense' ? 'text-red-600' : 'text-green-600'}>
          {row.type === 'dispense' ? '-' : '+'}{row.quantity}
        </span>
      ),
    },
    {
      key: 'date' as keyof Transaction,
      header: 'Date',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: Transaction) => format(new Date(row.date), 'MMM dd, yyyy HH:mm'),
    },
    {
      key: 'user' as keyof Transaction,
      header: 'User',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: Transaction) => row.user,
    },
    {
      key: 'location' as keyof Transaction,
      header: 'Location',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: Transaction) => row.location || 'N/A',
    },
    {
      key: 'notes' as keyof Transaction,
      header: 'Notes',
      sortable: false,
      filterable: true,
      width: 200,
      render: (value: any, row: Transaction) => row.notes || 'No notes',
    },
  ], [])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await client.inventory.deleteInventoryItem.$post({ id: itemId })
      if (!response.ok) {
        throw new Error('Failed to delete inventory item')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      router.push("/dashboard/view-inventory")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive",
      })
    },
  })

  // Handle delete confirmation
  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this inventory item? This action cannot be undone.")) {
      deleteMutation.mutate()
    }
  }, [deleteMutation])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="mt-2 text-sm text-gray-500">Loading inventory details...</p>
        </div>
      </div>
    )
  }

  if (error || !inventoryItem) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Item Not Found
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            The inventory item you're looking for doesn't exist or has been removed.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/view-inventory")}
          >
            Return to Inventory
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {inventoryItem.product.name}
            </h1>
            <p className="text-sm text-gray-500">
              SKU: {inventoryItem.product.sku} • Lot: {inventoryItem.lotNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge item={inventoryItem} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/inventory/${itemId}?edit=true`)}
            className="flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Units</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryItem.unitsReceived}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.totalValue}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              stats?.isExpired ? 'bg-red-100' : 
              stats?.isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <Calendar className={`w-6 h-6 ${
                stats?.isExpired ? 'text-red-600' : 
                stats?.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiration</p>
              <p className={`text-2xl font-bold ${
                stats?.isExpired ? 'text-red-600' : 
                stats?.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
              }`}>
                {stats?.isExpired ? 'Expired' : 
                 stats?.isExpiringSoon ? `${stats.daysUntilExpiry}d` : 
                 `${stats?.daysUntilExpiry}d`}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.product.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Type</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.product.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lot Number</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.lotNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.serialNumber}</p>
                </div>
              </div>
            </Card>

            {/* Location & Vendor Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Vendor</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {inventoryItem.Location?.name || 'No location assigned'}
                  </p>
                </div>
                {inventoryItem.subLocation && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sub-Location</label>
                    <p className="mt-1 text-gray-900 flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      {inventoryItem.subLocation.name} ({inventoryItem.subLocation.code})
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Vendor</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.vendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                  <p className="mt-1 text-gray-900">{inventoryItem.manufacturer}</p>
                </div>
              </div>
            </Card>

            {/* Financial Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit Price</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    ${typeof inventoryItem.price === "number" ? inventoryItem.price.toFixed(2) : parseFloat(inventoryItem.price as string).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Package Cost</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    ${typeof inventoryItem.packageCost === "number" ? inventoryItem.packageCost.toFixed(2) : parseFloat(inventoryItem.packageCost as string).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Value</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    ${stats?.totalValue}
                  </p>
                </div>
              </div>
            </Card>

            {/* Dates & Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates & Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {format(new Date(inventoryItem.expirationDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Days Until Expiry</label>
                  <p className={`mt-1 flex items-center ${
                    stats?.isExpired ? 'text-red-600' : 
                    stats?.isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    <Clock className="w-4 h-4 mr-2" />
                    {stats?.isExpired ? 'Expired' : `${stats?.daysUntilExpiry} days`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="mt-1 text-gray-900">{format(new Date(inventoryItem.createdAt), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-gray-900">{format(new Date(inventoryItem.updatedAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            
            {transactions && transactions.length > 0 ? (
              <DataTable
                data={transactions}
                columns={transactionColumns}
                pageSize={10}
                searchable={true}
                sortable={true}
                filterable={true}
                selectable={false}
                loading={false}
                emptyMessage="No transactions found for this inventory item."
                className="w-full"
              />
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No transaction history available</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Analytics</h3>
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Analytics coming soon</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
