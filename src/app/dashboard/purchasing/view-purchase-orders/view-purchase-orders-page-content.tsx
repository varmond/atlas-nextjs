"use client"

import { useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { User } from "@prisma/client"

function PurchaseOrderStatusBadge({ status }: { status: "DRAFT" | "POSTED" | "RECEIVED" | "CANCELLED" }) {
  const variants = {
    DRAFT: "default",
    POSTED: "success",
    RECEIVED: "success",
    CANCELLED: "destructive"
  } as const

  return (
    <Badge variant={variants[status]}>
      {status}
    </Badge>
  )
}

interface ViewPurchaseOrdersPageContentProps {
  user: User & {
    organization: {
      id: string
      name: string
    }
  }
}

export function ViewPurchaseOrdersPageContent({ user }: ViewPurchaseOrdersPageContentProps) {
  const router = useRouter()
  
  const { data: purchaseOrdersData, isLoading } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: async () => {
      const response = await client["purchase-order"].getPurchaseOrders.$get()
      return response.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrdersData?.purchaseOrders.map((po) => (
            <TableRow key={po.id}>
              <TableCell>{po.orderNumber}</TableCell>
              <TableCell>{format(new Date(po.createdAt), "PPP")}</TableCell>
              <TableCell>{po.vendor.name}</TableCell>
              <TableCell>{po.location.name}</TableCell>
              <TableCell>
                <PurchaseOrderStatusBadge status={po.status} />
              </TableCell>
              <TableCell>
                ${po.items
                  .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                  .toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/purchasing/${po.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 