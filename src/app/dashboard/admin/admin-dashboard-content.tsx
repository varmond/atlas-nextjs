"use client"

import { useState, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Simple toast function - replace with your preferred toast library
const useToast = () => ({
  toast: {
    success: (message: string) => console.log('✅', message),
    error: (message: string) => console.error('❌', message),
    warning: (message: string) => console.warn('⚠️', message),
    info: (message: string) => console.info('ℹ️', message)
  }
})
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Shield,
  Activity,
  Settings,
  BarChart3,
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"

interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  status: 'active' | 'suspended' | 'pending'
  maxUsers: number
  maxInventoryItems: number
  createdAt: string
  _count: {
    users: number
    inventory: number
  }
}

interface AdminStats {
  totalOrganizations: number
  totalUsers: number
  activeOrganizations: number
  totalRevenue: number
  newOrganizationsThisMonth: number
  newUsersThisMonth: number
  systemHealth: {
    databaseConnections: number
    apiResponseTime: number
    errorRate: number
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
  <Card className="p-0 border-0 shadow-sm hover:shadow-md transition-shadow [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">{trend}</span> {trendValue}
            </p>
          )}
        </div>
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>
  </Card>
))

StatCard.displayName = "StatCard"

// Memoized organization status badge
const OrganizationStatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", label: "Active" },
    suspended: { color: "bg-red-100 text-red-800", label: "Suspended" },
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  )
})

OrganizationStatusBadge.displayName = "OrganizationStatusBadge"

// Memoized plan badge
const PlanBadge = memo(({ plan }: { plan: string }) => {
  const planConfig = {
    free: { color: "bg-gray-100 text-gray-800", label: "Free" },
    pro: { color: "bg-blue-100 text-blue-800", label: "Pro" },
    enterprise: { color: "bg-purple-100 text-purple-800", label: "Enterprise" }
  }

  const config = planConfig[plan as keyof typeof planConfig] || planConfig.free

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  )
})

PlanBadge.displayName = "PlanBadge"

export const AdminDashboardContent = () => {
  const { toast } = useToast()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data for now
  const stats = {
    totalOrganizations: 5,
    totalUsers: 25,
    activeOrganizations: 4,
    totalRevenue: 15000,
    newOrganizationsThisMonth: 2,
    newUsersThisMonth: 8,
    systemHealth: {
      databaseConnections: 12,
      apiResponseTime: 45,
      errorRate: 0.5
    }
  }

  const organizationsData = {
    organizations: [
      {
        id: "1",
        name: "Test Organization 1",
        slug: "test-org-1",
        plan: "pro" as const,
        status: "active" as const,
        maxUsers: 50,
        maxInventoryItems: 1000,
        createdAt: "2024-01-15",
        _count: { users: 12, inventory: 150 }
      },
      {
        id: "2", 
        name: "Test Organization 2",
        slug: "test-org-2",
        plan: "free" as const,
        status: "active" as const,
        maxUsers: 10,
        maxInventoryItems: 100,
        createdAt: "2024-02-20",
        _count: { users: 5, inventory: 25 }
      }
    ],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1
  }

  // Memoized stats data
  const statsData = useMemo(() => {
    return [
      {
        title: "Total Organizations",
        value: stats.totalOrganizations.toLocaleString(),
        icon: Building2,
        trend: "+" + stats.newOrganizationsThisMonth,
        trendValue: "this month"
      },
      {
        title: "Total Users",
        value: stats.totalUsers.toLocaleString(),
        icon: Users,
        trend: "+" + stats.newUsersThisMonth,
        trendValue: "this month"
      },
      {
        title: "Active Organizations",
        value: stats.activeOrganizations,
        icon: CheckCircle,
        color: "text-green-600"
      },
      {
        title: "Monthly Revenue",
        value: `$${stats.totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        color: "text-green-600"
      }
    ]
  }, [stats])

  // Memoized organization columns
  const organizationColumns = useMemo(() => [
    {
      key: 'name' as keyof Organization,
      header: 'Organization',
      sortable: true,
      filterable: true,
      width: 200,
      render: (value: any, row: Organization) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'status' as keyof Organization,
      header: 'Status',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Organization) => (
        <OrganizationStatusBadge status={row.status} />
      ),
    },
    {
      key: 'plan' as keyof Organization,
      header: 'Plan',
      sortable: true,
      filterable: true,
      width: 100,
      render: (value: any, row: Organization) => (
        <PlanBadge plan={row.plan} />
      ),
    },
    {
      key: 'users' as keyof Organization,
      header: 'Users',
      sortable: true,
      filterable: true,
      width: 80,
      render: (value: any, row: Organization) => (
        <span className="font-medium">{row._count.users}</span>
      ),
    },
    {
      key: 'inventory' as keyof Organization,
      header: 'Inventory Items',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Organization) => (
        <span className="font-medium">{row._count.inventory}</span>
      ),
    },
    {
      key: 'createdAt' as keyof Organization,
      header: 'Created',
      sortable: true,
      filterable: true,
      width: 120,
      render: (value: any, row: Organization) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions' as keyof Organization,
      header: 'Actions',
      sortable: false,
      filterable: false,
      width: 120,
      render: (value: any, row: Organization) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="View Details"
            asChild
          >
            <Link href={`/dashboard/admin/organizations/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Edit Organization"
            asChild
          >
            <Link href={`/dashboard/admin/organizations/${row.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ], [])

          if (false) { // Loading state removed for now
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
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

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Support Overview</TabsTrigger>
          <TabsTrigger value="organizations">Customer Organizations</TabsTrigger>
          <TabsTrigger value="support">Support Tools</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalOrganizations || 0}
                </div>
                <div className="text-sm text-gray-500">Active Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.newOrganizationsThisMonth || 0}
                </div>
                <div className="text-sm text-gray-500">New This Month</div>
              </div>
            </div>
            </div>
          </Card>
          
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Support Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <UserPlus className="w-6 h-6" />
                <span>Add Customer</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Mail className="w-6 h-6" />
                <span>Send Support Email</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Activity className="w-6 h-6" />
                <span>View Recent Activity</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Settings className="w-6 h-6" />
                <span>System Settings</span>
              </Button>
            </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          {/* Organizations Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Organization
              </Button>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="overflow-x-auto overflow-hidden rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {organizationsData?.organizations?.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrganizationStatusBadge status={org.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PlanBadge plan={org.plan} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org._count.users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No organizations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Customer Support</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View Customer Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="w-4 h-4 mr-2" />
                    Reset User Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Manage User Access
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    View User Activity
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Account Management</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Suspend Organization
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Organization
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Usage Analytics
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.systemHealth.databaseConnections || 0}
                </div>
                <div className="text-sm text-gray-500">DB Connections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.systemHealth.apiResponseTime || 0}ms
                </div>
                <div className="text-sm text-gray-500">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats?.systemHealth.errorRate || 0}%
                </div>
                <div className="text-sm text-gray-500">Error Rate</div>
              </div>
            </div>
            </div>
          </Card>
          
          <Card className="p-0 border-0 shadow-sm [&>div:last-child]:ring-0 [&>div:last-child]:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Maintenance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Settings className="w-6 h-6" />
                <span>System Configuration</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span>Performance Monitoring</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Shield className="w-6 h-6" />
                <span>Security Settings</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Activity className="w-6 h-6" />
                <span>Backup & Recovery</span>
              </Button>
            </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboardContent
