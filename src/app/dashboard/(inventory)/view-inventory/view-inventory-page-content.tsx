"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, isAfter, addDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"
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
  Filter,
  X,
  Calendar as CalendarIcon,
  Search,
  Package,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import { debounce, PERFORMANCE_CONSTANTS } from "@/lib/performance"

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
  locationId: string | null
  headerId: string
  subLocationId: string | null
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

interface FilterState {
  search: string
  status: string
  location: string
  vendor: string
  manufacturer: string
  priceRange: { min: string; max: string }
  dateRange: { from: Date | undefined; to: Date | undefined }
  expirationRange: { from: Date | undefined; to: Date | undefined }
}

interface ViewInventoryPageContentProps {
  initialInventory?: InventoryItem[]
}

// Memoized status indicator component
const StatusIndicator = memo(({ item }: { item: InventoryItem }) => {
  const expirationDate = new Date(item.expirationDate)
  const today = new Date()
  const thirtyDaysFromNow = addDays(today, 30)
  const sevenDaysFromNow = addDays(today, 7)

  let status = 'good'
  let icon = <CheckCircle className="w-4 h-4 text-green-500" />
  let label = 'Good'
  let color = 'bg-green-50 text-green-700 border-green-200'

  if (isAfter(today, expirationDate)) {
    status = 'expired'
    icon = <AlertTriangle className="w-4 h-4 text-red-500" />
    label = 'Expired'
    color = 'bg-red-50 text-red-700 border-red-200'
  } else if (isAfter(sevenDaysFromNow, expirationDate)) {
    status = 'expiring-soon'
    icon = <AlertTriangle className="w-4 h-4 text-orange-500" />
    label = 'Expiring Soon'
    color = 'bg-orange-50 text-orange-700 border-orange-200'
  } else if (isAfter(thirtyDaysFromNow, expirationDate)) {
    status = 'expiring'
    icon = <Clock className="w-4 h-4 text-yellow-500" />
    label = 'Expiring'
    color = 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }

  return (
    <Badge variant="outline" className={color}>
      {icon}
      <span className="ml-1">{label}</span>
    </Badge>
  )
})

StatusIndicator.displayName = "StatusIndicator"

