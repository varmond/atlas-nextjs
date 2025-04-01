"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import {
  ArrowUpDown,
  Download,
  Filter,
  Plus,
  Search,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { client } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"

interface InventoryItem {
  id: string
  productId: string
  price: number | string // Handle both number and string representations
  packageCost: number | string
  lotNumber: string
  expirationDate: string | Date
  serialNumber: string
  vendor: string
  manufacturer: string
  unitsReceived: number
  createdAt: string | Date
  updatedAt: string | Date
  product: {
    name: string
    sku: string
  }
  User?: {
    name: string
  }
}

interface ViewInventoryPageContentProps {
  initialInventory?: InventoryItem[]
}

export function ViewInventoryPageContent({
  initialInventory = [],
}: ViewInventoryPageContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Fetch inventory data
  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await client.inventory.getInventory.$get()
      const data = await response.json()
      return data.inventoryItems
    },
    initialData: initialInventory,
  })

  // Filter inventory based on search term
  const filteredInventory = data.filter(
    (item: InventoryItem) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort by function
  const handleSort = (field: keyof InventoryItem) => {
    // In a real implementation, we'd maintain state here
    // and re-sort the data
    console.log(`Sorting by ${field}`)
  }

  // Export to CSV
  const exportToCsv = () => {
    try {
      // Convert inventory data to CSV format
      const headers = [
        "Product",
        "SKU",
        "Units",
        "Price",
        "Package Cost",
        "Lot Number",
        "Serial Number",
        "Expiration Date",
        "Vendor",
        "Manufacturer",
        "Received By",
        "Received Date",
      ]

      const csvData = filteredInventory.map((item: InventoryItem) => [
        item.product.name,
        item.product.sku,
        item.unitsReceived,
        typeof item.price === "number" ? item.price.toFixed(2) : item.price,
        typeof item.packageCost === "number"
          ? item.packageCost.toFixed(2)
          : item.packageCost,
        item.lotNumber,
        item.serialNumber,
        format(new Date(item.expirationDate), "yyyy-MM-dd"),
        item.vendor,
        item.manufacturer,
        item.User?.name || "Unknown",
        format(new Date(item.createdAt), "yyyy-MM-dd"),
      ])

      // Combine headers and data
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n")

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `inventory_export_${format(new Date(), "yyyy-MM-dd")}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: "Your inventory data has been exported to CSV",
      })
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search inventory..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("product")}>
                Sort by Product Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("expirationDate")}>
                Sort by Expiration Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("createdAt")}>
                Sort by Received Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("unitsReceived")}>
                Sort by Quantity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={exportToCsv}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/add-inventory">
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("product")}
                >
                  Product
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Lot #</TableHead>
              <TableHead>Serial #</TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("expirationDate")}
                >
                  Expiration
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("unitsReceived")}
                >
                  Units
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  Unit Price
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading inventory...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item: InventoryItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.product.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.product.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.lotNumber}</TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell>
                    {format(new Date(item.expirationDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{item.unitsReceived}</TableCell>
                  <TableCell>
                    $
                    {typeof item.price === "number"
                      ? item.price.toFixed(2)
                      : parseFloat(item.price as string).toFixed(2)}
                  </TableCell>
                  <TableCell>{item.vendor}</TableCell>
                  <TableCell>
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
