"use client"

import { LoadingSpinner } from "@/components/loading-spinner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Warehouse
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

// Memoized utility functions
const getActivityIcon = memo(({ type }: { type: string }) => {
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
})

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
  const statsData = useMemo(() => [
    {
      title: "Total Inventory Items",
      value: mockInventoryStats.totalItems.toLocaleString(),
      icon: Package,
      trend: "+12%",
      trendValue: "from last month"
    },
    {
      title: "Low Stock Items",
      value: mockInventoryStats.lowStock,
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Expiring Soon",
      value: mockInventoryStats.expiringSoon,
      icon: Clock,
      color: "text-red-600"
    },
    {
      title: "Total Value",
      value: `$${mockInventoryStats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      trend: "+8%",
      trendValue: "from last month"
    }
  ], [])

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

  if (isEventCategoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Workflow Guide */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started with Inventory</h3>
            <p className="text-sm text-gray-600 mb-4">
              Follow this workflow to properly set up your inventory system:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <span className="text-gray-700">Create Products in your catalog</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-green-600">2</span>
                </div>
                <span className="text-gray-700">Add Inventory items for each product</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-purple-600">3</span>
                </div>
                <span className="text-gray-700">Manage stock levels and transactions</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActionsData.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent Activity</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Latest inventory transactions and updates
          </p>
        </div>
        
        <div className="space-y-4">
          {mockRecentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <Link href="/dashboard/activity">
            <Button variant="outline" className="w-full">
              View All Activity
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Legacy Categories Section - Keep for now but mark as deprecated */}
      {/* {categories && categories.length > 0 && (
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Event Categories (Legacy)</h2>
            <p className="text-sm text-gray-600 mt-1">
              These are legacy event tracking categories. Consider migrating to the new inventory system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.map((category) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>
        </Card>
      )} */}
    </div>
  )
}
