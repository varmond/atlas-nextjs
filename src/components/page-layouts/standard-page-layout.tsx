"use client"

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Download, 
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

interface StandardPageLayoutProps {
  // Header section
  title: string
  subtitle?: string
  stats?: Array<{
    label: string
    value: string | number
    icon: ReactNode
    color?: string
  }>
  
  // Actions section
  primaryAction?: {
    label: string
    icon?: ReactNode
    onClick?: () => void
    href?: string
  }
  secondaryActions?: Array<{
    label: string
    icon?: ReactNode
    onClick?: () => void
    href?: string
    variant?: "default" | "outline" | "ghost"
  }>
  
  // Search and filters
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showFilters?: boolean
  onFilterToggle?: () => void
  activeFiltersCount?: number
  
  // Content
  children: ReactNode
  
  // Loading state
  isLoading?: boolean
  loadingText?: string
  
  // Empty state
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function StandardPageLayout({
  title,
  subtitle,
  stats = [],
  primaryAction,
  secondaryActions = [],
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showFilters = false,
  onFilterToggle,
  activeFiltersCount = 0,
  children,
  isLoading = false,
  loadingText = "Loading...",
  isEmpty = false,
  emptyTitle = "No items found",
  emptyDescription = "Get started by creating your first item.",
  emptyAction,
}: StandardPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color || 'bg-gray-100'}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="flex items-center space-x-2"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </Button>
          )}
          
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              onClick={action.onClick}
              className="flex items-center space-x-2"
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      {(onSearchChange || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {showFilters && (
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} active
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onFilterToggle}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {isLoading ? (
          <Card className="p-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">{loadingText}</p>
              </div>
            </div>
          </Card>
        ) : isEmpty ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
              <p className="text-gray-500 mb-4">{emptyDescription}</p>
              {emptyAction && (
                <Button onClick={emptyAction.onClick}>
                  {emptyAction.label}
                </Button>
              )}
            </div>
          </Card>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
