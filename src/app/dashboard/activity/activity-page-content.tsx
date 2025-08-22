"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import {
  Download,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Package,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  User,
  MapPin,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"

interface ActivityItem {
  id: string
  type: 'dispense' | 'transfer' | 'add' | 'adjust' | 'delete'
  productName: string
  productSku: string
  quantity: number
  location: string
  subLocation?: string
  user: string
  timestamp: string
  notes?: string
  previousQuantity?: number
  newQuantity?: number
  fromLocation?: string
  toLocation?: string
}

interface FilterState {
  search: string
  type: string
  location: string
  user: string
  dateRange: { from: Date | undefined; to: Date | undefined }
}

// Memoized activity type icon component
const ActivityTypeIcon = memo(({ type }: { type: ActivityItem['type'] }) => {
  const iconMap = {
    dispense: <Minus className="w-4 h-4 text-red-500" />,
    transfer: <ArrowRight className="w-4 h-4 text-blue-500" />,
    add: <Plus className="w-4 h-4 text-green-500" />,
    adjust: <RefreshCw className="w-4 h-4 text-orange-500" />,
    delete: <AlertTriangle className="w-4 h-4 text-red-600" />,
  }

  return iconMap[type]
})

ActivityTypeIcon.displayName = "ActivityTypeIcon"

// Memoized activity type badge component
const ActivityTypeBadge = memo(({ type }: { type: ActivityItem['type'] }) => {
  const colorMap = {
    dispense: "bg-red-50 text-red-700 border-red-200",
    transfer: "bg-blue-50 text-blue-700 border-blue-200",
    add: "bg-green-50 text-green-700 border-green-200",
    adjust: "bg-orange-50 text-orange-700 border-orange-200",
    delete: "bg-red-100 text-red-800 border-red-300",
  }

  const labelMap = {
    dispense: "Dispensed",
    transfer: "Transferred",
    add: "Added",
    adjust: "Adjusted",
    delete: "Deleted",
  }

  return (
    <Badge variant="outline" className={colorMap[type]}>
      {labelMap[type]}
    </Badge>
  )
})

ActivityTypeBadge.displayName = "ActivityTypeBadge"

