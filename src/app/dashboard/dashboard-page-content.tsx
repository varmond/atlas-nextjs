"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModernPageLayout } from "@/components/page-layouts"
import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { 
  ArrowRight, 
  BarChart2, 
  Clock, 
  Database, 
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  MinusCircle,
  ArrowRightLeft,
  DollarSign,
  Users,
  Building2,
  Activity,
  Warehouse,
  Zap,
  Target,
  CheckCircle,
  ArrowUpRight,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useState, useMemo, useCallback, memo } from "react"

// Mock data for demonstration - replace with real API calls
const mockInventoryStats = {
  totalItems: 1247,
  lowStock: 23,
  expiringSoon: 8,
  totalValue: 45678.90,
  recentActivity: 15
}

const mockRecentActivity = [
  {
    id: 1,
    type: 'dispense',
    product: 'Aspirin 500mg',
    quantity: 50,
    location: 'Main Pharmacy',
    user: 'Dr. Smith',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 2,
    type: 'transfer',
    product: 'Ibuprofen 200mg',
    quantity: 100,
    from: 'Storage A',
    to: 'Storage B',
    user: 'Nurse Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 3,
    type: 'add',
    product: 'Acetaminophen 325mg',
    quantity: 200,
    location: 'Main Pharmacy',
    user: 'Admin User',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
]

// Utility functions
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'dispense':
      return <MinusCircle className="w-4 h-4 text-red-500" />
    case 'transfer':
      return <ArrowRightLeft className="w-4 h-4 text-blue-500" />
    case 'add':
      return <Plus className="w-4 h-4 text-green-500" />
    default:
      return <Activity className="w-4 h-4 text-gray-500" />
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'dispense':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'transfer':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'add':
      return 'bg-green-50 text-green-700 border-green-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

// Memoized stat card component
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = "text-gray-900" 
}: {
  title: string
  value: string | number
  icon: any
  trend?: string
  trendValue?: string
  color?: string
}) => (
  <Card>
    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {trend && (
      <p className="text-xs text-muted-foreground">
        <span className="text-green-600">{trend}</span> {trendValue}
      </p>
    )}
  </Card>
))

// Memoized quick action card component
const QuickActionCard = memo(({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  bgColor, 
  iconColor 
}: {
  href: string
  icon: any
  title: string
  description: string
  bgColor: string
  iconColor: string
}) => (
  <Link href={href}>
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center space-x-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Card>
  </Link>
))

// Memoized activity item component
const ActivityItem = memo(({ activity }: { activity: any }) => (
  <div className="flex items-center space-x-4 p-3 rounded-lg border">
    <div className="flex-shrink-0">
      {/* {getActivityIcon({ type: activity.type })} */}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium text-gray-900">
          {activity.product}
        </p>
        <Badge variant="outline" className={getActivityColor(activity.type)}>
          {activity.type}
        </Badge>
      </div>
      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
        <span>Qty: {activity.quantity}</span>
        {activity.type === 'transfer' ? (
          <>
            <span>From: {activity.from}</span>
            <span>To: {activity.to}</span>
          </>
        ) : (
          <span>Location: {activity.location}</span>
        )}
        <span>By: {activity.user}</span>
      </div>
    </div>
    <div className="flex-shrink-0 text-sm text-gray-500">
      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
    </div>
  </div>
))

// Memoized category card component
const CategoryCard = memo(({ 
  category, 
  onDelete 
}: { 
  category: any
  onDelete: (name: string) => void
}) => (
  <div className="relative group p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-full"
        style={{
          backgroundColor: category.color
            ? `#${category.color.toString(16).padStart(6, "0")}`
            : "#f3f4f6",
        }}
      />
      <div>
        <h3 className="font-medium text-gray-900">
          {category.emoji || "📁"} {category.name}
        </h3>
        <p className="text-sm text-gray-500">
          {format(category.createdAt, "MMM d, yyyy")}
        </p>
      </div>
    </div>

    <div className="space-y-2 mb-4 text-sm text-gray-600">
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-2 text-brand-500" />
        <span>Last ping: {category.lastPing ? formatDistanceToNow(category.lastPing) + " ago" : "Never"}</span>
      </div>
      <div className="flex items-center">
        <Database className="w-4 h-4 mr-2 text-brand-500" />
        <span>Fields: {category.uniqueFieldCount || 0}</span>
      </div>
      <div className="flex items-center">
        <BarChart2 className="w-4 h-4 mr-2 text-brand-500" />
        <span>Events: {category.eventsCount || 0}</span>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <Link
        href={`/dashboard/category/${category.name}`}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "flex items-center gap-2 text-sm",
        })}
      >
        View <ArrowRight className="w-4 h-4" />
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-red-600 transition-colors"
        onClick={() => onDelete(category.name)}
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </div>
  </div>
))

