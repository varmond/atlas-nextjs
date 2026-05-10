"use client"

import React, { useState, useMemo, useCallback, memo } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Card } from './card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table'
import { debounce, PERFORMANCE_CONSTANTS } from '@/lib/performance'

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
      <div className={className}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Search and filters */}
      {(searchable || filterable) && (
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
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
            
            {/* Mobile Stats */}
            <div className="lg:hidden flex items-center justify-between text-sm text-gray-600">
              <span>{processedData.length} total items</span>
              {selectedRows.size > 0 && (
                <span className="text-brand-600 font-medium">
                  {selectedRows.size} selected
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3 p-4">
          {paginatedData.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            paginatedData.map((row, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-100 p-4 space-y-3"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500 capitalize">
                      {column.header}
                    </span>
                    <div className="text-sm text-gray-900 text-right flex-1 ml-4">
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </div>
                  </div>
                ))}
                {selectable && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Select</span>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(String(index))}
                      onChange={(e) => handleSelectRow(String(index), e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = indeterminate
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
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
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="text-center text-gray-500 py-8"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={onRowClick ? 'cursor-pointer' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(String(index))}
                          onChange={(e) => handleSelectRow(String(index), e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100">
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
      
      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="lg:hidden px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex-1 mr-2"
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
              className="flex-1 ml-2"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}