// Memoized activity item component
const ActivityItem = memo(({ activity }: { activity: ActivityItem }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getActivityDescription = () => {
    switch (activity.type) {
      case 'dispense':
        return `${activity.quantity} units dispensed from ${activity.location}`
      case 'transfer':
        return `${activity.quantity} units transferred from ${activity.fromLocation} to ${activity.toLocation}`
      case 'add':
        return `${activity.quantity} units added to ${activity.location}`
      case 'adjust':
        return `Quantity adjusted from ${activity.previousQuantity} to ${activity.newQuantity}`
      case 'delete':
        return `Item removed from ${activity.location}`
      default:
        return 'Activity performed'
    }
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
          <ActivityTypeIcon type={activity.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {activity.productName}
              </h4>
              <span className="text-xs text-gray-500">({activity.productSku})</span>
              <ActivityTypeBadge type={activity.type} />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">
            {getActivityDescription()}
          </p>
          
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{activity.user}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>{activity.location}</span>
              {activity.subLocation && <span>• {activity.subLocation}</span>}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(activity.timestamp), "MMM dd, yyyy 'at' HH:mm")}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <span className="ml-2 text-gray-600">{activity.quantity}</span>
                </div>
                {activity.notes && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <span className="ml-2 text-gray-600">{activity.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
})

ActivityItem.displayName = "ActivityItem"

// Memoized filter panel component
const FilterPanel = memo(({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  locations,
  users 
}: { 
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: any) => void
  onClearFilters: () => void
  locations: string[]
  users: string[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.type) count++
    if (filters.location) count++
    if (filters.user) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }, [filters])

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Activity Filters</h3>
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
                placeholder="Product, SKU, notes..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Activity Type</label>
            <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="dispense">Dispense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="add">Add</SelectItem>
                <SelectItem value="adjust">Adjust</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Location</label>
            <Select value={filters.location} onValueChange={(value) => onFilterChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">User</label>
            <Select value={filters.user} onValueChange={(value) => onFilterChange('user', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-medium text-gray-700">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "MMM dd, y")} -{" "}
                        {format(filters.dateRange.to, "MMM dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "MMM dd, y")
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
        </div>
      )}
    </Card>
  )
})

FilterPanel.displayName = "FilterPanel"

export function ActivityPageContent() {
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    location: '',
    user: '',
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
  })

  // Mock activity data for demonstration
  const mockActivityData: ActivityItem[] = useMemo(() => [
    {
      id: '1',
      type: 'dispense',
      productName: 'Product A',
      productSku: 'PROD-A-001',
      quantity: 5,
      location: 'Warehouse A',
      subLocation: 'Shelf 1',
      user: 'John Doe',
      timestamp: new Date().toISOString(),
      notes: 'Dispensed for customer order #12345'
    },
    {
      id: '2',
      type: 'transfer',
      productName: 'Product B',
      productSku: 'PROD-B-002',
      quantity: 10,
      location: 'Warehouse B',
      fromLocation: 'Warehouse A',
      toLocation: 'Warehouse B',
      user: 'Jane Smith',
      timestamp: subDays(new Date(), 1).toISOString(),
      notes: 'Transfer to fulfill backorder'
    },
    {
      id: '3',
      type: 'add',
      productName: 'Product C',
      productSku: 'PROD-C-003',
      quantity: 25,
      location: 'Warehouse A',
      user: 'Mike Johnson',
      timestamp: subDays(new Date(), 2).toISOString(),
      notes: 'New shipment received'
    },
    {
      id: '4',
      type: 'adjust',
      productName: 'Product D',
      productSku: 'PROD-D-004',
      quantity: 0,
      location: 'Warehouse C',
      previousQuantity: 15,
      newQuantity: 12,
      user: 'Sarah Wilson',
      timestamp: subDays(new Date(), 3).toISOString(),
      notes: 'Physical count adjustment'
    },
    {
      id: '5',
      type: 'delete',
      productName: 'Product E',
      productSku: 'PROD-E-005',
      quantity: 0,
      location: 'Warehouse A',
      user: 'Admin User',
      timestamp: subDays(new Date(), 4).toISOString(),
      notes: 'Item discontinued'
    },
  ], [])

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return mockActivityData.filter((activity) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          activity.productName.toLowerCase().includes(searchLower) ||
          activity.productSku.toLowerCase().includes(searchLower) ||
          activity.notes?.toLowerCase().includes(searchLower) ||
          activity.user.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Type filter
      if (filters.type && activity.type !== filters.type) {
        return false
      }

      // Location filter
      if (filters.location && activity.location !== filters.location) {
        return false
      }

      // User filter
      if (filters.user && activity.user !== filters.user) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const activityDate = new Date(activity.timestamp)
        const from = filters.dateRange.from ? startOfDay(filters.dateRange.from) : new Date(0)
        const to = filters.dateRange.to ? endOfDay(filters.dateRange.to) : new Date()
        
        if (!isWithinInterval(activityDate, { start: from, end: to })) return false
      }

      return true
    })
  }, [mockActivityData, filters])

  // Memoized unique values for filter options
  const filterOptions = useMemo(() => {
    const locations = Array.from(new Set(mockActivityData.map(item => item.location)))
    const users = Array.from(new Set(mockActivityData.map(item => item.user)))
    return { locations, users }
  }, [mockActivityData])

  // Memoized statistics
  const stats = useMemo(() => {
    const totalActivities = filteredData.length
    const activitiesByType = filteredData.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalActivities,
      dispenses: activitiesByType.dispense || 0,
      transfers: activitiesByType.transfer || 0,
      additions: activitiesByType.add || 0,
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
      type: '',
      location: '',
      user: '',
      dateRange: { from: subDays(new Date(), 30), to: new Date() },
    })
  }, [])

  // Memoized export handler
  const handleExport = useCallback(() => {
    toast({
      title: "Export Started",
      description: "Your activity report is being prepared for download...",
    })
  }, [toast])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Minus className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dispenses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dispenses}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transfers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transfers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Additions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.additions}</p>
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
        users={filterOptions.users}
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Activity History ({filteredData.length})
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No activities found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your filters or check back later for new activities.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
