"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModernPageLayout } from "@/components/page-layouts"
import { format, isAfter, addDays } from "date-fns"
import Link from "next/link"
import {
  Download,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Package,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"

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
  createdAt: string | Date
  locationId: string | null
  product: {
    name: string
    sku: string
  }
  Location: {
    name: string
  } | null
  subLocation: {
    name: string
    code: string
  } | null
}

// Simple status indicator
const StatusIndicator = memo(({ item }: { item: InventoryItem }) => {
  const expirationDate = new Date(item.expirationDate)
  const today = new Date()
  const sevenDaysFromNow = addDays(today, 7)

  if (isAfter(today, expirationDate)) {
    return <Badge variant="destructive">Expired</Badge>
  } else if (isAfter(sevenDaysFromNow, expirationDate)) {
    return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Expiring Soon</Badge>
  }
  return <Badge variant="outline" className="bg-green-100 text-green-800">Good</Badge>
})

StatusIndicator.displayName = "StatusIndicator"

// Simple action buttons
const ActionButtons = memo(({ item }: { item: InventoryItem }) => (
  <div className="flex items-center space-x-1">
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
      <Link href={`/dashboard/inventory/${item.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
      <Link href={`/dashboard/inventory/${item.id}?edit=true`}>
        <Edit className="h-4 w-4" />
      </Link>
    </Button>
  </div>
))

ActionButtons.displayName = "ActionButtons"

export default function ViewInventoryPageContent() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")

  // Fetch inventory data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get()
      const data = await response.json()
      return data.inventoryItems || []
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Filter data
  const filteredData = useMemo(() => {
    if (!data) return []

    return data.filter((item: InventoryItem) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          item.product.name.toLowerCase().includes(searchLower) ||
          item.product.sku.toLowerCase().includes(searchLower) ||
          item.lotNumber.toLowerCase().includes(searchLower) ||
          item.vendor.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "all") {
        const expirationDate = new Date(item.expirationDate)
        const today = new Date()
        const sevenDaysFromNow = addDays(today, 7)

        let itemStatus = 'good'
        if (isAfter(today, expirationDate)) {
          itemStatus = 'expired'
        } else if (isAfter(sevenDaysFromNow, expirationDate)) {
          itemStatus = 'expiring-soon'
        }

        if (itemStatus !== statusFilter) return false
      }

      // Location filter
      if (locationFilter !== "all" && item.Location?.name !== locationFilter) {
        return false
      }

      return true
    })
  }, [data, searchTerm, statusFilter, locationFilter])

  // Get unique locations for filter
  const locations = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.map(item => item.Location?.name).filter(Boolean)))
  }, [data])

  // Calculate stats
  const stats = useMemo(() => {
    if (!filteredData) return { totalItems: 0, expiringSoon: 0, expired: 0, totalValue: 0 }

    const today = new Date()
    const sevenDaysFromNow = addDays(today, 7)

    const expiringSoon = filteredData.filter((item: InventoryItem) => {
      const expirationDate = new Date(item.expirationDate)
      return isAfter(sevenDaysFromNow, expirationDate) && !isAfter(today, expirationDate)
    }).length

    const expired = filteredData.filter((item: InventoryItem) => {
      const expirationDate = new Date(item.expirationDate)
      return isAfter(today, expirationDate)
    }).length

    const totalValue = filteredData.reduce((sum: number, item: InventoryItem) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string)
      return sum + (price * item.unitsReceived)
    }, 0)

    return {
      totalItems: filteredData.length,
      expiringSoon,
      expired,
      totalValue: totalValue.toFixed(2)
    }
  }, [filteredData])

  // Table columns
  const columns = useMemo(() => [
    {
      key: 'product' as keyof InventoryItem,
      header: 'Product',
      sortable: true,
      width: 200,
      render: (value: any, row: InventoryItem) => (
        <div>
          <div className="font-medium">{row.product.name}</div>
          <div className="text-sm text-gray-500">{row.product.sku}</div>
        </div>
      ),
    },
    {
      key: 'status' as keyof InventoryItem,
      header: 'Status',
      sortable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => <StatusIndicator item={row} />,
    },
    {
      key: 'unitsReceived' as keyof InventoryItem,
      header: 'Units',
      sortable: true,
      width: 80,
      render: (value: any, row: InventoryItem) => (
        <span className="font-medium">{row.unitsReceived}</span>
      ),
    },
    {
      key: 'lotNumber' as keyof InventoryItem,
      header: 'Lot Number',
      sortable: true,
      width: 120,
    },
    {
      key: 'expirationDate' as keyof InventoryItem,
      header: 'Expiration',
      sortable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => 
        format(new Date(row.expirationDate), "MMM d, yyyy"),
    },
    {
      key: 'price' as keyof InventoryItem,
      header: 'Unit Price',
      sortable: true,
      width: 100,
      render: (value: any, row: InventoryItem) => (
        <span className="font-medium">
          ${typeof row.price === "number" 
            ? row.price.toFixed(2) 
            : parseFloat(row.price as string).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'Location' as keyof InventoryItem,
      header: 'Location',
      sortable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => (
        <div>
          <div>{row.Location?.name || 'Unknown'}</div>
          {row.subLocation && (
            <div className="text-xs text-gray-500">{row.subLocation.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof InventoryItem,
      header: 'Actions',
      sortable: false,
      width: 80,
      render: (value: any, row: InventoryItem) => <ActionButtons item={row} />,
    },
  ], [])

  // Export function
  const exportToCsv = useCallback(() => {
    try {
      const headers = ["Product", "SKU", "Status", "Units", "Unit Price", "Lot Number", "Expiration Date", "Location"]
      const csvData = filteredData.map((item: InventoryItem) => [
        item.product.name,
        item.product.sku,
        isAfter(new Date(), new Date(item.expirationDate)) ? 'Expired' : 'Good',
        item.unitsReceived,
        typeof item.price === "number" ? item.price.toFixed(2) : item.price,
        item.lotNumber,
        format(new Date(item.expirationDate), "yyyy-MM-dd"),
        item.Location?.name || 'Unknown',
      ])

      const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `inventory_export_${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Exported ${filteredData.length} items to CSV`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export inventory data",
        variant: "destructive",
      })
    }
  }, [filteredData, toast])

  const handleRowClick = useCallback((item: InventoryItem) => {
    window.location.href = `/dashboard/inventory/${item.id}`
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Inventory</h3>
        <p className="mt-2 text-sm text-gray-500">Failed to load inventory data. Please try again.</p>
      </div>
    )
  }

  return (
    <ModernPageLayout
      title="View Inventory"
      description={`${filteredData.length} items found`}
      actions={
        <div className="flex items-center space-x-2">
          <Button onClick={() => window.location.href = "/dashboard/add-inventory"}>
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory
          </Button>
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold">{stats.expired}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location || ''}>
                {location}
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        pageSize={25}
        searchable={false}
        sortable={true}
        filterable={false}
        selectable={true}
        onRowClick={handleRowClick}
        loading={isLoading}
        emptyMessage="No inventory items found. Add your first item to get started."
        className="w-full"
      />
    </ModernPageLayout>
  )
}