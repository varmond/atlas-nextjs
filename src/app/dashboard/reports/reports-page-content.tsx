"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Download,
  Filter,
  Calendar as CalendarIcon,
  Package,
  DollarSign,
  Users,
  Activity,
  PieChart,
  LineChart,
  FileText,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"

interface ReportData {
  totalItems: number
  totalValue: number
  expiringSoon: number
  expired: number
  lowStock: number
  recentActivity: number
  topProducts: Array<{
    name: string
    quantity: number
    value: number
  }>
  activityByLocation: Array<{
    location: string
    items: number
    value: number
  }>
  monthlyTrends: Array<{
    month: string
    items: number
    value: number
  }>
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

// Memoized stat card component
const StatCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = "blue" 
}: { 
  title: string
  value: string | number
  change?: string
  icon: any
  color?: "blue" | "green" | "orange" | "red"
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600", 
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600"
  }

  return (
    <Card className="p-0 border-0 shadow-sm hover:shadow-md transition-shadow [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className="text-sm text-gray-500 mt-1">
                <span className={change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {change}
                </span> from last period
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Card>
  )
})

StatCard.displayName = "StatCard"

// Memoized chart placeholder component
const ChartPlaceholder = memo(({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string
  description: string
  icon: any
}) => (
  <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
    <div className="p-6">
      <div className="flex items-center justify-center h-64 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  </Card>
))

ChartPlaceholder.displayName = "ChartPlaceholder"

// Memoized data table component
const DataTable = memo(({ 
  data, 
  columns 
}: { 
  data: any[]
  columns: Array<{
    key: string
    header: string
    render?: (value: any, row: any) => React.ReactNode
  }>
}) => (
  <div className="overflow-x-auto overflow-hidden rounded-lg">
    <table className="min-w-full">
      <thead className="bg-gray-50/50">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white">
        {data.map((row, index) => (
          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
            {columns.map((column) => (
              <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
))

DataTable.displayName = "DataTable"

// Memoized filter controls component
const FilterControls = memo(({ 
  dateRange, 
  onDateRangeChange, 
  onExport 
}: { 
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  onExport: () => void
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd, y")} -{" "}
                    {format(dateRange.to, "MMM dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd, y")
                )
              ) : (
                "Select date range"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => onDateRangeChange(range || { from: undefined, to: undefined })}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      
      <Button variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
    
    <Button onClick={onExport} className="flex items-center space-x-2">
      <Download className="w-4 h-4" />
      <span>Export Report</span>
    </Button>
  </div>
))

FilterControls.displayName = "FilterControls"

export function ReportsPageContent() {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  // Mock data for demonstration - in real app, this would come from API
  const mockReportData: ReportData = useMemo(() => ({
    totalItems: 1247,
    totalValue: 45678.90,
    expiringSoon: 23,
    expired: 5,
    lowStock: 12,
    recentActivity: 89,
    topProducts: [
      { name: "Product A", quantity: 150, value: 7500 },
      { name: "Product B", quantity: 120, value: 6000 },
      { name: "Product C", quantity: 95, value: 4750 },
      { name: "Product D", quantity: 80, value: 4000 },
      { name: "Product E", quantity: 65, value: 3250 },
    ],
    activityByLocation: [
      { location: "Warehouse A", items: 450, value: 18000 },
      { location: "Warehouse B", items: 380, value: 15200 },
      { location: "Warehouse C", items: 320, value: 12800 },
      { location: "Office Storage", items: 97, value: 3878 },
    ],
    monthlyTrends: [
      { month: "Jan", items: 1100, value: 42000 },
      { month: "Feb", items: 1150, value: 43500 },
      { month: "Mar", items: 1200, value: 45000 },
      { month: "Apr", items: 1180, value: 44500 },
      { month: "May", items: 1220, value: 45500 },
      { month: "Jun", items: 1247, value: 45678 },
    ]
  }), [])

  // Memoized export handler
  const handleExport = useCallback(() => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download...",
    })
    // In real app, this would trigger actual export
  }, [toast])

  // Memoized date range change handler
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={mockReportData.totalItems.toLocaleString()}
          change="+12.5%"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Value"
          value={`$${mockReportData.totalValue.toLocaleString()}`}
          change="+8.3%"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Expiring Soon"
          value={mockReportData.expiringSoon}
          change="-5.2%"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Low Stock Items"
          value={mockReportData.lowStock}
          change="+2.1%"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Inventory Value Trend"
              description="Monthly inventory value over time"
              icon={LineChart}
            />
            <ChartPlaceholder
              title="Item Distribution"
              description="Inventory items by location"
              icon={PieChart}
            />
          </div>

          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products by Value</h3>
            <DataTable
              data={mockReportData.topProducts}
              columns={[
                { key: "name", header: "Product" },
                { 
                  key: "quantity", 
                  header: "Quantity",
                  render: (value) => value.toLocaleString()
                },
                { 
                  key: "value", 
                  header: "Value",
                  render: (value) => `$${value.toLocaleString()}`
                }
              ]}
            />
            </div>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Stock Levels"
              description="Current inventory levels by product"
              icon={BarChart3}
            />
            <ChartPlaceholder
              title="Expiration Analysis"
              description="Items expiring in the next 30 days"
              icon={AlertTriangle}
            />
          </div>

          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory by Location</h3>
              <DataTable
                data={mockReportData.activityByLocation}
                columns={[
                  { key: "location", header: "Location" },
                  { 
                    key: "items", 
                    header: "Items",
                    render: (value) => value.toLocaleString()
                  },
                  { 
                    key: "value", 
                    header: "Value",
                    render: (value) => `$${value.toLocaleString()}`
                  }
                ]}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Activity Timeline"
              description="Inventory movements over time"
              icon={Activity}
            />
            <ChartPlaceholder
              title="User Activity"
              description="Activity by user/role"
              icon={Users}
            />
          </div>

          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Item dispensed: Product {String.fromCharCode(65 + (i % 5))}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(subDays(new Date(), i), "MMM dd, yyyy 'at' HH:mm")} • Location A • User John Doe
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Dispense
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Turnover Analysis"
              description="Inventory turnover rates by product"
              icon={TrendingUp}
            />
            <ChartPlaceholder
              title="Cost Analysis"
              description="Cost trends and variance analysis"
              icon={DollarSign}
            />
          </div>

          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
              <DataTable
                data={mockReportData.monthlyTrends}
                columns={[
                  { key: "month", header: "Month" },
                  { 
                    key: "items", 
                    header: "Items",
                    render: (value) => value.toLocaleString()
                  },
                  { 
                    key: "value", 
                    header: "Value",
                    render: (value) => `$${value.toLocaleString()}`
                  }
                ]}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-6">
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Exports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Inventory Report", description: "Complete inventory listing", icon: Package },
                  { title: "Activity Report", description: "All inventory movements", icon: Activity },
                  { title: "Value Report", description: "Inventory value analysis", icon: DollarSign },
                  { title: "Expiration Report", description: "Items expiring soon", icon: Clock },
                  { title: "Location Report", description: "Inventory by location", icon: BarChart3 },
                  { title: "Custom Report", description: "Build your own report", icon: FileText },
                ].map((report, index) => (
                  <Card key={index} className="p-0 border-0 hover:shadow-md transition-shadow cursor-pointer [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <report.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{report.title}</h4>
                          <p className="text-xs text-gray-500">{report.description}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
