"use client"

import { ReactNode, useMemo } from "react"
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
  ArrowLeft,
  Package
} from "lucide-react"

interface CardItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  metadata?: Array<{
    label: string
    value: string | number
    icon?: ReactNode
  }>
  badges?: Array<{
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
    color?: string
  }>
  actions?: Array<{
    label: string
    icon?: ReactNode
    onClick?: () => void
    href?: string
    variant?: "default" | "outline" | "ghost" | "destructive"
  }>
  onClick?: () => void
}

interface CardPageLayoutProps {
  // Header section
  title: string
  subtitle?: string
  stats?: Array<{
    label: string
    value: string | number
    icon: ReactNode
    color?: string
  }>
  
  // Card configuration
  items: CardItem[]
  loading?: boolean
  emptyMessage?: string
  
  // Actions
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
  
  // Card layout options
  columns?: 1 | 2 | 3 | 4
  cardClassName?: string
  
  // Loading and empty states
  loadingText?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function CardPageLayout({
  title,
  subtitle,
  stats = [],
  items = [],
  loading = false,
  emptyMessage = "No items found",
  primaryAction,
  secondaryActions = [],
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showFilters = false,
  onFilterToggle,
  activeFiltersCount = 0,
  columns = 3,
  cardClassName = "",
  loadingText = "Loading...",
  emptyTitle = "No items found",
  emptyDescription = "Get started by creating your first item.",
  emptyAction,
}: CardPageLayoutProps) {
  // Memoized grid columns
  const gridCols = useMemo(() => {
    const colMap = {
      1: "grid-cols-1",
      2: "grid-cols-1 lg:grid-cols-2",
      3: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3",
      4: "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
    }
    return colMap[columns]
  }, [columns])

  const isEmpty = !loading && items.length === 0

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
          <h2 className="text-lg font-semibold text-gray-900">
            {title} ({items.length})
          </h2>
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
      {loading ? (
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
              <Package className="w-8 h-8 text-gray-400" />
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
        <div className={`grid ${gridCols} gap-6`}>
          {items.map((item) => (
            <Card 
              key={item.id} 
              className={`p-6 hover:shadow-md transition-shadow cursor-pointer ${cardClassName}`}
              onClick={item.onClick}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
                    )}
                  </div>
                  {item.badges && item.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-2">
                      {item.badges.map((badge, index) => (
                        <Badge 
                          key={index} 
                          variant={badge.variant || "outline"}
                          className={badge.color}
                        >
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                {item.metadata && item.metadata.length > 0 && (
                  <div className="space-y-2">
                    {item.metadata.map((meta, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        {meta.icon && (
                          <span className="mr-2 text-gray-400">
                            {meta.icon}
                          </span>
                        )}
                        <span className="font-medium">{meta.label}:</span>
                        <span className="ml-1">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {item.actions && item.actions.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      {item.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick?.()
                          }}
                          className="flex items-center space-x-1"
                        >
                          {action.icon}
                          <span>{action.label}</span>
                        </Button>
                      ))}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
