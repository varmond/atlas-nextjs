"use client"

import { buttonVariants } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/utils"
import { UserButton } from "@clerk/nextjs"
import {
  Gem,
  Home,
  Key,
  LucideIcon,
  Menu,
  Settings,
  X,
  Plus,
  Table,
  ListOrdered,
  Package,
  DollarSign,
  ArrowRightLeft,
  MinusCircleIcon,
  ClockIcon,
  Building2,
  BarChart3,
  Users,
  FileText,
  ShoppingCart,
  Warehouse,
  Activity,
  TrendingUp,
  AlertTriangle,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { PropsWithChildren, useState, useMemo, memo } from "react"
import { OrganizationSwitcher } from "@/components/organization-switcher"

interface SidebarItem {
  href: string
  icon: LucideIcon
  text: string
  badge?: string
}

interface SidebarCategory {
  category: string
  items: SidebarItem[]
}

// Memoized sidebar items to prevent recreation on every render
const SIDEBAR_ITEMS: SidebarCategory[] = [
  {
    category: "Overview",
    items: [
      { href: "/dashboard", icon: Home, text: "Dashboard" },
      { href: "/dashboard/activity", icon: Activity, text: "Activity Feed" },
    ],
  },
  {
    category: "Data Management",
    items: [
      { href: "/dashboard/products", icon: Package, text: "Products" },
      { href: "/dashboard/locations", icon: Building2, text: "Locations" },
      { href: "/dashboard/memberships", icon: Users, text: "Memberships" },
    ],
  },
  {
    category: "Inventory Management",
    items: [
      { href: "/dashboard/add-inventory", icon: Plus, text: "Add Inventory" },
      { href: "/dashboard/view-inventory", icon: Warehouse, text: "View Inventory" },
      { href: "/dashboard/transfers", icon: ArrowRightLeft, text: "Transfers" },
      { href: "/dashboard/transfers/history", icon: ClockIcon, text: "Transfer History" },
      { href: "/dashboard/dispense", icon: MinusCircleIcon, text: "Dispense" },
      { href: "/dashboard/dispense/history", icon: ClockIcon, text: "Dispense History" },
    ],
  },
  {
    category: "Financial",
    items: [
      { href: "/dashboard/invoices/create-invoice", icon: Plus, text: "Create Invoice" },
      { href: "/dashboard/invoices/view-invoices", icon: FileText, text: "Invoices" },
      { href: "/dashboard/purchasing/view-purchase-orders", icon: ShoppingCart, text: "Purchase Orders" },
    ],
  },
  {
    category: "Analytics & Reports",
    items: [
      { href: "/dashboard/reports", icon: BarChart3, text: "Reports & Analytics" },
      { href: "/dashboard/activity", icon: Activity, text: "Activity History" },
      { href: "/dashboard/reports/inventory", icon: Package, text: "Inventory Reports" },
      { href: "/dashboard/reports/sales", icon: TrendingUp, text: "Sales Analytics" },
      { href: "/dashboard/reports/alerts", icon: AlertTriangle, text: "Alerts & Notifications" },
    ],
  },
  {
    category: "Administration",
    items: [
      { href: "/dashboard/admin/organizations", icon: Building2, text: "Organizations" },
      { href: "/dashboard/account-settings", icon: Settings, text: "Account Settings" },
      { href: "/dashboard/api-key", icon: Key, text: "API Keys" },
    ],
  },
]

// Memoized sidebar component
const Sidebar = memo(({ onClose }: { onClose?: () => void }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo Section */}
      <div className="flex-shrink-0 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Peppers<span className="text-brand-600">Atlas</span>
            </p>
            <p className="text-xs text-gray-500">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6">
          {SIDEBAR_ITEMS.map(({ category, items }) => (
            <div key={category} className="px-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        "text-gray-700 hover:text-brand-700 hover:bg-brand-50",
                        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                      )}
                      onClick={onClose}
                    >
                      <item.icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-brand-600 transition-colors" />
                      <span className="flex-1">{item.text}</span>
                      {item.badge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User Section */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
        <div className="space-y-3">
          <OrganizationSwitcher />
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-white border border-gray-200">
            <UserButton
              showName
              appearance={{
                elements: {
                  userButtonBox: "flex-row-reverse w-full",
                  userButtonTrigger: "w-full",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

Sidebar.displayName = "Sidebar"

// Memoized mobile header component
const MobileHeader = memo(({ onMenuClick }: { onMenuClick: () => void }) => (
  <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
        <Package className="w-5 h-5 text-white" />
      </div>
      <p className="text-lg font-semibold text-gray-900">
        Peppers<span className="text-brand-600">Atlas</span>
      </p>
    </div>
    <div className="flex items-center space-x-2">
      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
        <Bell className="w-5 h-5 text-gray-600" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          3
        </span>
      </button>
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>
))

MobileHeader.displayName = "MobileHeader"

const Layout = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Memoized handlers
  const handleMenuClick = useMemo(() => () => setIsDrawerOpen(true), [])
  const handleCloseDrawer = useMemo(() => () => setIsDrawerOpen(false), [])

  return (
    <div className="relative h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Modal
          className="p-0"
          showModal={isDrawerOpen}
          setShowModal={setIsDrawerOpen}
        >
          <div className="h-full w-80">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Peppers<span className="text-brand-600">Atlas</span>
                </p>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <Sidebar onClose={handleCloseDrawer} />
          </div>
        </Modal>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={handleMenuClick} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}

export default Layout
