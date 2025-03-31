"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { ArrowUpDown, Eye, Package } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Products } from "@prisma/client"

export const ProductsPageContent = () => {
  // State for table sorting
  const [sorting, setSorting] = useState<SortingState>([])

  // Query to fetch products
  const { data, isPending: isProductsLoading } = useQuery({
    queryKey: ["user-products"],
    queryFn: async () => {
      // In a real implementation, this would be a call to your API
      const res = await client.product.getProducts.$get()
      return await res.json()
    },
  })

  // Define table columns
  const columns: ColumnDef<Products>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <div>{row.getValue("sku") || "N/A"}</div>,
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>${row.getValue("price") || "0.00"}</div>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Added
            <ArrowUpDown className="ml-2 size-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/dashboard/products/${row.original.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
            >
              <Eye className="size-4" />
              View
            </Button>
          </Link>
        )
      },
    },
  ]

  // Set up table with data
  const table = useReactTable({
    data: data?.products || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // Show loading state
  if (isProductsLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <LoadingSpinner />
      </div>
    )
  }

  // Show empty state if no products
  if (!data?.products || data.products.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center rounded-2xl flex-1 text-center p-6">
        <div className="flex justify-center w-full">
          <Package className="size-24 text-gray-300" />
        </div>
        <h1 className="mt-6 text-xl/8 font-medium tracking-tight text-gray-900">
          No Products Yet
        </h1>
        <p className="text-sm/6 text-gray-600 max-w-prose mt-2 mb-8">
          Start managing your inventory by adding your first product
        </p>

        <Link href="/dashboard/add-inventory">
          <Button className="flex items-center space-x-2">
            <span className="size-5">✨</span>
            <span>Add Product</span>
          </Button>
        </Link>
      </Card>
    )
  }

  // Render products table
  return (
    <div className="space-y-4">
      <Card contentClassName="px-6 py-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant={"outline"}
          size={"sm"}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant={"outline"}
          size={"sm"}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