// Memoized action buttons component
const ActionButtons = memo(({ item }: { item: InventoryItem }) => (
  <div className="flex items-center space-x-2">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="View Details"
      asChild
    >
      <Link href={`/dashboard/inventory/${item.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title="Edit Item"
      asChild
    >
      <Link href={`/dashboard/inventory/${item.id}?edit=true`}>
        <Edit className="h-4 w-4" />
      </Link>
    </Button>
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
      title="Delete Item"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
))

ActionButtons.displayName = "ActionButtons"

// Memoized filter panel component
const FilterPanel = memo(({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  locations,
  vendors,
  manufacturers 
}: { 
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  onClearFilters: () => void
  locations: string[]
  vendors: string[]
  manufacturers: string[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.location) count++
    if (filters.vendor) count++
    if (filters.manufacturer) count++
    if (filters.priceRange.min || filters.priceRange.max) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.expirationRange.from || filters.expirationRange.to) count++
    return count
  }, [filters])

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs"
          >
            {isOpen ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Product, SKU, lot number..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Status</label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Location</label>
            <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Vendor</label>
            <Select value={filters.vendor} onValueChange={(value) => onFilterChange('vendor', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manufacturer Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Manufacturer</label>
            <Select value={filters.manufacturer} onValueChange={(value) => onFilterChange('manufacturer', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Price Range</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Min"
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => onFilterChange('priceRange', { ...filters.priceRange, min: e.target.value })}
                className="text-xs"
              />
              <Input
                placeholder="Max"
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => onFilterChange('priceRange', { ...filters.priceRange, max: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Received Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                  onSelect={(range) => onFilterChange('dateRange', range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expiration Range */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Expiration Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.expirationRange.from ? (
                    filters.expirationRange.to ? (
                      <>
                        {format(filters.expirationRange.from, "LLL dd, y")} -{" "}
                        {format(filters.expirationRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.expirationRange.from, "LLL dd, y")
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
                  defaultMonth={filters.expirationRange.from}
                  selected={{
                    from: filters.expirationRange.from,
                    to: filters.expirationRange.to,
                  }}
                  onSelect={(range) => onFilterChange('expirationRange', range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </Card>
  )
})

FilterPanel.displayName = "FilterPanel"

export default function ViewInventoryPageContent({ 
  initialInventory 
}: ViewInventoryPageContentProps) {
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    location: 'all',
    vendor: 'all',
    manufacturer: 'all',
    priceRange: { min: '', max: '' },
    dateRange: { from: undefined, to: undefined },
    expirationRange: { from: undefined, to: undefined },
  })

  // Fetch inventory data with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get()
      const data = await response.json()
      return data.inventoryItems
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!data) return []

    return data.filter((item: InventoryItem) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          item.product.name.toLowerCase().includes(searchLower) ||
          item.product.sku.toLowerCase().includes(searchLower) ||
          item.lotNumber.toLowerCase().includes(searchLower) ||
          item.serialNumber.toLowerCase().includes(searchLower) ||
          item.vendor.toLowerCase().includes(searchLower) ||
          item.manufacturer.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const expirationDate = new Date(item.expirationDate)
        const today = new Date()
        const thirtyDaysFromNow = addDays(today, 30)
        const sevenDaysFromNow = addDays(today, 7)

        let itemStatus = 'good'
        if (isAfter(today, expirationDate)) {
          itemStatus = 'expired'
        } else if (isAfter(sevenDaysFromNow, expirationDate)) {
          itemStatus = 'expiring-soon'
        } else if (isAfter(thirtyDaysFromNow, expirationDate)) {
          itemStatus = 'expiring'
        }

        if (itemStatus !== filters.status) return false
      }

      // Location filter
      if (filters.location && filters.location !== 'all' && item.Location?.name !== filters.location) {
        return false
      }

      // Vendor filter
      if (filters.vendor && filters.vendor !== 'all' && item.vendor !== filters.vendor) {
        return false
      }

      // Manufacturer filter
      if (filters.manufacturer && filters.manufacturer !== 'all' && item.manufacturer !== filters.manufacturer) {
        return false
      }

      // Price range filter
      if (filters.priceRange.min || filters.priceRange.max) {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string)
        const min = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0
        const max = filters.priceRange.max ? parseFloat(filters.priceRange.max) : Infinity
        
        if (price < min || price > max) return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = new Date(item.createdAt)
        const from = filters.dateRange.from ? startOfDay(filters.dateRange.from) : new Date(0)
        const to = filters.dateRange.to ? endOfDay(filters.dateRange.to) : new Date()
        
        if (!isWithinInterval(itemDate, { start: from, end: to })) return false
      }

      // Expiration range filter
      if (filters.expirationRange.from || filters.expirationRange.to) {
        const itemDate = new Date(item.expirationDate)
        const from = filters.expirationRange.from ? startOfDay(filters.expirationRange.from) : new Date(0)
        const to = filters.expirationRange.to ? endOfDay(filters.expirationRange.to) : new Date()
        
        if (!isWithinInterval(itemDate, { start: from, end: to })) return false
      }

      return true
    })
  }, [data, filters])

  // Memoized unique values for filter options
  const filterOptions = useMemo(() => {
    if (!data) return { locations: [], vendors: [], manufacturers: [] }

    const locations = Array.from(new Set(data.map(item => item.Location?.name).filter(Boolean) as string[]))
    const vendors = Array.from(new Set(data.map(item => item.vendor).filter(Boolean) as string[]))
    const manufacturers = Array.from(new Set(data.map(item => item.manufacturer).filter(Boolean) as string[]))

    return { locations, vendors, manufacturers }
  }, [data])

  // Memoized statistics
  const stats = useMemo(() => {
    if (!filteredData) return { totalItems: 0, expiringSoon: 0, expired: 0, totalValue: 0 }

    const today = new Date()
    const thirtyDaysFromNow = addDays(today, 30)
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

  // Memoized filter change handler
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Memoized clear filters handler
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      location: '',
      vendor: '',
      manufacturer: '',
      priceRange: { min: '', max: '' },
      dateRange: { from: undefined, to: undefined },
      expirationRange: { from: undefined, to: undefined },
    })
  }, [])

  // Memoized table columns
  const columns = useMemo(() => [
    {
      key: 'product' as keyof InventoryItem,
      header: 'Product',
      sortable: true,
      filterable: true,
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
      filterable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => <StatusIndicator item={row} />,
    },
    {
      key: 'unitsReceived' as keyof InventoryItem,
      header: 'Units',
      sortable: true,
      filterable: true,
      width: 80,
      render: (value: any, row: InventoryItem) => (
        <span className="font-medium">{row.unitsReceived}</span>
      ),
    },
    {
      key: 'lotNumber' as keyof InventoryItem,
      header: 'Lot Number',
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: 'expirationDate' as keyof InventoryItem,
      header: 'Expiration',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => 
        format(new Date(row.expirationDate), "MMM d, yyyy"),
    },
    {
      key: 'price' as keyof InventoryItem,
      header: 'Unit Price',
      sortable: true,
      filterable: true,
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
      key: 'vendor' as keyof InventoryItem,
      header: 'Vendor',
      sortable: true,
      filterable: true,
      width: 120,
    },
    {
      key: 'location' as keyof InventoryItem,
      header: 'Location',
      sortable: true,
      filterable: true,
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
      key: 'createdAt' as keyof InventoryItem,
      header: 'Received Date',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: InventoryItem) => 
        format(new Date(row.createdAt), "MMM d, yyyy"),
    },
    {
      key: 'actions' as keyof InventoryItem,
      header: 'Actions',
      sortable: false,
      filterable: false,
      width: 100,
      render: (value: any, row: InventoryItem) => <ActionButtons item={row} />,
    },
  ], [])

  // Memoized export function
  const exportToCsv = useCallback(() => {
    try {
      const headers = [
        "Product",
        "SKU",
        "Status",
        "Units",
        "Unit Price",
        "Lot Number",
        "Serial Number",
        "Expiration Date",
        "Vendor",
        "Manufacturer",
        "Location",
        "Received Date",
      ]

      const csvData = filteredData.map((item: InventoryItem) => [
        item.product.name,
        item.product.sku,
        isAfter(new Date(), new Date(item.expirationDate)) ? 'Expired' : 'Good',
        item.unitsReceived,
        typeof item.price === "number" ? item.price.toFixed(2) : item.price,
        item.lotNumber,
        item.serialNumber,
        format(new Date(item.expirationDate), "yyyy-MM-dd"),
        item.vendor,
        item.manufacturer,
        item.Location?.name || 'Unknown',
        format(new Date(item.createdAt), "yyyy-MM-dd"),
      ])

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `inventory_export_${format(new Date(), "yyyy-MM-dd")}.csv`
      )
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

  // Memoized row click handler
  const handleRowClick = useCallback((item: InventoryItem) => {
    // Navigate to item detail page
    window.location.href = `/dashboard/inventory/${item.id}`
  }, [])

  // Memoized selection change handler
  const handleSelectionChange = useCallback((selectedItems: InventoryItem[]) => {
    console.log('Selected items:', selectedItems)
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Inventory</h3>
        <p className="mt-2 text-sm text-gray-500">
          Failed to load inventory data. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
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
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        locations={filterOptions.locations}
        vendors={filterOptions.vendors}
        manufacturers={filterOptions.manufacturers}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Inventory Items ({filteredData.length})
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
          <Button asChild>
            <Link href="/dashboard/add-inventory" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Inventory</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        pageSize={25}
        searchable={true}
        sortable={true}
        filterable={true}
        selectable={true}
        onRowClick={handleRowClick}
        onSelectionChange={handleSelectionChange}
        loading={isLoading}
        emptyMessage="No inventory items found. Add your first item to get started."
        className="w-full"
      />
    </div>
  )
}