export const DashboardPageContent = () => {
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()
  
  // Fetch real inventory data for stats
  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      try {
        const response = await client.inventory.getInventory.$get()
        const data = await response.json()
        return data.inventoryItems || []
      } catch (err) {
        console.error('Error fetching inventory for dashboard:', err)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch recent activity data
  const { data: recentActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // For now, return mock data until we have a real activity API
      return mockRecentActivity
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Optimized query with stale time and caching
  const { data: categories, isPending: isEventCategoriesLoading } = useQuery({
    queryKey: ["user-event-categories"],
    queryFn: async () => {
      const res = await client.category.getEventCategories.$get()
      const { categories } = await res.json()
      return categories
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation(
    {
      mutationFn: async (name: string) => {
        await client.category.deleteCategory.$post({ name })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["user-event-categories"] })
        setDeletingCategory(null)
      },
    }
  )

  // Memoized handlers
  const handleDeleteCategory = useCallback((name: string) => {
    setDeletingCategory(name)
  }, [])

  // Memoized computed values
  const statsData = useMemo(() => {
    if (!inventoryData) {
      return [
        {
          title: "Total Inventory Items",
          value: "Loading...",
          icon: Package,
          trend: "Loading",
          trendValue: "inventory data"
        },
        {
          title: "Low Stock Items",
          value: "Loading...",
          icon: AlertTriangle,
          color: "text-orange-600",
          trend: "Loading",
          trendValue: "stock levels"
        },
        {
          title: "Expiring Soon",
          value: "Loading...",
          icon: Clock,
          color: "text-red-600",
          trend: "Loading",
          trendValue: "expiration data"
        },
        {
          title: "Total Value",
          value: "Loading...",
          icon: DollarSign,
          trend: "Loading",
          trendValue: "value calculation"
        }
      ]
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const totalItems = inventoryData.length
    const expiringSoon = inventoryData.filter((item: any) => {
      const expirationDate = new Date(item.expirationDate)
      return expirationDate <= thirtyDaysFromNow && expirationDate > today
    }).length
    const expired = inventoryData.filter((item: any) => {
      const expirationDate = new Date(item.expirationDate)
      return expirationDate <= today
    }).length
    const lowStock = inventoryData.filter((item: any) => item.unitsReceived <= 10).length
    const totalValue = inventoryData.reduce((sum: number, item: any) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string)
      return sum + (price * item.unitsReceived)
    }, 0)

    return [
      {
        title: "Total Inventory Items",
        value: totalItems.toLocaleString(),
        icon: Package,
        trend: totalItems > 0 ? "Active" : "No items",
        trendValue: totalItems > 0 ? "in inventory" : "yet"
      },
      {
        title: "Low Stock Items",
        value: lowStock,
        icon: AlertTriangle,
        color: "text-orange-600",
        trend: lowStock > 0 ? "Needs attention" : "All good",
        trendValue: lowStock > 0 ? "items below threshold" : "stock levels"
      },
      {
        title: "Expiring Soon",
        value: expiringSoon,
        icon: Clock,
        color: "text-red-600",
        trend: expiringSoon > 0 ? "Action required" : "No urgency",
        trendValue: expiringSoon > 0 ? "items expiring soon" : "expiration dates"
      },
      {
        title: "Total Value",
        value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: DollarSign,
        trend: totalValue > 0 ? "Current value" : "No value",
        trendValue: totalValue > 0 ? "of inventory" : "in system"
      }
    ]
  }, [inventoryData])

  const quickActionsData = useMemo(() => [
    {
      href: "/dashboard/products",
      icon: Package,
      title: "Manage Products",
      description: "Create product catalog",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      href: "/dashboard/add-inventory",
      icon: Plus,
      title: "Add Inventory",
      description: "Record new stock",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      href: "/dashboard/view-inventory",
      icon: Warehouse,
      title: "View Inventory",
      description: "Browse all items",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      href: "/dashboard/dispense",
      icon: MinusCircle,
      title: "Dispense Items",
      description: "Remove from stock",
      bgColor: "bg-red-100",
      iconColor: "text-red-600"
    }
  ], [])

  if (isEventCategoriesLoading || isInventoryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (inventoryError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
        <p className="mt-2 text-sm text-gray-500">
          Failed to load inventory data. Please try refreshing the page.
        </p>
      </div>
    )
  }

  return (
    <ModernPageLayout
      title="Dashboard"
      description="Welcome back! Here's what's happening with your inventory."
    >

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
              <stat.icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stat.color || 'text-foreground'}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.trend} {stat.trendValue}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActionsData.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className={`p-2 rounded-md ${action.bgColor}`}>
                      <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Link href="/dashboard/activity">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {activity.product}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getActivityColor(activity.type)}`}>
                          {activity.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Qty: {activity.quantity}</span>
                        {activity.type === 'transfer' ? (
                          <>
                            <span>From: {activity.from}</span>
                            <span>To: {activity.to}</span>
                          </>
                        ) : (
                          <span>Location: {activity.location}</span>
                        )}
                        <span>By: {activity.user}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </ModernPageLayout>
  )
}
