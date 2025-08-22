"use client"

import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Card } from './card'
import { debounce, throttle, createVirtualScroller, PERFORMANCE_CONSTANTS } from '@/lib/performance'

interface Column<T> {
  key: keyof T
  header: string
  sortable?: boolean
  filterable?: boolean
  width?: number
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

type SortDirection = 'asc' | 'desc' | null

// Memoized table header component
const TableHeader = memo(<T extends Record<string, any>>({
  columns,
  sortColumn,
  sortDirection,
  onSort,
  onSelectAll,
  selectable,
  allSelected,
  indeterminate
}: {
  columns: Column<T>[]
  sortColumn: keyof T | null
  sortDirection: SortDirection
  onSort: (column: keyof T) => void
  onSelectAll: (selected: boolean) => void
  selectable?: boolean
  allSelected: boolean
  indeterminate: boolean
}) => (
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      {selectable && (
        <th className="px-4 py-3 text-left">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = indeterminate
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
        </th>
      )}
      {columns.map((column) => (
        <th
          key={String(column.key)}
          className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
            column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
          }`}
          style={{ width: column.width }}
          onClick={() => column.sortable && onSort(column.key)}
        >
          <div className="flex items-center space-x-1">
            <span>{column.header}</span>
            {column.sortable && (
              <div className="flex flex-col">
                {sortColumn === column.key ? (
                  sortDirection === 'asc' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )
                ) : (
                  <ChevronsUpDown className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </th>
      ))}
    </tr>
  </thead>
))

// Memoized table row component
const TableRow = memo(<T extends Record<string, any>>({
  row,
  columns,
  selectable,
  selected,
  onSelect,
  onRowClick,
  index
}: {
  row: T
  columns: Column<T>[]
  selectable?: boolean
  selected: boolean
  onSelect: (selected: boolean) => void
  onRowClick?: (row: T) => void
  index: number
}) => (
  <tr
    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
      onRowClick ? 'cursor-pointer' : ''
    } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
    onClick={() => onRowClick?.(row)}
  >
    {selectable && (
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
      </td>
    )}
    {columns.map((column) => (
      <td key={String(column.key)} className="px-4 py-3 text-sm text-gray-900">
        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
      </td>
    ))}
  </tr>
))

// Virtual scrolling table body
const VirtualTableBody = memo(<T extends Record<string, any>>({
  data,
  columns,
  selectable,
  selectedRows,
  onSelectRow,
  onRowClick,
  itemHeight = PERFORMANCE_CONSTANTS.VIRTUAL_SCROLL_ITEM_HEIGHT
}: {
  data: T[]
  columns: Column<T>[]
  selectable?: boolean
  selectedRows: Set<string>
  onSelectRow: (id: string, selected: boolean) => void
  onRowClick?: (row: T) => void
  itemHeight?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight)
    }
  }, [])

  const virtualScroller = useMemo(() => 
    createVirtualScroller(data, itemHeight, containerHeight),
    [data, itemHeight, containerHeight]
  )

  const visibleItems = useMemo(() => 
    virtualScroller.getVisibleItems(scrollTop),
    [virtualScroller, scrollTop]
  )

  const handleScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, PERFORMANCE_CONSTANTS.THROTTLE_DELAY),
    []
  )

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: '400px' }}
      onScroll={handleScroll}
    >
      <div style={{ height: virtualScroller.totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            <TableRow
              row={item}
              columns={columns}
              selectable={selectable}
              selected={selectedRows.has(String(index))}
              onSelect={(selected) => onSelectRow(String(index), selected)}
              onRowClick={onRowClick}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  )
})

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 50,
  searchable = true,
  sortable = true,
  filterable = true,
  selectable = false,
  onRowClick,
  onSelectionChange,
  loading = false,
  emptyMessage = "No data available",
  className = ""
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce(setSearchTerm, PERFORMANCE_CONSTANTS.DEBOUNCE_DELAY),
    []
  )

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((column) => {
          const value = row[column.key]
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const comparison = aVal < bVal ? -1 : 1
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection, columns])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  // Selection handlers
  const handleSelectRow = useCallback((id: string, selected: boolean) => {
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
    onSelectionChange?.(paginatedData.filter((_, index) => newSelected.has(String(index))))
  }, [selectedRows, onSelectionChange, paginatedData])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const newSelected = new Set(paginatedData.map((_, index) => String(index)))
      setSelectedRows(newSelected)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }, [paginatedData, onSelectionChange])

  // Sort handler
  const handleSort = useCallback((column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn, sortDirection])

  // Selection state
  const allSelected = selectedRows.size === paginatedData.length && paginatedData.length > 0
  const indeterminate = selectedRows.size > 0 && selectedRows.size < paginatedData.length

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {/* Search and filters */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader
            columns={columns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            selectable={selectable}
            allSelected={allSelected}
            indeterminate={indeterminate}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  row={row}
                  columns={columns}
                  selectable={selectable}
                  selected={selectedRows.has(String(index))}
                  onSelect={(selected) => handleSelectRow(String(index), selected)}
                  onRowClick={onRowClick}
                  index={index}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, processedData.length)} of{' '}
              {processedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
