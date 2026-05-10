"use client"

import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserButton } from "@clerk/nextjs"
import {
  Home,
  Package,
  Building2,
  Warehouse,
  Plus,
  ArrowRightLeft,
  MinusCircle,
  BarChart3,
  Settings,
  Users,
  FileText,
  ShoppingCart,
  Bell,
  ChevronRight,
  LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"
import { OrganizationSwitcher } from "@/components/organization-switcher"

interface SidebarItem {
  href: string
  icon: LucideIcon
  label: string
  badge?: string
  isActive?: boolean
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", icon: Home, label: "Dashboard" },
      { href: "/dashboard/design-test", icon: Settings, label: "Design Test" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/dashboard/view-inventory", icon: Warehouse, label: "View Inventory" },
      { href: "/dashboard/add-inventory", icon: Plus, label: "Add Inventory" },
      { href: "/dashboard/transfers", icon: ArrowRightLeft, label: "Transfers" },
      { href: "/dashboard/dispense", icon: MinusCircle, label: "Dispense" },
    ],
  },
  {
    title: "Products & Data",
    items: [
      { href: "/dashboard/products", icon: Package, label: "Products" },
      { href: "/dashboard/locations", icon: Building2, label: "Locations" },
    ],
  },
  {
    title: "Reports & Analytics",
    items: [
      { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
      { href: "/dashboard/activity", icon: Bell, label: "Activity" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/dashboard/users", icon: Users, label: "Users" },
      { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
      { href: "/dashboard/purchasing", icon: ShoppingCart, label: "Purchase Orders" },
    ],
  },
]

const SidebarItem = memo(({ item }: { item: SidebarItem }) => {
  const pathname = usePathname()
  const isActive = pathname === item.href

  return (
    <Link href={item.href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start h-9 px-3 text-sm font-normal",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <item.icon className="mr-3 h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
            {item.badge}
          </Badge>
        )}
        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
      </Button>
    </Link>
  )
})

SidebarItem.displayName = "SidebarItem"

const SidebarSection = memo(({ section }: { section: SidebarSection }) => (
  <div className="space-y-1">
    <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {section.title}
    </h4>
    <div className="space-y-1">
      {section.items.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
    </div>
  </div>
))

SidebarSection.displayName = "SidebarSection"

export const Sidebar = memo(() => {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo Section */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">
              Peppers<span className="text-primary">Atlas</span>
            </span>
            <span className="text-xs text-muted-foreground">Inventory Management</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {SIDEBAR_SECTIONS.map((section) => (
            <SidebarSection key={section.title} section={section} />
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="space-y-3">
          <OrganizationSwitcher />
          <div className="flex items-center space-x-3 rounded-lg border p-2">
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
