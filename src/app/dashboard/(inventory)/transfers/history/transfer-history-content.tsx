"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format, isAfter } from "date-fns"
import { 
  Download, 
  Filter, 
  X, 
  Calendar as CalendarIcon, 
  Search, 
  Package, 
  DollarSign,
  Clock,
  User,
  MapPin,
  ArrowRightLeft,
  FileText,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TransferHistoryContentProps {
  user: any
}

interface TransferRecord {
  id: string
  quantity: number
  notes: string | null
  createdAt: string
  inventory: {
    product: {
      name: string
    }
    lotNumber: string
  }
  sourceLocation: {
    name: string
  }
  destLocation: {
    name: string
  }
  sourceSubLocation: {
    name: string
  } | null
  destSubLocation: {
    name: string
  } | null
  user: {
    email: string
  }
}

interface FilterState {
  search: string
  sourceLocation: string
  destLocation: string
  user: string
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
}

// Memoized filter panel component
const FilterPanel = memo(({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  sourceLocations,
  destLocations,
  users 
}: { 
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onClearFilters: () => void
  sourceLocations: string[]
  destLocations: string[]
  users: string[]
}) => (
  <Card className="p-4 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        className="flex items-center space-x-2"
      >
        <X className="w-4 h-4" />
        <span>Clear All</span>
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Source Location Filter */}
      <Select
        value={filters.sourceLocation}
        onValueChange={(value) => onFilterChange({ ...filters, sourceLocation: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Source Locations" />
        </SelectTrigger>
        <SelectContent>
                      <SelectItem value="all">All Source Locations</SelectItem>
          {sourceLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Destination Location Filter */}
      <Select
        value={filters.destLocation}
        onValueChange={(value) => onFilterChange({ ...filters, destLocation: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Dest Locations" />
        </SelectTrigger>
        <SelectContent>
                      <SelectItem value="all">All Dest Locations</SelectItem>
          {destLocations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* User Filter */}
      <Select
        value={filters.user}
        onValueChange={(value) => onFilterChange({ ...filters, user: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user} value={user}>
              {user}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                  {format(filters.dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(filters.dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange.from}
            selected={{
              from: filters.dateRange.from,
              to: filters.dateRange.to,
            }}
            onSelect={(range) => 
              onFilterChange({ 
                ...filters, 
                dateRange: { 
                  from: range?.from, 
                  to: range?.to 
                } 
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  </Card>
))

FilterPanel.displayName = "FilterPanel"

export function TransferHistoryContent({ user }: TransferHistoryContentProps) {
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    sourceLocation: "all",
    destLocation: "all",
    user: "all",
    dateRange: { from: undefined, to: undefined }
  })

  // Fetch transfer history
  const { data: transfersData, isLoading, error } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const response = await client.transfer.getTransfers.$get()
      const data = await response.json()
      return data.transfers || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!transfersData) return []

    return transfersData.filter((transfer: TransferRecord) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const productName = transfer.inventory.product.name.toLowerCase()
        const lotNumber = transfer.inventory.lotNumber.toLowerCase()
        
        if (!productName.includes(searchLower) && 
            !lotNumber.includes(searchLower)) {
          return false
        }
      }

      // Source location filter
      if (filters.sourceLocation && filters.sourceLocation !== "all" && transfer.sourceLocation.name !== filters.sourceLocation) {
        return false
      }

      // Destination location filter
      if (filters.destLocation && filters.destLocation !== "all" && transfer.destLocation.name !== filters.destLocation) {
        return false
      }

      // User filter
      if (filters.user && filters.user !== "all" && transfer.user.email !== filters.user) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const transferDate = new Date(transfer.createdAt)
        
        if (filters.dateRange.from && isAfter(filters.dateRange.from, transferDate)) {
          return false
        }
        
        if (filters.dateRange.to && isAfter(transferDate, filters.dateRange.to)) {
          return false
        }
      }

      return true
    })
  }, [transfersData, filters])

  // Memoized filter options
  const filterOptions = useMemo(() => {
    if (!transfersData) return { sourceLocations: [], destLocations: [], users: [] }

    const sourceLocations = Array.from(new Set(
      transfersData.map((t: TransferRecord) => t.sourceLocation.name)
    )) as string[]

    const destLocations = Array.from(new Set(
      transfersData.map((t: TransferRecord) => t.destLocation.name)
    )) as string[]

    const users = Array.from(new Set(
      transfersData.map((t: TransferRecord) => t.user.email)
    )) as string[]

    return { sourceLocations, destLocations, users }
  }, [transfersData])

  // Memoized statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return { totalTransfers: 0, totalQuantity: 0, totalValue: 0, avgPerDay: 0 }

    const totalTransfers = filteredData.length
    const totalQuantity = filteredData.reduce((sum: number, t: TransferRecord) => sum + t.quantity, 0)
    
    // Calculate total value (this would need price data from inventory)
    const totalValue = 0 // Placeholder - would need price data
    
    // Calculate average per day
    const dates = filteredData.map((t: TransferRecord) => new Date(t.createdAt).toDateString())
    const uniqueDays = new Set(dates).size
    const avgPerDay = uniqueDays > 0 ? totalQuantity / uniqueDays : 0

    return {
      totalTransfers,
      totalQuantity,
      totalValue: totalValue.toFixed(2),
      avgPerDay: avgPerDay.toFixed(1)
    }
  }, [filteredData])

  // Memoized table columns
  const columns = useMemo(() => [
    {
      key: 'createdAt' as keyof TransferRecord,
      header: 'Date & Time',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: TransferRecord) => (
        <div>
          <div className="font-medium">{format(new Date(row.createdAt), 'MMM dd, yyyy')}</div>
          <div className="text-sm text-gray-500">{format(new Date(row.createdAt), 'HH:mm')}</div>
        </div>
      ),
    },
    {
      key: 'product' as keyof TransferRecord,
      header: 'Product',
      sortable: true,
      filterable: true,
      width: 200,
      render: (value: any, row: TransferRecord) => (
        <div>
          <div className="font-medium">{row.inventory.product.name}</div>
          <div className="text-sm text-gray-500">
            Lot: {row.inventory.lotNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'sourceLocation' as keyof TransferRecord,
      header: 'From',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: TransferRecord) => (
        <div>
          <div className="font-medium">{row.sourceLocation.name}</div>
          {row.sourceSubLocation && (
            <div className="text-sm text-gray-500">{row.sourceSubLocation.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'destLocation' as keyof TransferRecord,
      header: 'To',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: TransferRecord) => (
        <div>
          <div className="font-medium">{row.destLocation.name}</div>
          {row.destSubLocation && (
            <div className="text-sm text-gray-500">{row.destSubLocation.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'quantity' as keyof TransferRecord,
      header: 'Quantity',
      sortable: true,
      filterable: true,
      width: 100,
      render: (value: any, row: TransferRecord) => (
        <span className="font-medium text-blue-600">{row.quantity}</span>
      ),
    },
    {
      key: 'user' as keyof TransferRecord,
      header: 'Transferred By',
      sortable: true,
      filterable: true,
      width: 150,
      render: (value: any, row: TransferRecord) => row.user.email,
    },
    {
      key: 'notes' as keyof TransferRecord,
      header: 'Notes',
      sortable: false,
      filterable: true,
      width: 200,
      render: (value: any, row: TransferRecord) => (
        <span className="text-sm text-gray-600">
          {row.notes || 'No notes'}
        </span>
      ),
    },
  ], [])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      sourceLocation: "",
      destLocation: "",
      user: "",
      dateRange: { from: undefined, to: undefined }
    })
  }, [])

  // Export to CSV
  const exportToCsv = useCallback(() => {
    if (!filteredData.length) {
      toast({
        title: "No data to export",
        description: "There are no transfer records to export.",
        variant: "destructive",
      })
      return
    }

    const headers = ['Date', 'Product', 'Lot Number', 'From Location', 'To Location', 'Quantity', 'User', 'Notes']
    const csvData = filteredData.map((t: TransferRecord) => [
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
      t.inventory.product.name,
      t.inventory.lotNumber,
      t.sourceLocation.name,
      t.destLocation.name,
      t.quantity,
      t.user.email,
      t.notes || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transfer-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Transfer history has been exported to CSV.",
    })
  }, [filteredData, toast])

  if (error) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Transfer History</h3>
        <p className="mt-2 text-sm text-gray-500">
          Failed to load transfer records. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transfers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransfers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg/Day</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgPerDay}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Transfer History ({filteredData.length})
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={exportToCsv}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        sourceLocations={filterOptions.sourceLocations}
        destLocations={filterOptions.destLocations}
        users={filterOptions.users}
      />

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        pageSize={25}
        searchable={false} // We have our own search
        sortable={true}
        filterable={false} // We have our own filters
        selectable={true}
        loading={isLoading}
        emptyMessage="No transfer records found. Try adjusting your filters."
        className="w-full"
      />
    </div>
  )
}
